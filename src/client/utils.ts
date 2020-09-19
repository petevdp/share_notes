import fastDeepEqual from 'fast-deep-equal';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { StateObservable } from 'redux-observable';
import { GraphQLClient } from 'graphql-request';
import { request as octokitRequest } from '@octokit/request';
import { GITHUB_GRAPHQL_API_URL, SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';

export function getCookie(cookieKey: string) {
  let cookieName = `${cookieKey}=`;

  let cookieArray = document.cookie.split(';');

  for (let cookie of cookieArray) {
    while (cookie.charAt(0) == ' ') {
      cookie = cookie.substring(1, cookie.length);
    }

    if (cookie.indexOf(cookieName) == 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
}

export function emitSliceWhenChanged<T, S>(selector: (rootState: T) => S) {
  return (state$: StateObservable<T>) => {
    return state$.pipe(
      distinctUntilChanged<T>((prev, curr) => fastDeepEqual(selector(prev), selector(curr))),
      map(selector),
    );
  };
}

export function getGithubGraphqlClient() {
  const client = new GraphQLClient(GITHUB_GRAPHQL_API_URL);
  const token = getCookie(SESSION_TOKEN_COOKIE_KEY);
  if (token) {
    client.setHeader('Authorization', `bearer ${token}`);
  }

  return client;
}

export function octokitRequestWithAuth() {
  const token = getCookie(SESSION_TOKEN_COOKIE_KEY);
  if (token) {
    return octokitRequest.defaults({
      headers: { Authorization: `bearer ${token}` },
    });
  } else {
    return octokitRequest.defaults({});
  }
}

export function validateFilename(filename: string) {
  return /[a-zA-Z0-9_\.\-\ ]/.test(filename);
}
