import { createSlice } from '@reduxjs/toolkit';
import { rootState } from 'Client/store';

import { settingsActions, settingsSliceState } from './types';

const initialState: settingsSliceState = {
  theme: 'light',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(settingsActions.toggleTheme, (state) => {
      return {
        ...state,
        theme: state.theme === 'dark' ? 'light' : 'dark',
      };
    });
  },
});

export function settingsSelector(rootState: rootState) {
  return rootState.settings;
}
