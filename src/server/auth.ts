import express, { Router } from 'express';
import axios from 'axios';
import 'cross-fetch/polyfill';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import ApolloClient, { gql } from 'apollo-boost';
import { Tedis } from 'tedis';
import { URL } from 'url';
import {
  GITHUB_0AUTH_ACCESS_TOKEN_URL,
  GITHUB_CLIENT_ID,
  GITHUB_GRAPHQL_API_URL,
  DEV_SERVER_PORT,
} from 'Shared/environment';
import { resolve } from 'path';
import cookieParser from 'cookie-parser';

import querystring from 'querystring';
export const authRouter = Router();

authRouter.use(bodyParser.json({ type: 'application/*+json' }));
authRouter.use(cookieParser());
config();
interface github0AuthIdentityParams {
  client_id: string;
  client_secret: string;
  code: string;
  redirect_url?: string;
  state?: string;
}

interface github0AuthResponse {
  access_token: string;
  token_type: string;
}

authRouter.get('/', async (req, res) => {
  const tedis = new Tedis({
    host: '127.0.0.1',
    port: 6379,
  });

  const oathCode = req.query.code as string;

  const params: github0AuthIdentityParams = {
    code: oathCode,
    client_id: GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
  };
  console.log('params: ', params);

  const githubRes = await axios.get<string>(GITHUB_0AUTH_ACCESS_TOKEN_URL, { params });

  const userEndpoint = new URL('/user', GITHUB_GRAPHQL_API_URL);

  const githubResData = (querystring.parse(githubRes.data) as unknown) as github0AuthResponse;
  console.log('data', githubResData);

  const githubClient = new ApolloClient({
    uri: GITHUB_GRAPHQL_API_URL,
    headers: { Authorization: `${githubResData.token_type} ${githubResData.access_token}` },
  });

  const queryResult = await githubClient.query<{ viewer: { id: string } }>({
    query: gql`
      {
        viewer {
          id
        }
      }
    `,
  });
  tedis.hset('session', githubResData.access_token, queryResult.data.viewer.id).then((res) => {
    console.log('session res: ', res);
  });
  res.cookie('session-token', githubResData.access_token);
  res.redirect(`http://localhost:${DEV_SERVER_PORT}`);
});
