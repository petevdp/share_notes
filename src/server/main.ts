import 'reflect-metadata';
import 'module-alias/register';

import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
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
import { RoomVisitResolver } from './resolvers/roomVisitResolver';
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
    const tedisService = Container.get(TedisService);
    // const userRepository = Container.get()
    const schema = await buildSchema({
      resolvers: [UserResolver, RoomResolver, RoomVisitResolver],
      container: Container,
      emitSchemaFile: true,
      authChecker: getAuthChecker(tedisService),
    });

    const loggingPlugin: ApolloServerPlugin = {
      requestDidStart: (requestContext) => {
        if (requestContext.request.operationName !== 'IntrospectionQuery') {
          // console.log('gql query: ');
          // console.log(requestContext.request.query);
        }
        // console.log(requestContext.request.query);
        // console.log(requestContext.request.query);
        // console.log(requestContext.request.variables);
        // console.log(requestContext.response?.data);
      },
    };

    const apolloServer = new ApolloServer({
      schema,
      context: async ({ req }) => ({ githubSessionToken: req.cookies['session-token'] }),
      plugins: [loggingPlugin],
    });

    const userRepository = dbConnection.getRepository(User);

    app.use(cookieParser());
    apolloServer.applyMiddleware({ app });
    app.use('/auth', getAuthRouter(tedisService, userRepository));
    return http.createServer(app);
  })();

  // setup websocket server
  (() => {
    const yjsService = Container.get(YjsService);
    const websocketServer = new WebSocket.Server({ server: httpServer });
    websocketServer.on('connection', (conn: WebSocket, req) => {
      if (!(req.url && /^\/websocket\/yjs\-room\/.+$/.test(req.url))) {
        console.log('invalid upgrade');
        return;
      }
      yjsService.setupWsConnection(conn, req);
    });
  })();

  httpServer.listen({ port: API_PORT }, () => {
    console.log('running on ', API_PORT);
  });
}

if (require.main === module) {
  runServer();
}
