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
import { print } from 'graphql';
import { YdocService } from './services/ydocService';
import { Doc } from 'yjs';

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

    const apolloServer = new ApolloServer({ schema });
    app.use('/auth', authRouter);
    apolloServer.applyMiddleware({ app });
    return http.createServer(app);
  })();

  // set up ydoc websocket endpoint and ydoc service
  (() => {
    const doc = new WSSharedDoc(YJS_ROOM) as Doc;
    docs.set(YJS_ROOM, doc);
    Container.set(YdocService, new YdocService(doc));

    const websocketServer = new WebSocket.Server({ server: httpServer, path: '/socket/yjs-room' });
    websocketServer.on('connection', (conn, req) =>
      setupWSConnection(conn, req, { gc: req.url.slice(1) !== 'prosemirror-versions' }),
    );
  })();

  httpServer.listen({ port: API_PORT }, () => {
    console.log('running on ', API_PORT);
  });
}

if (require.main === module) {
  runServer();
}
