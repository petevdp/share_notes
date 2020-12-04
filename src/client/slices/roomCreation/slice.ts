import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Option } from 'baseui/select';
import { roomCreated } from 'Client/slices/room/types';
import { rootState } from 'Client/store';

import { createGistCreationFieldsActions, createGistCreationFieldsReducer } from '../partials/gistCreationFields';
import { createGistImportFieldsReducer } from '../partials/gistImportFields';
import { roomCreationActions, RoomCreationFormType, roomCreationSliceState } from './types';

export const initialState: roomCreationSliceState = getInitialState();

const {
  setActiveForm,
  setRoomName,
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
    builder.addCase(setActiveForm, (s, { payload: type }) => ({ ...s, formSelected: type }));
    builder.addCase(setRoomName, (s, { payload: roomName }) => ({ ...s, roomName }));
    builder.addCase(setOwnedGists, (s, { payload: ownedGists }) => ({ ...s, ownedGists }));
    builder.addCase(initialize, (_, { payload: username }) => getInitialState());
    builder.addCase(createRoom, (state) => ({ ...state, submitted: true }));
    builder.addCase(roomCreated, (_, { payload: { data } }) => getInitialState());
    builder.addCase(setGistDetails, (state, { payload: gistDetails }) => {
      state.otherGists[gistDetails.id] = gistDetails;
    });

    builder.addCase(setIsCheckboxChecked, (s, { payload: checked }) => ({ ...s, shouldForkCheckboxChecked: checked }));

    const gistImportFieldsReducer = createGistImportFieldsReducer('roomCreation', initialState.gistImportFields);
    const gistCreationFieldsReducer = createGistCreationFieldsReducer('roomCreation');

    builder.addDefaultCase((state, action) => {
      gistImportFieldsReducer(state.gistImportFields, action, state.ownedGists);
      gistCreationFieldsReducer(state.gistCreationFields, action);
    });
  },
});

function getInitialState(): roomCreationSliceState {
  return {
    submitted: false,
    formSelected: RoomCreationFormType.Import,
    ownedGists: {},
    otherGists: {},
    gistImportFields: {
      gistUrl: '',
      shouldForkCheckboxChecked: false,
      selectedGistValue: [],
    },
    gistCreationFields: {
      type: 'noPreexistingFiles',
      name: '',
      description: '',
      isPrivate: false,
    },
    roomName: '',
  };
}
