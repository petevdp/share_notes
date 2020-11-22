import { request as octokitRequest } from '@octokit/request';
import { DateTime } from 'luxon';
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

export function getCookie(name: string): string | undefined {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
}

export function eraseCookie(name: string) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export async function getGithubGraphqlClient() {
  const { GraphQLClient } = await import('graphql-request');
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

export function formatRoomVisitedTime(visitedDateStr: string) {
  const visitedDate = new Date(visitedDateStr);

  // const visitedDate = new Date(visitedDateStr);
  let user_date = new Date();
  let diff = Math.floor((Number(user_date) - Number(visitedDate)) / 1000);
  if (diff <= 1) {
    return 'just now';
  }
  if (diff < 20) {
    return diff + ' seconds ago';
  }
  if (diff < 40) {
    return 'half a minute ago';
  }
  if (diff < 60) {
    return 'less than a minute ago';
  }
  if (diff <= 90) {
    return 'one minute ago';
  }
  if (diff <= 3540) {
    return Math.round(diff / 60) + ' minutes ago';
  }
  if (diff <= 5400) {
    return '1 hour ago';
  }
  if (diff <= 86400) {
    return Math.round(diff / 3600) + ' hours ago';
  }
  if (diff <= 129600) {
    return '1 day ago';
  }
  if (diff < 604800) {
    return Math.round(diff / 86400) + ' days ago';
  }
  if (diff <= 777600) {
    return '1 week ago';
  }
  return 'on ' + DateTime.fromJSDate(visitedDate).toLocaleString(DateTime.DATE_MED);
}
