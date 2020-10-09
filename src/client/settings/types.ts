import { createAction } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';

export type theme = 'light' | 'dark';
export type keyMap = 'sublime' | 'vim' | 'emacs';
interface individualEditorSettings {
  indentUnit: number;
  smartIndent: boolean;
  indentWithTabs: boolean;
  tabSize: boolean;
}

export type individualEditorSettingsPartial = Partial<individualEditorSettings>;

export interface globalEditorSettings {
  indentUnit: number;
  smartIndent: boolean;
  keyMap: keyMap;
  lineWrapping: boolean;
  indentWithTabs: boolean;
  tabSize: number;
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
  key: keyof globalEditorSettings;
  value: globalEditorSettings[keyof globalEditorSettings];
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
  return {
    ...settings.individualEditor[roomHashId][tabId],
    ...settings.globalEditor,
  };
}
