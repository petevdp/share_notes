import { createAction } from '@reduxjs/toolkit';
import { RoomManager } from './epics';
import { createRoomResponse, getRoomResponse, gistDetails, roomDetails } from 'Client/queries';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';
import * as Y from 'yjs';

export type gistDetailKeys = 'description' | 'name' | 'url';
export const gistDetailKeys: gistDetailKeys[] = ['description', 'name', 'url'];

export interface roomRealTimeData {
  documents: Y.Map<Y.Text>;
  metadata: Y.Map<string>;
}

export interface fileDetailsState {
  tabId: string;
  filename: string;
  deleted: boolean;
}

export interface allFileDetailsStates {
  [id: string]: fileDetailsState;
}

export interface room {
  id: string;
  hashId: string;
  name: string;
  currentFileid?: string;
  fileDetailsStates?: allFileDetailsStates;
  owner: {
    id: string;
    githubLogin: string;
  };
  gist?: {
    id: string;
    details: gistDetails;
    files: gistDetails;
  };
}

export type roomSliceState = {
  isCurrentUserCreatingRoom: boolean;
  currentRoom?: {
    hashId: string;
    roomDetails?: roomDetails;
    gistDetails?: gistDetails;
    currentTabId?: string;
    fileDetailsStates?: allFileDetailsStates;
  };
};

export const roomCreated = createAction('roomCreated', (data: createRoomResponse) => ({ payload: data }));
export const switchToRoom = createAction('switchToRoom', (hashId: string) => ({
  payload: hashId,
}));
export const leaveRoom = createAction('leaveRoom');
export const setRoomData = createAction('setRoomData', (data: roomDetails) => ({ payload: data }));
export const setRoomGistDetails = createAction('setRoomGistDetails', (data: gistDetails) => ({
  payload: data,
}));
export const setIsCreatingRoom = createAction('setIsCreatingFroom');
export const initRoom = createAction(
  'initRoom',
  (roomHashId: string, editorContainerRef: React.MutableRefObject<HTMLElement>, test: any) => ({
    payload: { roomHashId, editorContainerRef, test },
  }),
);
export const roomInitialized = createAction('roomInitialized');

export const destroyRoom = createAction('destroyRoom');
export const switchCurrentFile = createAction('switchCurrentFile', (filename: string) => ({ payload: filename }));
export const addNewFile = createAction('addNewFile', (filename?: string) => ({ payload: filename }));
export const setCurrentFile = createAction('setCurrentFile', (id: string | number) => ({ payload: id }));
export const renameFile = createAction('renameFile', (tabId: string | number, newFilename: string) => ({
  payload: { tabId, newFilename },
}));
export const setGistFileDetails = createAction('setFileDetailState', (allFileDetailsState: allFileDetailsStates) => ({
  payload: allFileDetailsState,
}));
export const removeFile = createAction('removeFile', (filename: string) => ({ payload: filename }));
export const saveBackToGist = createAction('saveBackToGist');
export const gistSaved = createAction('gistSaved');
