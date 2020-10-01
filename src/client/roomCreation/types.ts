import { createAction } from '@reduxjs/toolkit';
import { Value } from 'baseui/select';
import { gistDetails } from 'Client/queries';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';

export interface roomCreationSliceState {
  isOpen: boolean;
  gistUrl: string;
  roomName: string;
  ownedGists?: gistDetails[];
  selectedGistValue: Value;
}

export const roomCreationActions = {
  roomCreationOpened: createAction('roomCreationOpened'),
  roomCreationClosed: createAction('roomCreationClosed', (username) => ({ payload: username })),
  setOwnedGists: createAction('setOwnedGistsForRoomCreation', (ownedGists: gistDetails[]) => ({ payload: ownedGists })),
  setGistSelectionValue: createAction('setGistSelectionValueForRoomCreation', (value: Value) => ({
    payload: value,
  })),
  setRoomName: createAction('setRoomNameForRoomCreation', (roomName: string) => ({ payload: roomName })),
  setGistUrl: createAction('setGistUrlForRoomCreation', (gistUrl: string) => ({ payload: gistUrl })),
  initialize: createAction('initializeRoomCreation', (username: string) => ({
    payload: username,
  })),
  createRoom: createAction('createRoom', (input: CreateRoomInput, username: string) => ({
    payload: { input, username },
  })),
};
