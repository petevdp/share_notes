import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Option } from 'baseui/select';
import { roomCreated } from 'Client/slices/room/types';
import { rootState } from 'Client/store';

import { roomCreationActions, RoomCreationFormType, roomCreationSliceState } from './types';

export const initialState: roomCreationSliceState = getInitialState();

const {
  setActiveForm,
  gistCreation: { setGistDescription, setGistName, setIsGistPrivate },
  gistImport: { setGistSelectionValue, setGistUrl },
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
    builder.addCase(setGistUrl, (s, { payload: gistUrl }) => {
      s.gistImportForm.gistUrl = gistUrl;
      s.gistImportForm.selectedGistValue = [];
    });
    builder.addCase(setRoomName, (s, { payload: roomName }) => ({ ...s, roomName }));
    builder.addCase(setGistSelectionValue, (state, { payload: value }) => {
      const selectedGist = value[0]?.id && state.ownedGists && state.ownedGists[value[0]?.id];
      if (selectedGist) {
        state.gistImportForm.gistUrl = selectedGist.html_url;
      }
      // value is a readonly array for somre reason
      state.gistImportForm.selectedGistValue = value as Option[];
    });
    builder.addCase(setOwnedGists, (s, { payload: ownedGists }) => ({ ...s, ownedGists }));
    builder.addCase(initialize, (_, { payload: username }) => getInitialState());
    builder.addCase(createRoom, (state) => ({ ...state, submitted: true }));
    builder.addCase(roomCreated, (_, { payload: { data } }) => getInitialState());
    builder.addCase(setGistDetails, (state, { payload: gistDetails }) => {
      state.otherGists[gistDetails.id] = gistDetails;
    });

    builder.addCase(setIsCheckboxChecked, (s, { payload: checked }) => ({ ...s, shouldForkCheckboxChecked: checked }));

    builder.addCase(setGistName, (s, { payload: name }) => {
      s.gistCreationForm.name = name;
    });
    builder.addCase(setGistDescription, (s, { payload: description }) => {
      s.gistCreationForm.description = description;
    });
    builder.addCase(setIsGistPrivate, (s, { payload: isPrivate }) => {
      s.gistCreationForm.isPrivate = isPrivate;
    });
  },
});

function getInitialState(): roomCreationSliceState {
  return {
    submitted: false,
    formSelected: RoomCreationFormType.Import,
    ownedGists: {},
    otherGists: {},
    gistImportForm: {
      gistUrl: '',
      shouldForkCheckboxChecked: false,
      selectedGistValue: [],
    },
    gistCreationForm: {
      name: '',
      description: '',
      isPrivate: false,
    },
    roomName: '',
  };
}
