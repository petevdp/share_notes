import { createAction } from '@reduxjs/toolkit';
import { rootState } from 'Client/store';
import { anonymousRoomMember, anonymousRoomMemberInput, roomMemberInput } from 'Shared/types/roomMemberAwarenessTypes';

export interface sessionSliceState {
  token?: string | null;
  tokenPresenceChecked: boolean;
  anonymousLoginForm?: {
    username: string;
  };
  anonymousRoomMember?: anonymousRoomMember;
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
  logInAnonymously: createAction('loginAnonymously', (name: string, anonId: string) => {
    const input: anonymousRoomMemberInput = {
      type: 'anonymous',
      name,
      userIdOrAnonID: anonId,
    };
    return { payload: input };
  }),
  cancel: createAction('cancelAnonymousLogin'),
};

export enum LoginStatus {
  LoggedIn,
  LoggedInAnonymously,
  NotLoggedIn,
  Unchecked,
}

export function loggedInStatusSelector(state: rootState) {
  if (state.session.token) {
    return LoginStatus.LoggedIn;
  } else if (state.session.tokenPresenceChecked) {
    if (state.session.anonymousRoomMember) {
      return LoginStatus.LoggedInAnonymously;
    } else {
      return LoginStatus.NotLoggedIn;
    }
  } else {
    return LoginStatus.Unchecked;
  }
}

export function roomMemberInputSelector(s: rootState): roomMemberInput | undefined {
  const loggedInStatus = loggedInStatusSelector(s);
  const anonymousRoomMember = s.session.anonymousRoomMember;

  const currentUser = s.currentUserDetails;

  switch (loggedInStatus) {
    case LoginStatus.LoggedIn:
      if (currentUser.userDetails && currentUser.githubUserDetails) {
        return {
          type: 'github',
          name: currentUser.userDetails.githubLogin,
          userIdOrAnonID: currentUser.userDetails.id,
          profileUrl: currentUser.githubUserDetails.url,
          avatarUrl: currentUser.githubUserDetails.avatarUrl,
        };
      } else {
        return;
      }
    case LoginStatus.LoggedInAnonymously:
      return anonymousRoomMember;
  }
}
