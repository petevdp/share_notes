import { createSlice } from '@reduxjs/toolkit';

import { ownedRoomsActions, ownedRoomsSliceState } from './types';

const initialState = null as ownedRoomsSliceState;

const { setOwnedRooms, resetOwnedRooms } = ownedRoomsActions;

export const ownedRoomsSlice = createSlice({
  initialState,
  name: 'ownedRooms',
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(setOwnedRooms, (_, { payload: { allRooms } }) => ({
      allRooms,
    }));
    builder.addCase(resetOwnedRooms, () => null);
  },
});
