import { createAction } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';

export type theme = 'light' | 'dark';
export type keyMap = 'sublime' | 'vim' | 'emacs';

export interface individualEditorSettings {
  indentUnit?: number;
  smartIndent?: boolean;
}

export interface globalEditorSettings {
  indentUnit: number;
  smartIndent: boolean;
  keyMap: keyMap;
  lineWrapping: boolean;
}

export type settingsResolvedForEditor = individualEditorSettings & globalEditorSettings;

export interface clientSettings {
  theme: theme;
  globalEditor: globalEditorSettings;
  individualEditor: {
    [roomId: string]: {
      [tabId: string]: individualEditorSettings | undefined;
    };
  };
}

export type globalEditorSetting = {
  key: keyof globalEditorSettings;
  value: globalEditorSettings[keyof globalEditorSettings];
};

export type individualEditorSetting =
  | {
      key: 'indentUnit';
      value: number;
    }
  | {
      key: 'smartIndent';
      value: boolean;
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
