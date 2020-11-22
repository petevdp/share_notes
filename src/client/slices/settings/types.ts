import { createAction } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';

import { currentRoomStateWithComputed, currentRoomStateWithComputedSelector } from '../room/types';

export type theme = 'light' | 'dark';
export type keyMap = 'regular' | 'vim';

export type displayMode = 'regular' | 'markdownPreview' | 'diffViewer';

interface individualEditorSettings {
  tabSize: number;
  intellisense: boolean;
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
  detectIndentation: boolean;
  tabCompletion: boolean;
  displayMode: displayMode;
}

export type individualEditorSettingsPartial = Partial<individualEditorSettings>;

export interface globalEditorSettings extends individualEditorSettings {
  keyMap: keyMap;
  lineWrapping: boolean;
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
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
  return getSettingsForEditorWithComputed(
    rootState.settings,
    roomHashId,
    tabId,
    currentRoom.isCurrentFileMarkdown,
    !!currentRoom.gistDetails,
  );
}

export function getSettingsForEditorWithComputed(
  settings: clientSettings,
  roomHashId: string,
  tabId: string,
  filetypeIsMarkdown: boolean,
  roomHasAssociatedGist: boolean,
): settingsResolvedForEditor {
  const individualSettings = settings.individualEditor[roomHashId][tabId] || {};
  const displayMode = individualSettings?.displayMode || settings.globalEditor.displayMode;
  let possibleDisplayModes: displayMode[] = ['regular'];
  if (filetypeIsMarkdown) {
    possibleDisplayModes.push('markdownPreview');
  }
  if (roomHasAssociatedGist) {
    possibleDisplayModes.push('diffViewer');
  }

  return {
    ...settings.globalEditor,
    ...individualSettings,
    displayMode: possibleDisplayModes.includes(displayMode) ? displayMode : 'regular',
  };
}
