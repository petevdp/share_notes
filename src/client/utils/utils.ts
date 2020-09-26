import { request as octokitRequest } from '@octokit/request';
import fastDeepEqual from 'fast-deep-equal';
import { GraphQLClient } from 'graphql-request';
import { StateObservable } from 'redux-observable';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { GITHUB_GRAPHQL_API_URL, SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';

export function setCookie(name: string, value: string, days = 5) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

export function getCookie(name: string) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function eraseCookie(name: string) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
