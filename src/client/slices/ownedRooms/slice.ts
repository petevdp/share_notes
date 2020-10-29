import { createSlice } from '@reduxjs/toolkit';

import { roomDeleted } from '../room/types';
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
    builder.addCase(roomDeleted, (state, { payload: roomId }) => {
      if (state?.allRooms) {
        state.allRooms = state.allRooms.filter((r) => r.id !== roomId);
      }
    });
  },
});
