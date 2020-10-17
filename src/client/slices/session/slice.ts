import { createSlice } from '@reduxjs/toolkit';
import { roomDeleted } from 'Client/slices/room/types';
import { rootState } from 'Client/store';

import { anonymousLoginActions, clearSessionData, sessionSliceState, tokenRetrievalAttempted } from './types';

const initialState: sessionSliceState = { tokenPresenceChecked: false };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(tokenRetrievalAttempted, (state, action) => ({
        ...state,
        token: action.payload,
        tokenPresenceChecked: true,
      }))
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
      .addCase(anonymousLoginActions.cancel, (s) => ({ ...s, anonymousLoginForm: undefined })),
});

export function isLoggedInWithGithubSelector(s: rootState) {
  return !!s.session.token;
}
