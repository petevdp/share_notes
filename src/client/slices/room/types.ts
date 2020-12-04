import { createAction } from '@reduxjs/toolkit';
import { allColors } from 'Client/services/awarenessColors';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import { enqueueSnackbar } from 'Client/utils/basewebUtils';
import { createRoomResponse } from 'Client/utils/queries';
import __uniqBy from 'lodash/uniqBy';
import { DOMAIN } from 'Shared/environment';
import { gistDetails } from 'Shared/githubTypes';
import { allBaseFileDetailsStates } from 'Shared/roomManager';
import {
  clientAwareness,
  globalAwareness,
  roomMember,
  roomMemberWithComputed,
} from 'Shared/types/roomMemberAwarenessTypes';
import { clientSideRoom } from 'Shared/types/roomTypes';
import * as Y from 'yjs';

export type gistDetailKeys = 'description' | 'name' | 'url';
export const gistDetailKeys: gistDetailKeys[] = ['description', 'name', 'url'];

export interface roomRealTimeData {
  documents: Y.Map<Y.Text>;
  metadata: Y.Map<string>;
}

interface tabToProvision {
  tabId: string;
  elements: {
    editor: HTMLElement;
    vimStatusBar: HTMLElement;
    markdownPreview: HTMLElement;
    diffViewer: HTMLElement;
  };
}

interface anonymousLogin {
  username: string;
}

export type currentRename =
  | {
      type: 'renameExistingFile';
      tabIdToRename: string;
      newFilename: string;
      userChangedNewFilename: boolean;
    }
  | {
      type: 'nameForNewFile';
      newFilename: string;
      userChangedNewFilename: boolean;
    };

interface currentRoomState {
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
}

export type roomSliceState = {
  currentRoom?: currentRoomState;
};

export const roomCreated = createAction('roomCreated', (data: createRoomResponse, forkDetails?: gistDetails) => ({
  payload: { data, forkDetails },
}));
export const switchToRoom = createAction('switchToRoom', (hashId: string) => ({
  payload: hashId,
}));

export const provisionTab = createAction('provisionTab', (tab: tabToProvision) => ({
  payload: tab,
}));
export const unprovisionTab = createAction('unprovisionTab', (tabId: string) => ({
  payload: { tabId },
}));

export const leaveRoom = createAction('leaveRoom');
export const setRoomData = createAction('setRoomData', (data: clientSideRoom) => ({ payload: data }));
export const setRoomGistDetails = createAction('setRoomGistDetails', (data: gistDetails) => ({
  payload: data,
}));
export const setIsCreatingRoom = createAction('setIsCreatingFroom');
export const initRoom = createAction(
  'initRoom',
  (roomHashId: string, enqueueSnackbar: enqueueSnackbar, startingTab?: string) => ({
    payload: { roomHashId, startingTab, enqueueSnackbar },
  }),
);
export const roomInitialized = createAction('roomInitialized', (yjsClientId: number) => ({ payload: yjsClientId }));

export const destroyRoom = createAction('destroyRoom');
export const switchCurrentFile = createAction('switchCurrentFile', (tabId: string) => ({ payload: tabId }));
export const addNewFile = createAction('addNewFile', (filename: string, content = '') => ({
  payload: { filename, content },
}));
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
export const saveBackToGist = createAction(
  'saveBackToGist',
  (roomHashId: string, enqueueSnackbar: enqueueSnackbar) => ({
    payload: { roomHashId, enqueueSnackbar },
  }),
);
export const gistSaved = createAction('gistSaved', (updatedDetails: gistDetails) => ({ payload: updatedDetails }));

export const linkGist = createAction('linkGist', (gistId: string) => ({ payload: gistId }));
export const fileRenamingActions = {
  startRenameCurrentFile: createAction('startRenameCurrentFile'),
  promptNameForNewFile: createAction('promptNameForNewFile'),
  startFileRename: createAction('startFileRename', (tabId: string) => ({ payload: tabId })),
  close: createAction('closeRenameFileModal'),
  setNewFileName: createAction('setNewFileName', (filename: string) => ({ payload: filename })),
};

export const setRoomAwarenessState = createAction('setRoomAwarenessState', (awareness: globalAwareness) => ({
  payload: awareness,
}));

export const deleteRoom = createAction('deleteRoom', (roomId: string) => ({ payload: roomId }));
export const roomDeleted = createAction('roomDeleted', (roomId: string) => ({ payload: roomId }));
export const copyToClipboard = createAction('copyToClipboard', (text: string, enqueueSnackbar: enqueueSnackbar) => ({
  payload: { text, enqueueSnackbar },
}));

