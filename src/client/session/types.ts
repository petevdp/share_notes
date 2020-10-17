import { createAction } from '@reduxjs/toolkit';
import { rootState } from 'Client/store';
import { roomMemberInput, roomMemberType } from 'Shared/types/roomMemberAwarenessTypes';
import { clientSideRoom } from 'Shared/types/roomTypes';

export interface currentUser {
  githubLogin: string;
  id: string;
  ownedRooms: clientSideRoom[];
}

export interface githubUserDetails {
  avatarUrl: string;
  url: string;
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

export function roomMemberInputSelector(s: rootState): roomMemberInput | undefined {
  let user: roomMemberInput;

  if (s.session.user) {
    user = {
      type: 'github',
      name: s.session.user.githubLogin,
      userIdOrAnonID: s.session.user.id,
    };
    if (s.session.githubUserDetails) {
      console.log('setting github details: ', s.session.githubUserDetails);
      user.avatarUrl = s.session.githubUserDetails.avatarUrl;
      user.profileUrl = s.session.githubUserDetails.url;
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
