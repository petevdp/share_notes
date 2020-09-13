import { createAction } from '@reduxjs/toolkit';
import { Subject } from 'rxjs';
import { RoomManager } from './epics';
import { getGistResponse, createRoomResponse } from 'Client/queries';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';

export type roomSliceState = {
  isCurrentUserCreatingRoom: boolean;
  room?: {
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
      files: {
        name: string;
        text: string;
      };
    };
  };
};

export const createRoom = createAction('createRoom', (input: CreateRoomInput) => ({ payload: input }));
export const roomCreated = createAction('roomCreated', (data: createRoomResponse) => ({ payload: data }));
export const setIsCreatingRoom = createAction('setIsCreatingFroom');
export const initRoom = createAction(
  'initRoom',
  (roomHashId: string, editorContainerRef: React.MutableRefObject<HTMLElement>) => ({
    payload: { roomHashId, editorContainerRef },
  }),
);
export const roomInitialized = createAction('roomInitialized', (roomManager: RoomManager) => ({
  payload: roomManager,
}));

export const destroyRoom = createAction('destroyRoom');
export const switchCurrentFile = createAction('switchActiveFile', (filename: string) => ({ payload: filename }));
export const addNewFile = createAction('addNewFile', (filename?: string) => ({ payload: filename }));
export const setCurrentFile = createAction('setActiveFile', (filename: string) => ({ payload: filename }));
export const setFilenames = createAction('setFilenames', (filenames: string[]) => ({ payload: filenames }));
export const saveBackToGist = createAction('saveBackToGist');
export const gistSaved = createAction('gistSaved');
