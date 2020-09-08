import { createAction } from '@reduxjs/toolkit';
import { getCurrentUserResult } from 'Client/queries';

export interface sessionSliceState {
  token?: string;
  user?: getCurrentUserResult;
}

export const setSessionToken = createAction('setSessionToken', (token) => ({ payload: token }));
export const setUserData = createAction('setUserData', (data: getCurrentUserResult) => ({ payload: data }));
