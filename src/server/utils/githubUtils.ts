import { request as octokitRequest } from '@octokit/request';
import { gql, GraphQLClient } from 'graphql-request';
import { Context } from 'Server/context';
import { GITHUB_GRAPHQL_API_URL } from 'Shared/environment';

function getAuthHeader(token: string) {
  return `bearer ${token}`;
}

export function runQuery<T>(query: string, token: string, variables?: any) {
  const client = new GraphQLClient(GITHUB_GRAPHQL_API_URL, {
    headers: { Authorization: getAuthHeader(token) },
  });

  return client.request<T>(query, variables);
}

export function githubRequestWithAuth(token: string) {
  return octokitRequest.defaults({ headers: { Authorization: getAuthHeader(token) } });
}

export interface extraUserDetails {
  // username
  login: string;
  databaseId: number;
}

export const EXTRA_USER_DETAILS_QUERY = gql`
  {
    viewer {
      login
      databaseId
    }
  }
`;

export interface extraUserDetailsQueryResult {
  viewer: extraUserDetails;
}
