import { createSlice } from '@reduxjs/toolkit';
import { fileRenamingSliceState, fileRenamingActions } from './types';
const initialState: fileRenamingSliceState = {};

export const fileRenamingSlice = createSlice({
  initialState,
  name: 'fileRenamingSlice',
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fileRenamingActions.startRename, (state, { payload: tabId }) => ({
      currentRename: {
        tabIdToRename: tabId,
        newFilename: '',
      },
    }));
  },
});
