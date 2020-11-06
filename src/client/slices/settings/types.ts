import { createAction } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import { log } from 'console';
import produce from 'immer';
import * as monaco from 'monaco-editor';

import { currentRoomStateWithComputed, currentRoomStateWithComputedSelector } from '../room/types';

export type theme = 'light' | 'dark';
export type keyMap = 'regular' | 'vim';

interface individualEditorSettings {
  tabSize: monaco.editor.IGlobalEditorOptions['tabSize'];
  intellisense: boolean;
  autoIndent: monaco.editor.IEditorOptions['autoIndent'];
  detectIndentation: monaco.editor.IGlobalEditorOptions['detectIndentation'];
  tabCompletion: boolean;
  displayMode: 'regular' | 'markdownPreview' | 'diffViewer';
}

export type individualEditorSettingsPartial = Partial<individualEditorSettings>;

export interface globalEditorSettings extends individualEditorSettings {
  keyMap: keyMap;
  lineWrapping: boolean;
  minimap: boolean;
  lineNumbers: monaco.editor.IEditorOptions['lineNumbers'];
}

export type settingsResolvedForEditor = individualEditorSettingsPartial & globalEditorSettings;

export interface clientSettings {
  theme: theme;
  globalEditor: globalEditorSettings;
  individualEditor: {
    [roomId: string]: {
      [tabId: string]: individualEditorSettingsPartial | undefined;
    };
  };
}

export type globalEditorSetting = {
  key: keyof globalEditorSettings;
  value: globalEditorSettings[keyof globalEditorSettings];
};

export type individualEditorSetting = {
  key: keyof individualEditorSettings;
  value: individualEditorSettings[keyof individualEditorSettings];
};

export const settingsActions = {
  toggleTheme: createAction('toggleTheme'),
  setGlobalEditorSetting: createAction('setGlobalEditorSetting', (editorSetting: globalEditorSetting) => ({
    payload: editorSetting,
  })),
  setIndividualEditorSetting: createAction(
    'setIndividualEditorSetting',
    (editorSetting: individualEditorSetting, roomHashId: string, tabId: string) => ({
      payload: { setting: editorSetting, roomHashId, tabId },
    }),
  ),
};

export function settingsSelector(rootState: rootState) {
  return rootState.settings;
}

export function settingsForCurrentEditorSelector(rootState: rootState): settingsResolvedForEditor | undefined {
  const currentRoom = currentRoomStateWithComputedSelector(rootState);
  if (!currentRoom?.currentTabId) {
    return;
  }
  const tabId = currentRoom.currentTabId;
  const roomHashId = currentRoom.hashId;
  return getSettingsForEditorWithComputed(rootState.settings, roomHashId, tabId, currentRoom.isCurrentFileMarkdown);
}

export function getSettingsForEditorWithComputed(
  settings: clientSettings,
  roomHashId: string,
  tabId: string,
  filetypeIsMarkdown: boolean,
): settingsResolvedForEditor {
  const individualSettings = settings.individualEditor[roomHashId][tabId] || {};
  const displayMode = individualSettings?.displayMode || settings.globalEditor.displayMode;
  let resolvedDisplayMode: settingsResolvedForEditor['displayMode'];
  if (filetypeIsMarkdown) {
    resolvedDisplayMode = displayMode;
  } else {
    resolvedDisplayMode = displayMode === 'markdownPreview' ? 'markdownPreview' : displayMode;
  }

  return {
    ...settings.globalEditor,
    ...individualSettings,
    displayMode: resolvedDisplayMode,
  };
}
