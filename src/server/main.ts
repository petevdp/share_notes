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
import { getAuthRouter } from './auth';
import { Context } from './context';
import { UserResolver } from './resolvers/userResolver';
import { RoomResolver } from './resolvers/roomResolver';
import { createDatabaseConnection } from './db';
import { setupWSConnection, docs, WSSharedDoc } from 'y-websocket/bin/utils';
import { OrmManager } from 'typeorm-typedi-extensions';
import { TedisService } from './services/tedisService';
import { getAuthChecker } from './authChecker';
import { User } from './models/user';

TypeORM.useContainer(Container);
async function runServer() {
  const dbConnection = await createDatabaseConnection();
  console.log('schema path: ', __dirname + '/schema.gql');

  // build graphql schema, create http server
  const httpServer = await (async () => {
    const app = express();
    const tedisService = Container.get(TedisService);
    // const userRepository = Container.get()
    const schema = await buildSchema({
      resolvers: [UserResolver, RoomResolver],
      container: Container,
      emitSchemaFile: true,
      authChecker: getAuthChecker(tedisService),
    });

    const apolloServer = new ApolloServer({
      schema,
      context: async ({ req, res }) => {
        const token = req.get('Authorization');
        return { githubSessionToken: token };
      },
    });

    const userRepository = dbConnection.getRepository(User);
    app.use('/auth', getAuthRouter(tedisService, userRepository));
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
