import { createSlice, createAction } from '@reduxjs/toolkit';
import { sliceState } from './state';
import { StateObservable } from 'redux-observable';

const initialState: sliceState = {};

export const loginWithGithub = createAction('loginWithGithub');
export const loginWithGithubSuccess = createAction('loginWithGithubSuccess');

export const setSessionToken = createAction('setSessionToken', (token) => ({ payload: token }));

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder.addCase(setSessionToken, (state, action) => ({ ...state, token: action.payload })),
});
