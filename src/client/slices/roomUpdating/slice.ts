import { createSlice } from '@reduxjs/toolkit';

import * as gistCreation from '../partials/gistCreationFields';
import { createGistCreationFieldsReducer } from '../partials/gistCreationFields';
import * as gistImporting from '../partials/gistImportFields';
import { createGistImportFieldsReducer } from '../partials/gistImportFields';
import { GistUpdateType, roomUpdateActions, roomUpdatingSliceState } from './types';

const { initialize, setRoomName, roomUpdated, close, setGistUpdateType, setOwnedGists } = roomUpdateActions;

export const roomUpdatingSlice = createSlice({
  name: 'roomUpdating',
  initialState: null as roomUpdatingSliceState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(initialize, (state, { payload: startingDetails }) => {
      return {
        startingDetails,
        roomName: startingDetails.roomDetails.name,
        gistCreationFields: gistCreation.initialState,
        gistImportFields: gistImporting.initialState,
        gistUpdateType: GistUpdateType.None,
        submitted: false,
      };
    });

    builder.addCase(roomUpdated, () => null);
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
