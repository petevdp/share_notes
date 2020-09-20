import { createSlice, AnyAction } from '@reduxjs/toolkit';
import { roomCreationActions, roomCreationSliceState } from './types';
import { roomSliceState } from 'Client/room/types';
import { rootState } from 'Client/store';
import { reset } from 'module-alias';

const initialState: roomCreationSliceState = {
  isOpen: false,
  gistUrl: '',
  roomName: '',
};

export const roomCreationSlice = createSlice({
  initialState,
  name: 'createRoomModalSlice',
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(roomCreationActions.close, (s, { payload: username }) => resetRoom(s, username));
    builder.addCase(roomCreationActions.open, (s) => ({ ...s, isOpen: true }));
    builder.addCase(roomCreationActions.setGistUrl, (s, { payload: gistUrl }) => ({ ...s, gistUrl }));
    builder.addCase(roomCreationActions.setRoomName, (s, { payload: roomName }) => ({ ...s, roomName }));
    builder.addCase(roomCreationActions.initialize, (s, { payload: username }) => resetRoom(s, username));
    builder.addCase(roomCreationActions.createRoom, (s, { payload: { username } }) => resetRoom(s, username));
  },
});

function resetRoom(state: roomCreationSliceState, username: string): roomCreationSliceState {
  return {
    isOpen: false,
    roomName: `${username}'s Room`,
    gistUrl: '',
  };
}

export interface roomCreationSliceStateWithError extends roomCreationSliceState {
  gistUrlError?: string;
}

export function roomSliceStateWithErrorSelector(rootState: rootState): roomCreationSliceStateWithError {
  const { gistUrl, roomName } = rootState.roomCreation;

  let gistUrlError = (() => {
    let url: URL;
    try {
      if (!gistUrl) {
        return;
      }
      url = new URL(gistUrl);
    } catch (err) {
      if (err instanceof TypeError) {
        return 'Not a valid url.';
      } else {
        throw err;
      }
    }

    if (!/\/gist\.github\.com\/.+\/.+/.test(url.href)) {
      return 'Not a valid Gist url.';
    }
  })();

  return {
    ...rootState.roomCreation,
    gistUrlError,
  };
}
