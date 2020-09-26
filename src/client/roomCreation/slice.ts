import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';

import { roomCreationActions, roomCreationSliceState } from './types';

const initialState: roomCreationSliceState = {
  isOpen: false,
  gistUrl: '',
  roomName: '',
};

export const roomCreationSlice = createSlice({
  initialState,
  name: 'roomCreationSlice',
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(roomCreationActions.close, (s, { payload: username }) => resetRoom(username));
    builder.addCase(roomCreationActions.open, (s) => ({ ...s, isOpen: true }));
    builder.addCase(roomCreationActions.setGistUrl, (s, { payload: gistUrl }) => ({ ...s, gistUrl }));
    builder.addCase(roomCreationActions.setRoomName, (s, { payload: roomName }) => ({ ...s, roomName }));
    builder.addCase(roomCreationActions.initialize, (s, { payload: username }) => resetRoom(username));
    builder.addCase(roomCreationActions.createRoom, (s, { payload: { username } }) => resetRoom(username));
  },
});

function resetRoom(username: string): roomCreationSliceState {
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
  const { gistUrl } = rootState.roomCreation;

  const gistUrlError = (() => {
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
