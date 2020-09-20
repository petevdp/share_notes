import { createAction } from '@reduxjs/toolkit';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';

export interface roomCreationSliceState {
  isOpen: boolean;
  gistUrl: string;
  roomName: string;
}

export const roomCreationActions = {
  open: createAction('openRoomModal'),
  close: createAction('closeRoomModal', (username) => ({ payload: username })),
  setRoomName: createAction('setRoomNameForRoomCreation', (roomName: string) => ({ payload: roomName })),
  setGistUrl: createAction('setGistUrlForRoomCreation', (gistUrl: string) => ({ payload: gistUrl })),
  initialize: createAction('initializeRoomCreation', (username: string) => ({ payload: username })),
  createRoom: createAction('createRoom', (input: CreateRoomInput, username: string) => ({
    payload: { input, username },
  })),
};
