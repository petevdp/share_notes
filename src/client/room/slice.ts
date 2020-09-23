import { createSlice } from '@reduxjs/toolkit';
import {
  roomSliceState,
  setCurrentFile,
  roomCreated,
  room,
  roomInitialized,
  setRoomGistDetails,
  setGistFileDetails as setFileDetailsStates,
  leaveRoom,
  initRoom,
  setRoomData,
} from './types';

export const roomSlice = createSlice({
  name: 'room',
  initialState: { isCurrentUserCreatingRoom: false } as roomSliceState,
  reducers: {},
  extraReducers: (builder) => {
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

    builder.addCase(setRoomData, (s, { payload: details }) => {
      if (!s.currentRoom) {
        throw 'current room not set when setting room data';
      }
      return {
        ...s,
        currentRoom: {
          ...s.currentRoom,
          roomDetails: details,
        },
      };
    });

    builder.addCase(initRoom, (state, { payload: { roomHashId } }) => ({
      ...state,
      currentRoom: {
        hashId: roomHashId,
      },
    }));

    builder.addCase(roomInitialized, (s) => ({ ...s, isCurrentUserCreatingRoom: false }));

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
  },
});
