import { createSlice } from '@reduxjs/toolkit';
import {
  setIsCreatingRoom,
  roomSliceState,
  setCurrentFile,
  roomCreated,
  room,
  roomInitialized,
  initRoom,
  setRoomGistDetails,
  setGistFileDetails as setFileDetailsStates,
  switchToRoom,
  leaveRoom,
} from './types';

export const roomSlice = createSlice({
  name: 'room',
  initialState: { isCurrentUserCreatingRoom: false } as roomSliceState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(setIsCreatingRoom, (s) => ({ ...s, isCurrentUserCreatingRoom: true }));

    builder.addCase(switchToRoom, (s, { payload: hashId }) => ({
      ...s,
      currentRoom: {
        hashId,
      },
    }));

    builder.addCase(leaveRoom, (s) => ({
      isCurrentUserCreatingRoom: false,
    }));

    builder.addCase(setRoomGistDetails, (s, { payload: details }) => {
      if (!s?.currentRoom) {
        throw 'current room not set';
      }

      return {
        ...s,
        currentRoom: {
          ...s.currentRoom,
          gistDetails: details,
        },
      };
    });

    builder.addCase(setFileDetailsStates, (s, { payload: newFileDetails }) => {
      if (!s?.currentRoom) {
        throw 'current room not set';
      } else if (!s.currentRoom?.hashId) {
        throw 'hashId not set';
      }
      return {
        ...s,
        currentRoom: {
          ...s.currentRoom,
          fileDetailsStates: newFileDetails,
        },
      };
    });

    builder.addCase(setCurrentFile, (s, { payload: tabId }) => {
      if (!s.currentRoom) {
        throw 'current room not set';
      }
      return {
        ...s,
        currentRoom: {
          ...s.currentRoom,
          currentTabId: tabId.toString(),
        },
      };
    });

    builder.addCase(roomCreated, (s, { payload: { createRoom: roomData } }) => ({
      ...s,
      isCurrentUserCreatingRoom: true,
      currentRoom: {
        ...s.currentRoom,
        hashId: roomData.hashId,
        roomDetails: roomData,
      },
    }));

    builder.addCase(roomInitialized, (s) => ({ ...s, isCurrentUserCreatingRoom: false }));
  },
});
