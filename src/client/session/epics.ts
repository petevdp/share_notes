import {
  GET_CURRENT_USER,
  GET_VIEWER_GITHUB_DETAILS,
  getCurrentUserGithubDetailsResponse,
  getCurrentUserResult,
} from 'Client/queries';
import { epicDependencies } from 'Client/store';
import { eraseCookie, getCookie, getGithubGraphqlClient } from 'Client/utils/utils';
import { request as gqlRequest } from 'graphql-request';
import { Epic } from 'redux-observable';
import { merge } from 'rxjs';
import { concatMap, filter, first, ignoreElements, map, withLatestFrom } from 'rxjs/operators';
import { GITHUB_GRAPHQL_API_URL, GRAPHQL_URL, SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';

import {
  anonymousLoginActions,
  clearSessionData,
  logOut,
  setCurrentUserData,
  setSessionGithubDetails,
  setSessionToken,
} from './types';

export const setSessionTokenEpic: Epic = (action$, state$) =>
  state$.pipe(
    // on store init, if we haven't yet set the session token(might have persisted state), do so
    first(),
    filter((s) => !s.session.token),
    map(() => setSessionToken(getCookie(SESSION_TOKEN_COOKIE_KEY) as string | undefined)),
  );

/**
 * depends on session
 */
export const fetchCurrentUserDataOnSetSessionTokenEpic: Epic = (action$) =>
  action$.pipe(
    // when we have a session token
    filter(setSessionToken.match),
    filter(({ payload: token }) => !!token),
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
      eraseCookie(SESSION_TOKEN_COOKIE_KEY);
      await fetch('/auth/logout');
      return clearSessionData();
    }),
  );

export const loginAnonymouslyEpic: Epic = (aciton$, state$, { roomManager$$ }: epicDependencies) =>
  aciton$.pipe(
    filter(anonymousLoginActions.logInAnonymously.match),
    withLatestFrom(roomManager$$),
    map(([{ payload: username }, roomManager]) => {
      roomManager.setAwarenessUserDetails({ name: username });
    }),
    ignoreElements(),
  );
