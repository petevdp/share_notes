import 'cross-fetch/polyfill';

import axios from 'axios';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import { Router } from 'express';
import querystring from 'querystring';
import * as GithubUtils from 'Server/utils/githubUtils';
import { GITHUB_0AUTH_ACCESS_TOKEN_URL, GITHUB_CLIENT_ID, SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';
import { Repository } from 'typeorm';

import { User } from './models/user';
import { TedisService, TOKEN_BY_USER_ID, USER_ID_BY_SESSION_KEY } from './services/tedisService';

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

    const userQueryResult = await GithubUtils.runQuery<GithubUtils.extraUserDetailsQueryResult>(
      GithubUtils.EXTRA_USER_DETAILS_QUERY,
      githubResData.access_token,
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
      tedisService.tedis.hset(TOKEN_BY_USER_ID, user.id.toString(), githubResData.access_token);
    } else {
      throw "couldn't find github user";
    }
    res.redirect('/');
  });

  authRouter.get('/logout', (req, res) => {
    if (req.cookies.get(SESSION_TOKEN_COOKIE_KEY)) {
      tedisService.tedis.hdel(USER_ID_BY_SESSION_KEY, req.cookies(SESSION_TOKEN_COOKIE_KEY));
      // tedisService.tedis.hdel(TOKEN_BY_USER_ID, user.id.toString());
      res.cookie(SESSION_TOKEN_COOKIE_KEY, '');
    }
    res.status(200);
  });

  return authRouter;
};
