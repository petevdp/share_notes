import fastDeepEqual from 'fast-deep-equal';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { StateObservable } from 'redux-observable';
import { GraphQLClient } from 'graphql-request';
import { GITHUB_GRAPHQL_API_URL } from '../../dist/src/shared/environment';

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

export function getGithubGraphqlClient(token: string) {
  return new GraphQLClient(GITHUB_GRAPHQL_API_URL, {
    headers: {
      Authorization: `bearer ${token}`,
    },
  });
}
