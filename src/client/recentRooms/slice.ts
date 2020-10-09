import { createSlice } from '@reduxjs/toolkit';

import { recentRoomsActions, recentRoomsSliceState } from './types';

const initialState: recentRoomsSliceState = [];

const { setRecentRooms } = recentRoomsActions;

export const recentRoomsSlice = createSlice({
  initialState,
  name: 'recentRooms',
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(setRecentRooms, (_, { payload: rooms }) => rooms);
  },
});
