import { createAction } from '@reduxjs/toolkit';
import { rootState } from 'Client/store';

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
  tokenPresenceChecked: boolean;
  anonymousLoginForm?: {
    username: string;
  };
  anonymousUser?: {
    username: string;
  };
  user?: currentUser;
  githubUserDetails?: githubUserDetails;
}

export const setSessionToken = createAction('setSessionToken', (token: string | undefined) => ({ payload: token }));

export const setCurrentUserData = createAction('setUserData', (data: currentUser) => ({ payload: data }));
export const fetchCurrentUserData = createAction('fetchCurrentUserData');

export const fetchSessionGithubDetails = createAction('fetchSessionGithubDetails');
export const setSessionGithubDetails = createAction('setSessionGithubDetails', (details: githubUserDetails) => ({
  payload: details,
}));
export const logOut = createAction('logOut');
export const clearSessionData = createAction('clearSessionData');

export const anonymousLoginActions = {
  startAnonymousLogin: createAction('startAnonymousLogin'),
  setUsername: createAction('setAnonymousLoginUsername', (username: string) => ({ payload: username })),
  logInAnonymously: createAction('loginAnonymously', (username: string) => ({ payload: username })),
  cancel: createAction('cancelAnonymousLogin'),
};

export type userType = 'github' | 'anonymous';

export interface unifiedUser {
  type: userType;
  name: string;
  userId?: string;
  avatarUrl?: string;
}

export function unifiedUserSelector(s: rootState): unifiedUser | undefined {
  let user: unifiedUser;

  if (s.session.user) {
    user = {
      type: 'github',
      name: s.session.user.githubLogin,
    };
    if (s.session.githubUserDetails) {
      user.avatarUrl = s.session.githubUserDetails.avatarUrl;
    }

    return user;
  } else if (s.session.anonymousUser) {
    user = {
      type: 'anonymous',
      name: s.session.anonymousUser.username,
    };
  } else {
    return;
  }
  return user;
}
