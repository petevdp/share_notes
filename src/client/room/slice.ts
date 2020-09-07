import { createSlice, createAction } from '@reduxjs/toolkit';

export interface roomSliceState {
  isCreatingRoom: boolean;
}

export const startCreatingRoom = createAction('startCreatingRoom');
export const completeCreatingRoom = createAction('createAction');

export const roomSlice = createSlice({
  name: 'room',
  initialState: {
    isCreatingRoom: false,
  },
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(startCreatingRoom, (state, action) => ({ ...state, isCreatingRoom: true }))
      .addCase(completeCreatingRoom, (state, action) => ({ ...state, isCreatingRoom: false })),
});
