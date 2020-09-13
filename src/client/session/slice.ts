import { createSlice, createAction } from '@reduxjs/toolkit';
import {
  sessionSliceState,
  setSessionToken,
  setCurrentUserData,
  setSessionGithubDetails,
  logOut,
  clearSessionData,
} from './types';

const initialState: sessionSliceState = {};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(setSessionToken, (state, action) => ({ ...state, token: action.payload }))
      .addCase(setCurrentUserData, (state, action) => ({ ...state, user: action.payload }))
      .addCase(setSessionGithubDetails, (state, action) => ({ ...state, githubUserDetails: action.payload }))
      .addCase(clearSessionData, () => ({})),
});
