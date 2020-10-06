import 'reflect-metadata';
import 'module-alias/register';

import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import express from 'express';
import http from 'http';
import { API_PORT } from 'Shared/environment';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import * as TypeORM from 'typeorm';
import WebSocket from 'ws';

import { getAuthChecker } from './authChecker';
import { getAuthRouter } from './authRouter';
import { createDatabaseConnection } from './db';
import { User } from './models/user';
import { RoomResolver } from './resolvers/roomResolver';
import { UserResolver } from './resolvers/userResolver';
import { TedisService } from './services/tedisService';
import { YjsService } from './services/yjsService';

TypeORM.useContainer(Container);
async function runServer() {
  const dbConnection = await createDatabaseConnection();
  console.log('schema path: ', __dirname + '/schema.gql');

  // build graphql schema, create http server
  const httpServer = await (async () => {
    const app = express();
    app.use(cookieParser());
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
      context: async ({ req }) => {
        return { githubSessionToken: req.cookies['session-token'] };
      },
    });

    const userRepository = dbConnection.getRepository(User);

    app.use('/auth', getAuthRouter(tedisService, userRepository));
    apolloServer.applyMiddleware({ app });
    return http.createServer(app);
  })();

  // setup websocket server
  (() => {
    const yjsService = Container.get(YjsService);
    const websocketServer = new WebSocket.Server({ server: httpServer });
    websocketServer.on('connection', (conn: WebSocket, req) => {
      if (req.url && /^\/websocket\/yjs\-room\/.+$/.test(req.url)) {
        yjsService.setupWsConnection(conn, req);
      } else {
        console.log('invalid upgrade');
      }
    });
  })();

  httpServer.listen({ port: API_PORT }, () => {
    console.log('running on ', API_PORT);
  });
}

if (require.main === module) {
  runServer();
}
