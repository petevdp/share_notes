import { createAction } from '@reduxjs/toolkit';

export interface currentUser {
  githubLogin: string;
  id: string;
  ownedRooms: {
    id: string;
    name: string;
    hashId: string;
  }[];
}

export interface githubUserDetails {
  avatarUrl: string;
}
export interface sessionSliceState {
  token?: string;
  user?: currentUser;
  githubUserDetails?: githubUserDetails;
}

export const setSessionToken = createAction('setSessionToken', (token: string) => ({ payload: token }));

export const setCurrentUserData = createAction('setUserData', (data: currentUser) => ({ payload: data }));
export const fetchCurrentUserData = createAction('fetchCurrentUserData');

export const fetchSessionGithubDetails = createAction('fetchSessionGithubDetails');
export const setSessionGithubDetails = createAction('setSessionGithubDetails', (details: githubUserDetails) => ({
  payload: details,
}));
export const logOut = createAction('logOut');
export const clearSessionData = createAction('clearSessionData');
