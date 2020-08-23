import 'module-alias/register';

import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import expressWs from 'express-ws';
import { ApolloServer } from 'apollo-server-express';
import * as TypeORM from 'typeorm';
import { Container } from 'typedi';
import { buildSchema } from 'type-graphql';
import { GITHUB_CLIENT_ID, API_PORT, YJS_WEBSOCKET_PATH } from 'Shared/environment';
import * as serverPaths from 'Server/paths';
import { authRouter } from './auth';
import { UserResolver } from './resolvers/userResolver';
import { RoomResolver } from './resolvers/roomResolver';
import { createDatabaseConnection } from './db';
import { setupWSConnection } from 'y-websocket/bin/utils.js';
TypeORM.useContainer(Container);

console.log(serverPaths.DIST);

async function runServer() {
  const c = await createDatabaseConnection();
  console.log('schema path: ', __dirname + '/schema.gql');
  const schema = await buildSchema({
    resolvers: [UserResolver, RoomResolver],
    container: Container,
    emitSchemaFile: true,
  });
  const app = express();
  const apolloServer = new ApolloServer({ schema });
  app.use('/auth', authRouter);

  expressWs(app);
  apolloServer.applyMiddleware({ app });

  const httpServer = http.createServer(app);

  const websocketServer = new WebSocket.Server({ server: httpServer, path: '/yjsSocket/editorSocket' });
  websocketServer.on('connection', (conn, req) =>
    setupWSConnection(conn, req, { gc: req.url.slice(1) !== 'prosemirror-versions' }),
  );

  httpServer.listen({ port: API_PORT }, () => {
    console.log('running on ', API_PORT);
  });
}

if (require.main === module) {
  runServer();
}
