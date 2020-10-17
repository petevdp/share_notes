import { rootState } from 'Client/store';
import { eraseCookie, getCookie } from 'Client/utils/utils';
import { Epic, StateObservable } from 'redux-observable';
import { of } from 'rxjs';
import { concat } from 'rxjs/internal/observable/concat';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';

import { getCurrentUserDetails } from '../currentUserDetails/types';
import { clearSessionData, logOut, tokenRetrievalAttempted } from './types';

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

export const logOutEpic: Epic = (action$) =>
  action$.pipe(
    filter(logOut.match),
    concatMap(async () => {
      eraseCookie(SESSION_TOKEN_COOKIE_KEY);
      await fetch('/auth/logout');
      return clearSessionData();
    }),
  );
