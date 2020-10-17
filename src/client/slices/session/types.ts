import { createAction } from '@reduxjs/toolkit';
import { rootState } from 'Client/store';
import { roomMemberInput, roomMemberType } from 'Shared/types/roomMemberAwarenessTypes';
import { clientSideRoom } from 'Shared/types/roomTypes';

export interface sessionSliceState {
  token?: string | null;
  tokenPresenceChecked: boolean;
  anonymousLoginForm?: {
    username: string;
  };
  anonymousUser?: {
    username: string;
  };
}

export const tokenRetrievalAttempted = createAction('tokenRetrievalAttempted', (token: string | null = null) => ({
  payload: token,
}));

export const fetchCurrentUserData = createAction('fetchCurrentUserData');

export const fetchSessionGithubDetails = createAction('fetchSessionGithubDetails');
export const logOut = createAction('logOut');
export const clearSessionData = createAction('clearSessionData');

export const anonymousLoginActions = {
  startAnonymousLogin: createAction('startAnonymousLogin'),
  setUsername: createAction('setAnonymousLoginUsername', (username: string) => ({ payload: username })),
  logInAnonymously: createAction('loginAnonymously', (username: string) => ({ payload: username })),
  cancel: createAction('cancelAnonymousLogin'),
};

export enum LoginStatus {
  LoggedIn,
  NotLoggedIn,
  Unchecked,
}

export function loggedInStatusSelector(state: rootState) {
  if (state.session.token) {
    return LoginStatus.LoggedIn;
  } else if (state.session.tokenPresenceChecked) {
    return LoginStatus.NotLoggedIn;
  } else {
    return LoginStatus.Unchecked;
  }
}

export function roomMemberInputSelector(s: rootState): roomMemberInput | undefined {
  let user: roomMemberInput;

  const currentUser = s.currentUserDetails;

  if (currentUser.userDetails) {
    user = {
      type: 'github',
      name: currentUser.userDetails.githubLogin,
      userIdOrAnonID: currentUser.userDetails.id,
    };
    if (currentUser.githubUserDetails) {
      console.log('setting github details: ', currentUser.githubUserDetails);
      user.avatarUrl = currentUser.githubUserDetails.avatarUrl;
      user.profileUrl = currentUser.githubUserDetails.url;
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
