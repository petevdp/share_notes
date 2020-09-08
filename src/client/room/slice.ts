import { createSlice } from '@reduxjs/toolkit';
import { startCreatingRoom, roomSliceState } from './types';

export const roomSlice = createSlice({
  name: 'room',
  initialState: { isCreatingRoom: false } as roomSliceState,
  reducers: {},
  extraReducers: (builder) => builder.addCase(startCreatingRoom, (s) => ({ ...s, isCreatingRoom: true })),
});
