import { createSlice } from '@reduxjs/toolkit';
import { initRoom } from 'Client/room/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import { stat } from 'fs';
import { StateObservable } from 'redux-observable';

import { clientSettings, individualEditorSettingsPartial, settingsActions } from './types';

const initialState: clientSettings = {
  theme: 'light',
  globalEditor: {
    keyMap: 'vim',
    indentUnit: 2,
    smartIndent: true,
    lineWrapping: false,
    indentWithTabs: false,
    tabSize: 2,
  },
  individualEditor: {},
};

const { toggleTheme, setGlobalEditorSetting, setIndividualEditorSetting } = settingsActions;

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(toggleTheme, (state) => {
      return {
        ...state,
        theme: state.theme === 'dark' ? 'light' : 'dark',
      };
    });
    builder.addCase(setGlobalEditorSetting, (state, { payload: editorSetting }) => {
      state.globalEditor = {
        ...state.globalEditor,
        [editorSetting.key]: editorSetting.value,
      };
    });

    builder.addCase(initRoom, (state, { payload: { roomHashId } }) => {
      if (!state.individualEditor[roomHashId]) {
        state.individualEditor[roomHashId] = {};
      }
    });

    builder.addCase(setIndividualEditorSetting, (state, { payload: { setting, roomHashId, tabId } }) => {
      if (!state.individualEditor[roomHashId][tabId]) {
        state.individualEditor[roomHashId][tabId] = {};
        return;
      }
      state.individualEditor[roomHashId][tabId] = {
        ...state.individualEditor[roomHashId][tabId],
        [setting.key]: setting.value,
      };
    });
  },
});
