import { createSlice } from '@reduxjs/toolkit';
import { rootState } from 'Client/store';

import { anonymousLoginActions, clearSessionData, sessionSliceState, tokenRetrievalAttempted } from './types';

const initialState: sessionSliceState = { tokenPresenceChecked: false };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(tokenRetrievalAttempted, (state, { payload: token }) => {
        state.token = token;
        state.tokenPresenceChecked = true;
      })
      .addCase(clearSessionData, () => ({ tokenPresenceChecked: false }));
    {
      const { startAnonymousLogin, setUsername, logInAnonymously, cancel } = anonymousLoginActions;
      builder
        .addCase(startAnonymousLogin, (state) => {
          state.anonymousLoginForm = { username: '' };
        })
        .addCase(setUsername, (state, { payload: username }) => {
          if (state.anonymousLoginForm) {
            state.anonymousLoginForm.username = username;
          }
        })
        .addCase(logInAnonymously, (state, { payload: input }) => {
          delete state.anonymousLoginForm;
          state.anonymousRoomMember = input;
        })
        .addCase(cancel, (state) => {
          delete state.anonymousLoginForm;
        });
    }
  },
});

export function isLoggedInWithGithubSelector(s: rootState) {
  return !!s.session.token;
}
