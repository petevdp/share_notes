import { GraphQLClient, gql } from 'graphql-request';
import { GITHUB_GRAPHQL_API_URL } from 'Shared/environment';
import { Context } from 'Server/context';

export function runQuery<T>(query: string, context: Context, variables?: any) {
  const client = new GraphQLClient(GITHUB_GRAPHQL_API_URL, {
    headers: { Authorization: `bearer ${context.githubSessionToken}` },
  });

  return client.request<T>(query, variables);
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
