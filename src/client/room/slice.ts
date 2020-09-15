import { createSlice } from '@reduxjs/toolkit';
import {
  setIsCreatingRoom,
  roomSliceState,
  setFilenames,
  setCurrentFile,
  roomCreated,
  room,
  roomInitialized,
  initRoom,
  setRoomGistDetails,
} from './types';

export const roomSlice = createSlice({
  name: 'room',
  initialState: { isCurrentUserCreatingRoom: false } as roomSliceState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(setIsCreatingRoom, (s) => ({ ...s, isCurrentUserCreatingRoom: true }));

    builder.addCase(
      setFilenames,
      (s, action): roomSliceState => ({
        ...s,
        room: {
          ...(s.room as room),
          filenames: action.payload,
        },
      }),
    );

    builder.addCase(setRoomGistDetails, (s, { payload: details }) => ({
      ...s,
      gist: details,
    }));

    builder.addCase(setCurrentFile, (s, { payload: filename }) => ({
      ...s,
      room: {
        ...(s.room as room),
        currentFilename: filename,
      },
    }));

    builder.addCase(roomCreated, (s, { payload: { createRoom: roomData } }) => ({
      ...s,
      isCurrentUserCreatingRoom: true,
      room: {
        id: roomData.id,
        hashId: roomData.hashId,
        name: roomData.name,
        owner: roomData.owner,
        filenames: [],
      },
    }));

    builder.addCase(roomInitialized, (s) => ({ ...s, isCurrentUserCreatingRoom: false }));
  },
});
