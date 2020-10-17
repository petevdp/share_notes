import { createAction } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import * as monaco from 'monaco-editor';

export type theme = 'light' | 'dark';
export type keyMap = 'regular' | 'vim';

interface individualEditorSettings {
  tabSize: monaco.editor.IGlobalEditorOptions['tabSize'];
  intellisense: boolean;
  autoIndent: monaco.editor.IEditorOptions['autoIndent'];
  detectIndentation: monaco.editor.IGlobalEditorOptions['detectIndentation'];
  tabCompletion: boolean;
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
  key: keyof individualEditorSetting;
  value: individualEditorSettings[keyof individualEditorSettings];
};

export const settingsActions = {
  toggleTheme: createAction('toggleTheme'),
  setGlobalEditorSetting: createAction('setGlobalEditorSetting', (editorSetting: globalEditorSetting) => ({
    payload: editorSetting,
  })),
  setIndividualEditorSetting: createAction(
    'setIndividualEditorSetting',
    (editorSetting: individualEditorSetting, roomHashId, string, tabId: string) => ({
      payload: { setting: editorSetting, roomHashId, tabId },
    }),
  ),
};

export function settingsSelector(rootState: rootState) {
  return rootState.settings;
}

export function getSettingsForEditor(
  settings: clientSettings,
  roomHashId: string,
  tabId: string,
): settingsResolvedForEditor {
  if (settings.individualEditor[roomHashId][tabId]) {
    return {
      ...settings.individualEditor[roomHashId][tabId],
      ...settings.globalEditor,
    };
  } else {
    return { ...settings.globalEditor };
  }
}
