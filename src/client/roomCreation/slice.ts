import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';

import { roomCreationActions, roomCreationSliceState } from './types';

const initialState: roomCreationSliceState = {
  isOpen: false,
  gistUrl: '',
  roomName: '',
  selectedGistValue: [],
};

const {
  roomCreationClosed: close,
  roomCreationOpened: open,
  setGistUrl,
  setRoomName,
  setGistSelectionValue,
  initialize,
  createRoom,
  setOwnedGists,
} = roomCreationActions;

export const roomCreationSlice = createSlice({
  initialState,
  name: 'roomCreationSlice',
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(close, (s, { payload: username }) => resetRoom(username));
    builder.addCase(open, (s) => ({ ...s, isOpen: true }));
    builder.addCase(setGistUrl, (s, { payload: gistUrl }) => ({ ...s, gistUrl }));
    builder.addCase(setRoomName, (s, { payload: roomName }) => ({ ...s, roomName }));
    builder.addCase(setGistSelectionValue, (s, { payload: value }) => {
      const selectedGist = value[0]?.id && s.ownedGists?.find((g) => g.id === value[0].id);
      if (selectedGist) {
        if (!selectedGist) {
          throw "selected gist doesn't exist";
        }
        return {
          ...s,
          selectedGistValue: value,
          gistUrl: selectedGist.url,
        };
      } else {
        return {
          ...s,
          selectedGistValue: value,
        };
      }
    });
    builder.addCase(setOwnedGists, (s, { payload: ownedGists }) => ({ ...s, ownedGists }));
    builder.addCase(initialize, (s, { payload: username }) => resetRoom(username));
    builder.addCase(createRoom, (s, { payload: { username } }) => resetRoom(username));
  },
});

function resetRoom(username: string): roomCreationSliceState {
  return {
    isOpen: false,
    roomName: `${username}'s Room`,
    gistUrl: '',
    selectedGistValue: [],
  };
}

export interface roomCreationSliceStateWithError extends roomCreationSliceState {
  gistUrlError?: {
    status: 'empty' | 'invalid';
    message?: string;
  };
}

export function roomCreationSliceStateWithErrorSelector(rootState: rootState): roomCreationSliceStateWithError {
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

    console.log('href: ', url.href);
    console.log('path: ', url.pathname);
    console.log('host', url.hostname);

    const wrongDomain = url.hostname !== 'gist.github.com';
    const notGistPath = !/^\/[^\/]+(\/[^\/]+)?\/?$/.test(url.pathname);

    if (wrongDomain || notGistPath) {
      return 'Not a valid Gist url.';
    }
  })();

  return {
    ...rootState.roomCreation,
    gistUrlError,
  };
}
