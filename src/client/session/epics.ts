import { Epic } from 'redux-observable';
import { filter, map, concatMap, first } from 'rxjs/operators';
import { setSessionGithubDetails, logOut, clearSessionData, setCurrentUserData, setSessionToken } from './types';
import { merge } from 'rxjs';
import {
  GET_VIEWER_GITHUB_DETAILS,
  getCurrentUserGithubDetailsResponse,
  GET_CURRENT_USER,
  getCurrentUserResult,
} from 'Client/queries';
import { request as gqlRequest, GraphQLClient } from 'graphql-request';
import { getCookie, getGithubGraphqlClient } from 'Client/utils';
import { GITHUB_GRAPHQL_API_URL, GRAPHQL_URL, SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';

export const setSessionTokenEpic: Epic = (action$, state$) =>
  state$.pipe(
    // on store init, if we haven't yet set the session token(might have persisted state), do so
    first(),
    filter((s) => !s.session.token && !!getCookie(SESSION_TOKEN_COOKIE_KEY)),
    map(() => setSessionToken(getCookie(SESSION_TOKEN_COOKIE_KEY) as string)),
  );

/**
 * depends on session
 */
export const fetchCurrentUserDataOnSetSessionTokenEpic: Epic = (action$) =>
  action$.pipe(
    // when we have a session token
    filter(setSessionToken.match),
    first(),
    concatMap(({ payload: token }) => {
      // get user data from server
      const getCurrentUserDataPromise = gqlRequest<getCurrentUserResult>(GRAPHQL_URL, GET_CURRENT_USER).then((r) =>
        setCurrentUserData(r.currentUser),
      );

      getCurrentUserDataPromise.then((d) => console.log('wtf: ', d));

      const githubClient = getGithubGraphqlClient();
      // get user data from github
      const getGithubUserDetails = githubClient
        .request<getCurrentUserGithubDetailsResponse>(GET_VIEWER_GITHUB_DETAILS)
        .then((r) => setSessionGithubDetails(r.viewer));

      // update the store as we get responses
      return merge(getCurrentUserDataPromise, getGithubUserDetails);
    }),
  );

export const logOutEpic: Epic = (action$) =>
  action$.pipe(
    filter(logOut.match),
    concatMap(async () => {
      await fetch('/auth/logout');
      return clearSessionData();
    }),
  );
