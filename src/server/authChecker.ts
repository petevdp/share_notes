import { AuthChecker } from 'type-graphql';

import { Context } from './context';
import { TedisService, USER_ID_BY_SESSION_KEY } from './services/tedisService';

// create auth checker function
export const getAuthChecker = (tedisService: TedisService): AuthChecker<Context> => {
  return async ({ context: { githubSessionToken } }) => {
    if (!githubSessionToken) {
      return false;
    }
    const databaseId = await tedisService.tedis.hget(USER_ID_BY_SESSION_KEY, githubSessionToken);
    return !!databaseId;
  };
};
