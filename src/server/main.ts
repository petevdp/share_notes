import 'reflect-metadata';
import 'module-alias/register';

import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import { ApolloServer } from 'apollo-server-express';
import * as TypeORM from 'typeorm';
import { Container } from 'typedi';
import { buildSchema } from 'type-graphql';
import { API_PORT, YJS_ROOM } from 'Shared/environment';
import { authRouter } from './auth';
import { UserResolver } from './resolvers/userResolver';
import { RoomResolver } from './resolvers/roomResolver';
import { createDatabaseConnection } from './db';
import { setupWSConnection, docs, WSSharedDoc } from 'y-websocket/bin/utils';

TypeORM.useContainer(Container);
async function runServer() {
  await createDatabaseConnection();
  console.log('schema path: ', __dirname + '/schema.gql');

  // build graphql schema, create http server
  const httpServer = await (async () => {
    const app = express();

    const schema = await buildSchema({
      resolvers: [UserResolver, RoomResolver],
      container: Container,
      emitSchemaFile: true,
    });

    const apolloServer = new ApolloServer({
      schema,
      context: ({ req, res }) => {
        return { githubSessionToken: req.get('Authorization') };
      },
    });
    app.use('/auth', authRouter);
    apolloServer.applyMiddleware({ app });
    return http.createServer(app);
  })();

  // setup websocket server
  (() => {
    const websocketServer = new WebSocket.Server({ server: httpServer, path: '/socket/yjs-room' });
    websocketServer.on('connection', (conn, req) => setupWSConnection(conn, req, { gc: true }));
  })();

  httpServer.listen({ port: API_PORT }, () => {
    console.log('running on ', API_PORT);
  });
}

if (require.main === module) {
  runServer();
}
