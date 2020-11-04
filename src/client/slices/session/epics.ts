import { rootState } from 'Client/store';
import { eraseCookie, getCookie } from 'Client/utils/utils';
import { Epic, StateObservable } from 'redux-observable';
import { of } from 'rxjs';
import { concat } from 'rxjs/internal/observable/concat';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { ignoreElements } from 'rxjs/internal/operators/ignoreElements';
import { map } from 'rxjs/internal/operators/map';
import { AUTH_REDIRECT_URL, GITHUB_0AUTH_URL, GITHUB_CLIENT_ID, SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';

import { getCurrentUserDetails } from '../currentUserDetails/types';
import { clearSessionData, logOut, tokenRetrievalAttempted } from './types';

const PATH_BEFORE_GITHUB_AUTH_KEY = 'pathBeforeGithubAuth';

/**
 * Retrieve the sesssion token from cookies on store init
 */
export const retreiveSessionTokenEpic: Epic = (action$, state$: StateObservable<rootState>) =>
  state$.pipe(
    first(),
    concatMap((rootState) => {
      const token = rootState.session.token || getCookie(SESSION_TOKEN_COOKIE_KEY);
      if (token) {
        return concat(of(tokenRetrievalAttempted(token)), getCurrentUserDetails());
      }
      return of(tokenRetrievalAttempted());
    }),
  );

export const redirectAfterAuthEpic: Epic = (action$) =>
  action$.pipe(
    filter(tokenRetrievalAttempted.match),
    map(({ payload: token }) => {
      const prevPath = sessionStorage.getItem(PATH_BEFORE_GITHUB_AUTH_KEY);
      if (prevPath) {
        sessionStorage.removeItem(PATH_BEFORE_GITHUB_AUTH_KEY);
        history.pushState({}, '', prevPath);
      }
    }),
    ignoreElements(),
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

export function loginWithGithub() {
  const url = new URL(GITHUB_0AUTH_URL);
  url.searchParams.set('client_id', GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_url', AUTH_REDIRECT_URL);
  url.searchParams.set('scope', 'gist,read:user');
  sessionStorage.setItem(PATH_BEFORE_GITHUB_AUTH_KEY, window.location.href);
  window.location.href = url.toString();
  return;
}
