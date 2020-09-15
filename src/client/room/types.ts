import { createAction } from '@reduxjs/toolkit';
import { RoomManager } from './epics';
import { createRoomResponse, getRoomResponse } from 'Client/queries';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';
import * as Y from 'yjs';

export interface gistDetails {
  description: string;
  // uniquely identifies gist
  name: string;
  url: string;
}

export type gistDetailKeys = 'description' | 'name' | 'url';
export const gistDetailKeys: gistDetailKeys[] = ['description', 'name', 'url'];

export interface roomRealTimeData {
  documents: Y.Map<Y.Text>;
  metadata: Y.Map<string>;
}

export interface room {
  id: string;
  hashId: string;
  name: string;
  filenames: string[];
  currentFilename?: string;
  owner: {
    id: string;
    githubLogin: string;
  };
  gist?: {
    id: string;
    details: gistDetails;
    files: {
      name: string;
      text: string;
    };
  };
}

export type roomSliceState = {
  isCurrentUserCreatingRoom: boolean;
  room?: room;
};

export const createRoom = createAction('createRoom', (input: CreateRoomInput) => ({ payload: input }));
export const roomCreated = createAction('roomCreated', (data: createRoomResponse) => ({ payload: data }));
export const setRoomData = createAction('setRoomData', (data: getRoomResponse) => ({ payload: data }));
export const setIsCreatingRoom = createAction('setIsCreatingFroom');
export const initRoom = createAction(
  'initRoom',
  (roomHashId: string, editorContainerRef: React.MutableRefObject<HTMLElement>, test: any) => ({
    payload: { roomHashId, editorContainerRef, test },
  }),
);
export const roomInitialized = createAction('roomInitialized');

export const destroyRoom = createAction('destroyRoom');
export const switchCurrentFile = createAction('switchActiveFile', (filename: string) => ({ payload: filename }));
export const addNewFile = createAction('addNewFile', (filename?: string) => ({ payload: filename }));
export const setCurrentFile = createAction('setCurrentFile', (filename: string) => ({ payload: filename }));
export const setFilenames = createAction('setFilenames', (filenames: string[]) => ({ payload: filenames }));
export const saveBackToGist = createAction('saveBackToGist');
export const gistSaved = createAction('gistSaved');
