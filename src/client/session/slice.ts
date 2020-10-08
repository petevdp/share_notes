import { createSlice } from '@reduxjs/toolkit';
import { roomDeleted } from 'Client/room/types';
import { rootState } from 'Client/store';

import {
  anonymousLoginActions,
  clearSessionData,
  sessionSliceState,
  setCurrentUserData,
  setSessionGithubDetails,
  setSessionToken,
} from './types';

const initialState: sessionSliceState = { tokenPresenceChecked: false };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(setSessionToken, (state, action) => ({ ...state, token: action.payload, tokenPresenceChecked: true }))
      .addCase(setCurrentUserData, (state, action) => ({ ...state, user: action.payload }))
      .addCase(setSessionGithubDetails, (state, action) => ({ ...state, githubUserDetails: action.payload }))
      .addCase(clearSessionData, (s) => ({ tokenPresenceChecked: s.tokenPresenceChecked }))
      .addCase(anonymousLoginActions.startAnonymousLogin, (s) => ({ ...s, anonymousLoginForm: { username: '' } }))
      .addCase(anonymousLoginActions.setUsername, (s, { payload: username }) => ({
        ...s,
        anonymousLoginForm: { username },
      }))
      .addCase(anonymousLoginActions.logInAnonymously, (s, { payload: username }) => ({
        ...s,
        anonymousLoginForm: undefined,
        anonymousUser: { username },
      }))
      .addCase(anonymousLoginActions.cancel, (s) => ({ ...s, anonymousLoginForm: undefined }))
      .addCase(roomDeleted, (s, { payload: ownedRooms }) => {
        if (!s.user) {
          return s;
        }
        return { ...s, user: { ...s.user, ownedRooms } };
      }),
});

export function isLoggedInWithGithubSelector(s: rootState) {
  return !!s.session.user;
}
