import { createSlice } from '@reduxjs/toolkit';
import { initRoom } from 'Client/room/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';

import { clientSettings, settingsActions } from './types';

const initialState: clientSettings = {
  theme: 'light',
  globalEditor: {
    minimap: true,
    intellisense: true,
    keyMap: 'regular',
    detectIndentation: true,
    tabSize: 2,
    autoIndent: 'advanced',
    tabCompletion: true,
    lineWrapping: false,
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
