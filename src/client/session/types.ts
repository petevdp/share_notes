import { createAction } from '@reduxjs/toolkit';
import { getCurrentUserResult } from 'Client/queries';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';

export interface currentUser {
  githubLogin: string;
  id: string;
}

export interface githubUserDetails {
  avatarUrl: string;
}
export interface sessionSliceState {
  token?: string;
  user?: currentUser;
  githubUserDetails?: githubUserDetails;
}

export const setSessionToken = createAction('setSessionToken', (token) => ({ payload: token }));
export const setUserData = createAction('setUserData', (data: currentUser) => ({ payload: data }));
export const fetchSessionGithubDetails = createAction(
  'fetchCurrentUserDetails',
  (apolloClient: ApolloClient<object>) => ({
    payload: apolloClient,
  }),
);
export const setSessionGithubDetails = createAction('setSessionGithubDetails', (details: githubUserDetails) => ({
  payload: details,
}));
export const logOut = createAction('logOut');
export const clearSessionData = createAction('clearSessionData');
