import { createAction } from '@reduxjs/toolkit';
import { globalAwareness } from 'Client/services/clientSideRoomManager';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import { createRoomResponse } from 'Client/utils/queries';
import __uniqBy from 'lodash/uniqBy';
import { gistDetails } from 'Shared/githubTypes';
import { allBaseFileDetailsStates } from 'Shared/roomManager';
import { roomMember, roomMemberWithColor } from 'Shared/types/roomMemberAwarenessTypes';
import { clientSideRoom } from 'Shared/types/roomTypes';
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

export interface currentRename {
  tabIdToRename: string;
  newFilename: string;
  userChangedNewFilename: boolean;
}

export type roomSliceState = {
  currentRoom?: {
    initializingRoom: boolean;
    forkedGistDetails?: gistDetails;
    hashId: string;
    awareness?: globalAwareness;
    loadedTabs: string[];
    yjsClientId?: number;
    roomDetails?: clientSideRoom;
    roomSharedState: {
      gistLoaded: boolean;
      fileDetailsStates?: allBaseFileDetailsStates;
    };
    gistDetails?: gistDetails;
    currentTabId?: string;
    currentRename?: currentRename;
  };
};

export const roomCreated = createAction('roomCreated', (data: createRoomResponse, forkDetails?: gistDetails) => ({
  payload: { data, forkDetails },
}));
export const switchToRoom = createAction('switchToRoom', (hashId: string) => ({
  payload: hashId,
}));

export const provisionTab = createAction(
  'provisionTab',
  (tabId: string, containerElement: HTMLElement, vimStatusBarRef: HTMLElement) => ({
    payload: { tabId, containerElement, vimStatusBarRef },
  }),
);
export const unprovisionTab = createAction('unprovisionTab', (tabId: string) => ({
  payload: { tabId },
}));

export const leaveRoom = createAction('leaveRoom');
export const setRoomData = createAction('setRoomData', (data: clientSideRoom) => ({ payload: data }));
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
export const setFileDetailsState = createAction(
  'setFileDetailState',
  (allFileDetailsState: allBaseFileDetailsStates) => ({
    payload: allFileDetailsState,
  }),
);
export const removeFile = createAction('removeFile', (filename: string) => ({ payload: filename }));
export const saveBackToGist = createAction('saveBackToGist');
export const gistSaved = createAction('gistSaved', (updatedDetails: gistDetails) => ({ payload: updatedDetails }));

export const linkGist = createAction('linkGist', (gistId: string) => ({ payload: gistId }));

export const fileRenamingActions = {
  startRenameCurrentFile: createAction('startRenameCurrentFile'),
  startFileRename: createAction('startFileRename', (tabId: string) => ({ payload: tabId })),
  close: createAction('closeRenameFileModal'),
  setNewFileName: createAction('setNewFileName', (filename: string) => ({ payload: filename })),
};

export const setRoomAwarenessState = createAction('setRoomAwarenessState', (awareness: globalAwareness) => ({
  payload: awareness,
}));

export const deleteRoom = createAction('deleteRoom', (roomId: string) => ({ payload: roomId }));
export const roomDeleted = createAction('roomDeleted', (roomId: string) => ({ payload: roomId }));

export enum RenameError {
  Empty,
  Invalid,
  Duplicate,
}

export interface currentRenameWithComputed extends currentRename {
  errors: RenameError[];
  isValid: boolean;
}

export function isLoggedInForRoomSelector(rootState: rootState) {
  return !!(rootState.session.token || rootState.session.anonymousRoomMember);
}

export function currentFileRenameWithComputedSelector(rootState: rootState): currentRenameWithComputed | undefined {
  const currentRoom = rootState.room.currentRoom;
  const fileDetailsStates = currentRoom?.roomSharedState.fileDetailsStates;
  const currentRename = rootState.room.currentRoom?.currentRename;
  if (!currentRoom || !fileDetailsStates || !currentRename) {
    return;
  }
  const otherFilenames = Object.values(fileDetailsStates)
    .filter((d) => d.tabId !== currentRoom.currentTabId)
    .map((d) => d.filename);

  const errors = [];

  const newFilename = currentRename.newFilename;

  if (newFilename.length === 0) {
    errors.push(RenameError.Empty);
  }
  if (!/^[a-zA-Z0-9_.\-/ ]+$/.test(newFilename)) {
    errors.push(RenameError.Invalid);
  }
  if (otherFilenames && otherFilenames.includes(newFilename)) {
    errors.push(RenameError.Duplicate);
  }

  return {
    ...currentRename,
    errors,
    isValid: errors.length === 0,
  };
}

export function roomUsersAwarenessDetailsSelector(rootState: rootState): roomMemberWithColor[] | undefined {
  const awareness = rootState.room.currentRoom?.awareness;
  if (awareness) {
    const roomMembers = [
      ...Object.values(awareness)
        .filter((a) => !!a.roomMemberDetails)
        .map((s) => s.roomMemberDetails as roomMemberWithColor),
    ];
    return __uniqBy(roomMembers, (m) => m.userIdOrAnonID);
  }
}
