import 'cross-fetch/polyfill';

import ApolloClient, { gql } from 'apollo-boost';
import axios from 'axios';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import express, { Router } from 'express';
import querystring from 'querystring';
import * as GithubUtils from 'Server/utils/githubUtils';
import {
  DEV_SERVER_PORT,
  GITHUB_0AUTH_ACCESS_TOKEN_URL,
  GITHUB_CLIENT_ID,
  GITHUB_GRAPHQL_API_URL,
  SESSION_TOKEN_COOKIE_KEY,
} from 'Shared/environment';
import { Repository } from 'typeorm';

import { Context } from './context';
import { User } from './models/user';
import { TedisService, USER_ID_BY_SESSION_KEY } from './services/tedisService';
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

config();

export const getAuthRouter = (tedisService: TedisService, userRepository: Repository<User>) => {
  const authRouter = Router();

  authRouter.use(bodyParser.json({ type: 'application/*+json' }));
  authRouter.get('/redirect', async (req, res) => {
    const oathCode = req.query.code as string;

    const params: github0AuthIdentityParams = {
      code: oathCode,
      client_id: GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET as string,
    };

    const githubRes = await axios.get<string>(GITHUB_0AUTH_ACCESS_TOKEN_URL, { params });

    const githubResData = (querystring.parse(githubRes.data) as unknown) as github0AuthResponse;
    console.log('data', githubResData);

    const githubClient = new ApolloClient({
      uri: GITHUB_GRAPHQL_API_URL,
      headers: { Authorization: `${githubResData.token_type} ${githubResData.access_token}` },
    });

    const context: Context = {
      githubSessionToken: githubResData.access_token,
    };

    const userQueryResult = await GithubUtils.runQuery<GithubUtils.extraUserDetailsQueryResult>(
      GithubUtils.EXTRA_USER_DETAILS_QUERY,
      context,
    );

    if (userQueryResult) {
      const { viewer } = userQueryResult;
      let user = await userRepository.findOne({ where: { githubDatabaseId: viewer.databaseId } });
      if (!user) {
        user = await userRepository.create({
          githubDatabaseId: viewer.databaseId,
          githubLogin: viewer.login,
        });
        user = await userRepository.save(user);
      }
      res.cookie(SESSION_TOKEN_COOKIE_KEY, githubResData.access_token);
      tedisService.tedis.hset(USER_ID_BY_SESSION_KEY, githubResData.access_token, user.id);
    } else {
      throw "couldn't find github user";
    }
    res.redirect(`http://localhost:${DEV_SERVER_PORT}`);
  });

  authRouter.get('/logout', (req, res) => {
    if (req.cookies(SESSION_TOKEN_COOKIE_KEY)) {
      tedisService.tedis.hdel(USER_ID_BY_SESSION_KEY, req.cookies(SESSION_TOKEN_COOKIE_KEY));
      res.cookie(SESSION_TOKEN_COOKIE_KEY, '');
    }
    res.status(200);
  });

  return authRouter;
};
