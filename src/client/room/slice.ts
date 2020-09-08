import { createSlice, createAction } from '@reduxjs/toolkit';
import { getRoomResponse, getGistResponse } from 'Client/queries';
import { initRoom, receivedRoomData, documentNamesChanged, setCurrentDocumentName } from './actions';

export type roomSliceState = {
  isCreatingRoom: boolean;
};

export const roomSlice = createSlice({
  name: 'room',
  initialState: { isCreatingRoom: false } as roomSliceState,
  reducers: {},
  extraReducers: (builder) =>
    builder.addCase(initRoom, (s, a) => ({
      ...s,
      room: {
        hashId: a.payload.roomHashId,
      },
    })),
});
