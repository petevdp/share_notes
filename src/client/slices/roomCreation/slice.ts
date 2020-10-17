import { createSlice } from '@reduxjs/toolkit';
import { roomCreated } from 'Client/slices/room/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';

import { roomCreationActions, roomCreationSliceState } from './types';

const initialState: roomCreationSliceState = {
  submitted: false,
  gistUrl: '',
  otherGists: {},
  roomName: '',
  selectedGistValue: [],
  shouldForkCheckboxChecked: false,
};

const {
  roomCreationOpened: open,
  setGistUrl,
  setRoomName,
  setGistSelectionValue,
  initialize,
  createRoom,
  setOwnedGists,
  setGistDetails,
  setIsCheckboxChecked,
} = roomCreationActions;

export const roomCreationSlice = createSlice({
  initialState,
  name: 'roomCreationSlice',
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(open, (s) => ({ ...s, isOpen: true }));
    builder.addCase(setGistUrl, (s, { payload: gistUrl }) => ({ ...s, gistUrl, selectedGistValue: [] }));
    builder.addCase(setRoomName, (s, { payload: roomName }) => ({ ...s, roomName }));
    builder.addCase(setGistSelectionValue, (s, { payload: value }) => {
      const selectedGist = value[0]?.id && s.ownedGists && s.ownedGists[value[0]?.id];
      if (selectedGist) {
        if (!selectedGist) {
          throw "selected gist doesn't exist";
        }
        return {
          ...s,
          selectedGistValue: value,
          gistUrl: selectedGist.html_url,
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
    builder.addCase(createRoom, (s, { payload: { username } }) => ({ ...s, submitted: true }));
    builder.addCase(roomCreated, (s, { payload: { data } }) => resetRoom(data.createRoom.owner.githubLogin));
    builder.addCase(setGistDetails, (s, { payload: gistDetails }) => ({
      ...s,
      otherGists: {
        ...s.otherGists,
        [gistDetails.id]: gistDetails,
      },
    }));

    builder.addCase(setIsCheckboxChecked, (s, { payload: checked }) => ({ ...s, shouldForkCheckboxChecked: checked }));
  },
});

function resetRoom(username: string): roomCreationSliceState {
  return {
    submitted: false,
    ownedGists: {},
    otherGists: {},
    roomName: `${username}'s Room`,
    gistUrl: '',
    selectedGistValue: [],
    shouldForkCheckboxChecked: false,
  };
}
