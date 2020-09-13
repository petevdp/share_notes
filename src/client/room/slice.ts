import { createSlice } from '@reduxjs/toolkit';
import { setIsCreatingRoom, roomSliceState, setFilenames, setCurrentFile, roomCreated } from './types';

export const roomSlice = createSlice({
  name: 'room',
  initialState: { isCurrentUserCreatingRoom: false } as roomSliceState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(setIsCreatingRoom, (s) => ({ ...s, isCurrentUserCreatingRoom: true }))
      .addCase(setFilenames, (s, { payload: filenames }) => ({
        ...s,
        room: {
          ...s.room,
          filenames: filenames,
        },
      }))
      .addCase(setCurrentFile, (s, { payload: filenames }) => ({
        ...s,
        room: {
          ...s.room,
          currentFilename: filenames,
        },
      }))
      .addCase(roomCreated, (s, { payload: { room: roomData } }) => ({
        ...s,
        isCurrentUserCreatingRoom: true,
        room: {
          id: roomData.id,
          hashId: roomData.hashid,
          name: roomData.name,
          owner: roomData.owner,
          filenames: [],
        },
      })),
});
