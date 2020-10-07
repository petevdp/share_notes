import { createAction } from '@reduxjs/toolkit';
import { createRoomResponse } from 'Client/queries';
import { globalAwareness, userAwarenessDetails } from 'Client/services/clientSideRoomManager';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import { gistDetails } from 'Shared/githubTypes';
import { allFileDetailsStates, roomDetails } from 'Shared/roomManager';
import * as Y from 'yjs';

export type gistDetailKeys = 'description' | 'name' | 'url';
export const gistDetailKeys: gistDetailKeys[] = ['description', 'name', 'url'];

export interface roomRealTimeData {
  documents: Y.Map<Y.Text>;
  metadata: Y.Map<string>;
}

interface anonymousLogin {
  username: string;
}

export type roomSliceState = {
  currentRoom?: {
    initializingRoom: boolean;
    forkedGistDetails?: gistDetails;
    hashId: string;
    awareness?: globalAwareness;
    loadedTabs: string[];
    yjsClientId?: number;
    roomDetails?: roomDetails;
    gistDetails?: gistDetails;
    currentTabId?: string;
    fileDetailsStates?: allFileDetailsStates;
    currentRename?: {
      tabIdToRename: string;
      newFilename: string;
      userChangedNewFilename: boolean;
    };
  };
};

export const roomCreated = createAction('roomCreated', (data: createRoomResponse, forkDetails?: gistDetails) => ({
  payload: { data, forkDetails },
}));
export const switchToRoom = createAction('switchToRoom', (hashId: string) => ({
  payload: hashId,
}));

export const provisionTab = createAction('provisionTab', (tabId: string, containerElement: HTMLElement) => ({
  payload: { tabId, containerElement },
}));
export const unprovisionTab = createAction('unprovisionTab', (tabId: string) => ({
  payload: { tabId },
}));

export const leaveRoom = createAction('leaveRoom');
export const setRoomData = createAction('setRoomData', (data: roomDetails) => ({ payload: data }));
export const setRoomGistDetails = createAction('setRoomGistDetails', (data: gistDetails) => ({
  payload: data,
}));
export const setIsCreatingRoom = createAction('setIsCreatingFroom');
export const initRoom = createAction('initRoom', (roomHashId: string, startingTab?: string) => ({
  payload: { roomHashId, startingTab },
}));
export const roomInitialized = createAction('roomInitialized', (yjsClientId: number) => ({ payload: yjsClientId }));

export const destroyRoom = createAction('destroyRoom');
export const switchCurrentFile = createAction('switchCurrentFile', (tabId: string) => ({ payload: tabId }));
export const addNewFile = createAction('addNewFile', (filename?: string) => ({ payload: filename }));
export const setCurrentFile = createAction('setCurrentFile', (id: string | number) => ({ payload: id }));
export const renameFile = createAction('renameFile', (tabId: string | number, newFilename: string) => ({
  payload: { tabId, newFilename },
}));
export const setFileDetailsState = createAction('setFileDetailState', (allFileDetailsState: allFileDetailsStates) => ({
  payload: allFileDetailsState,
}));
export const removeFile = createAction('removeFile', (filename: string) => ({ payload: filename }));
export const saveBackToGist = createAction('saveBackToGist');
export const gistSaved = createAction('gistSaved', (updatedDetails: gistDetails) => ({ payload: updatedDetails }));

export const fileRenamingActions = {
  startRenameCurrentFile: createAction('startRenameCurrentFile'),
  close: createAction('closeRenameFileModal'),
  setNewFileName: createAction('setNewFileName', (filename: string) => ({ payload: filename })),
};

export const setRoomAwarenessState = createAction('setRoomAwarenessState', (awareness: globalAwareness) => ({
  payload: awareness,
}));

export function isLoggedInForRoomSelector(rootState: rootState) {
  return !!(rootState.session.token || rootState.session.anonymousUser);
}

export function currentFileRenameWithErrorsSelector(rootState: rootState) {
  const currentRename = rootState.room.currentRoom?.currentRename;
  if (!currentRename) {
    return;
  }
}

export function roomUsersAwarenessDetailsSelector(rootState: rootState): userAwarenessDetails[] | undefined {
  const awareness = rootState.room.currentRoom?.awareness;

  if (awareness) {
    return [
      ...Object.values(awareness)
        .filter((a) => !!a.user)
        .map((s) => s.user as userAwarenessDetails),
    ];
  }
}