export enum RenameError {
  Empty,
  Invalid,
  Duplicate,
}

export type currentRenameWithComputed = currentRename & {
  errors: RenameError[];
  isValid: boolean;
  areErrorsVisible: boolean;
};

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
    areErrorsVisible: currentRename.userChangedNewFilename && errors.length > 0,
    isValid: errors.length === 0,
  };
}

export function roomUsersAwarenessDetailsSelector(rootState: rootState): roomMemberWithComputed[] | undefined {
  const awareness = rootState.room.currentRoom?.awareness;
  if (!awareness) {
    return;
  }
  const assignedColors = getAssignedColors(awareness);
  if (awareness) {
    const roomMembers = [
      ...Object.values(awareness)
        .filter((a) => !!a.roomMemberDetails)
        .map((s) => ({
          ...(s.roomMemberDetails as roomMember),
          color: assignedColors.get(s.roomMemberDetails?.userIdOrAnonID as string) as string,
        })),
    ];
    return __uniqBy(roomMembers, (m) => m.userIdOrAnonID);
  }
}

export interface clientAwarenessWithComputed extends clientAwareness {
  color: string;
  clientID: string;
  roomMemberDetails: roomMemberWithComputed;
}

export type globalAwarenessMapWithComputedByUserID = Map<string, clientAwarenessWithComputed>;

export interface currentRoomStateWithComputed extends currentRoomState {
  isCurrentFileMarkdown: boolean;
  roomUrl: string;
  awarenessWithComputed?: globalAwarenessMapWithComputedByUserID;
}

export function getColorForUserId(userID: string, assignedColors: Map<string, string>) {
  return assignedColors.get(userID) || 'black';
}

export function getAssignedColors(awareness: globalAwareness) {
  const sortedClientAwareness = Object.values(awareness).sort((a, b) => a.timeJoined - b.timeJoined);
  const assignedColors = new Map<string, string>();

  sortedClientAwareness.forEach((client, index) => {
    if (client.roomMemberDetails) {
      assignedColors.set(client.roomMemberDetails?.userIdOrAnonID, allColors[index % allColors.length]);
    }
  });
  return assignedColors;
}

export function getAwarenessWithComputed(awareness: globalAwareness, assignedColors: Map<string, string>) {
  const awarenessMap: globalAwarenessMapWithComputedByUserID = new Map();
  for (let [id, clientAwareness] of Object.entries(awareness)) {
    const roomMember = clientAwareness.roomMemberDetails;
    if (roomMember) {
      const userID = roomMember.userIdOrAnonID;
      const color = assignedColors.get(userID);
      if (color) {
        awarenessMap.set(userID, { ...clientAwareness, roomMemberDetails: roomMember, color, clientID: id });
      }
    }
  }
  return awarenessMap;
}

export function currentRoomStateWithComputedSelector(state: rootState): currentRoomStateWithComputed | undefined {
  const currentRoom = state.room.currentRoom;
  if (!currentRoom) {
    return;
  }

  const isCurrentFileMarkdown = (() => {
    if (!currentRoom.currentTabId || !currentRoom.roomSharedState.fileDetailsStates) {
      return false;
    }
    return currentRoom.roomSharedState.fileDetailsStates[currentRoom.currentTabId].filetype === 'markdown';
  })();

  return {
    ...currentRoom,
    roomUrl: DOMAIN + `/rooms/${currentRoom.hashId}`,
    isCurrentFileMarkdown,
    awarenessWithComputed:
      state.room.currentRoom?.awareness &&
      getAwarenessWithComputed(state.room.currentRoom.awareness, getAssignedColors(state.room.currentRoom.awareness)),
  };
}

export function isCurrentUserRoomOwnerSelector(state: rootState): boolean | undefined {
  const currentOwnerId = state.room.currentRoom?.roomDetails?.owner.id;
  const currentUserId = state.currentUserDetails.userDetails?.id;
  if (!currentOwnerId || !currentUserId) {
    return;
  }
  return currentOwnerId === currentUserId;
}

export function doesCurrentRoomHaveAssociatedAndLoadedGistSelector(state: rootState): boolean | undefined {
  if (!state.room.currentRoom?.gistDetails?.html_url) {
    return false;
  }
  return !!state.room.currentRoom.roomDetails?.gistName;
}
