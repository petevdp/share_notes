import { createSlice } from '@reduxjs/toolkit';
import { StateObservable } from 'redux-observable';
import { gistDetails } from 'Shared/githubTypes';
import { clientSideRoom, GistUpdateType } from 'Shared/types/roomTypes';

import * as gistCreation from '../partials/gistCreationFields';
import { createGistCreationFieldsReducer } from '../partials/gistCreationFields';
import * as gistImporting from '../partials/gistImportFields';
import { createGistImportFieldsReducer } from '../partials/gistImportFields';
import { roomUpdateActions, roomUpdatingSliceState } from './types';

const { initialize, setRoomName, roomUpdated, close, setGistUpdateType, setOwnedGists, updateRoom } = roomUpdateActions;

function initializeRoom(roomDetails: clientSideRoom, gistDetails?: gistDetails): roomUpdatingSliceState {
  return {
    startingDetails: { roomDetails, gistDetails },
    roomName: roomDetails.name,
    gistCreationFields: {
      type: 'usePreexistingFiles',
      isPrivate: false,
      description: '',
    },
    gistImportFields: gistImporting.initialState,
    gistUpdateType: GistUpdateType.None,
    submitted: false,
  };
}

export const roomUpdatingSlice = createSlice({
  name: 'roomUpdating',
  initialState: null as roomUpdatingSliceState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(initialize, (state, { payload: { roomDetails, gistDetails } }) => {
      return initializeRoom(roomDetails, gistDetails);
    });

    builder.addCase(close, () => null);

    builder.addCase(setRoomName, (state, { payload: newName }) => {
      if (!state) {
        return null;
      }
      state.roomName = newName;
    });

    builder.addCase(setGistUpdateType, (state, { payload: type }) => {
      if (!state) {
        return null;
      }
      state.gistUpdateType = type;
    });

    builder.addCase(setOwnedGists, (state, { payload: gists }) => {
      if (!state) {
        return null;
      }
      state.ownedGists = gists;
    });

    builder.addCase(updateRoom, (state) => {
      if (!state) {
        return null;
      }
      state.submitted = true;
    });

    builder.addCase(roomUpdated, (state, { payload: newRoomDetails }) =>
      initializeRoom(newRoomDetails.roomDetails, newRoomDetails.gistDetails),
    );

    {
      const gistImportFieldsReducer = createGistImportFieldsReducer('roomUpdating');
      const gistCreationFieldsReducer = createGistCreationFieldsReducer('roomUpdating');
      builder.addDefaultCase((state, action) => {
        if (state) {
          gistImportFieldsReducer(state.gistImportFields, action, state.ownedGists);
          gistCreationFieldsReducer(state.gistCreationFields, action);
          return;
        }
        return null;
      });
    }
  },
});
