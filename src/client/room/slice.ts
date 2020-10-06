import { createSlice } from '@reduxjs/toolkit';

import {
  destroyRoom,
  fileRenamingActions,
  gistSaved,
  initRoom,
  leaveRoom,
  renameFile,
  roomCreated,
  roomInitialized,
  roomSliceState,
  setFileDetailsState as setFileDetailsStates,
  setRoomAwarenessState,
  setRoomData,
  setRoomGistDetails,
  switchCurrentFile,
} from './types';

export const roomSlice = createSlice({
  name: 'room',
  initialState: { isCurrentUserCreatingRoom: false } as roomSliceState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(leaveRoom, (s) => {
      if (!s.currentRoom) {
        return {};
      }
      return {
        ...s,
        currentRoom: {
          ...s.currentRoom,
        },
      };
    });

    builder.addCase(destroyRoom, (s) => {
      if (!s.currentRoom) {
        return {};
      }
      return {
        ...s,
        currentRoom: {
          ...s.currentRoom,
        },
      };
    });

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

    builder.addCase(gistSaved, (s, { payload: gistDetails }) => {
      if (!s.currentRoom) {
        throw 'current room not set';
      }

      return {
        ...s,
        currentRoom: {
          ...s.currentRoom,
          gistDetails,
        },
      };
    });

    builder.addCase(initRoom, (state, { payload: { roomHashId } }) => ({
      ...state,
      currentRoom: {
        initializingRoom: true,
        hashId: roomHashId,
        loadedTabs: [],
      },
    }));

    builder.addCase(roomInitialized, (s, { payload: yjsClientId }) => {
      if (!s.currentRoom) {
        throw 'current room not set';
      }
      return {
        ...s,
        isCurrentUserCreatingRoom: false,
        currentRoom: { ...s.currentRoom, yjsClientId, initializingRoom: false },
      };
    });

    builder.addCase(setFileDetailsStates, (s, { payload: newFileDetails }) => {
      if (!s?.currentRoom) {
        throw 'current room not set';
      } else if (!s.currentRoom?.hashId) {
        throw 'hashId not set';
      }
      const newTabIds = Object.keys(newFileDetails);

      let currentTabId: string;
      if (newTabIds.length === 0) {
        // leave undefined
      }
      if (!s.currentRoom.fileDetailsStates || !s.currentRoom.currentTabId) {
        currentTabId = newTabIds[0];
      } else if (newTabIds.includes(s.currentRoom.currentTabId)) {
        currentTabId = s.currentRoom.currentTabId;
      } else {
        const prevTabId = s.currentRoom.currentTabId || newTabIds[0];
        const prevTabIds = Object.keys(s.currentRoom.fileDetailsStates);
        const prevTabIndex = prevTabIds.indexOf(prevTabId);
        if (prevTabIndex === 0) {
          currentTabId = newTabIds[0];
        } else {
          currentTabId = newTabIds.slice(0, prevTabIndex).reverse()[0];
        }
      }

      let loadedTabs = s.currentRoom.loadedTabs;
      if (currentTabId && !loadedTabs.includes(currentTabId)) {
        loadedTabs = [...loadedTabs, currentTabId];
      }

      return {
        ...s,
        currentRoom: {
          ...s.currentRoom,
          loadedTabs,
          currentTabId,
          fileDetailsStates: newFileDetails,
        },
      };
    });

    builder.addCase(switchCurrentFile, (s, { payload: tabId }) => {
      if (!s.currentRoom) {
        throw 'current room not set';
      }
      let loadedTabs = s.currentRoom.loadedTabs;
      if (!loadedTabs.includes(tabId)) {
        loadedTabs = [...loadedTabs, tabId];
      }
      return {
        ...s,
        currentRoom: {
          ...s.currentRoom,
          loadedTabs,
          currentTabId: tabId.toString(),
        },
      };
    });

    builder.addCase(roomCreated, (s, { payload: { data, forkDetails } }) => ({
      ...s,
      currentRoom: {
        initializingRoom: true,
        loadedTabs: [],
        forkedGistDetails: forkDetails,
        hashId: data.createRoom.hashId,
        roomDetails: {
          ...data.createRoom,
          gistLoaded: false,
        },
      },
    }));

    builder.addCase(fileRenamingActions.startRenameCurrentFile, (state) => {
      if (!state.currentRoom) {
        throw 'current room not set';
      }

      const { fileDetailsStates, currentTabId } = state.currentRoom;
      if (!currentTabId || !fileDetailsStates) {
        throw 'current tab or file details not initialized';
      }

      return {
        ...state,
        currentRoom: {
          ...state.currentRoom,
          currentRename: {
            tabIdToRename: currentTabId,
            newFilename: fileDetailsStates[currentTabId].filename,
            userChangedNewFilename: false,
          },
        },
      };
    });

    builder.addCase(fileRenamingActions.setNewFileName, (state, { payload: newFilename }) => {
      if (!state.currentRoom) {
        throw 'current room not set';
      }

      if (!state.currentRoom.currentRename) {
        throw 'not currently renaming';
      }

      return {
        ...state,
        currentRoom: {
          ...state.currentRoom,
          currentRename: {
            ...state.currentRoom.currentRename,
            newFilename,
            userChangedNewFilename: true,
          },
        },
      };
    });

    {
      const closeFileRename = (state: roomSliceState) => {
        if (!state.currentRoom) {
          throw 'current room not set';
        }

        return {
          ...state,
          currentRoom: {
            ...state.currentRoom,
            currentRename: undefined,
          },
        };
      };

      builder.addCase(fileRenamingActions.close, closeFileRename);
      builder.addCase(renameFile, closeFileRename);
    }

    builder.addCase(setRoomAwarenessState, (state, { payload: globalAwareness }) => {
      if (!state.currentRoom) {
        throw 'current room not set';
      }

      return {
        ...state,
        currentRoom: {
          ...state.currentRoom,
          awareness: globalAwareness,
        },
      };
    });
  },
});
