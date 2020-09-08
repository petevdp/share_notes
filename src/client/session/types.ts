import { createAction } from '@reduxjs/toolkit';
import { getCurrentUserResult } from 'Client/queries';

export interface currentUser {
  githubLogin: string;
  id: string;
}
export interface sessionSliceState {
  token?: string;
  user?: currentUser;
}

export const setSessionToken = createAction('setSessionToken', (token) => ({ payload: token }));
export const setUserData = createAction('setUserData', (data: currentUser) => ({ payload: data }));
