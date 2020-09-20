import { createAction } from '@reduxjs/toolkit';

export type theme = 'light' | 'dark';
export interface settingsSliceState {
  theme: theme;
}

export const settingsActions = {
  toggleTheme: createAction('toggleTheme'),
};
