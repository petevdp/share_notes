import { createSlice } from '@reduxjs/toolkit';

import {
  fileRenamingActions,
  gistSaved,
  initRoom,
  leaveRoom,
  renameFile,
  roomCreated,
  roomInitialized,
  roomSliceState,
  setFileDetailsState,
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
    builder.addCase(leaveRoom, () => ({}));
    builder.addCase(setRoomGistDetails, (s, { payload: details }) => {
      if (!s?.currentRoom) {
        return s;
      }
      s.currentRoom.gistDetails = details;
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
        roomSharedState: {
          gistLoaded: false,
        },
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

    builder.addCase(setFileDetailsState, (s, { payload: newFileDetails }) => {
      if (!s?.currentRoom) {
        throw 'current room not set';
      } else if (!s.currentRoom?.hashId) {
        throw 'hashId not set';
      }
      const newTabIds = Object.keys(newFileDetails);

      let currentTabId: string;
      if (!s.currentRoom.roomSharedState.fileDetailsStates || !s.currentRoom.currentTabId) {
        // if there wasn't any existing file details or no current tab, select the first tab
        currentTabId = newTabIds[0];
      } else if (newTabIds.includes(s.currentRoom.currentTabId)) {
        // if the current tab is still there, use it
        currentTabId = s.currentRoom.currentTabId;
      } else {
        // if the current tab was deleted, then select this tab's left neighbor, or the new first tab if the current tab is the first tab
        const prevTabId = s.currentRoom.currentTabId || newTabIds[0];
        const prevTabIds = Object.keys(s.currentRoom.roomSharedState.fileDetailsStates);
        const prevTabIndex = prevTabIds.indexOf(prevTabId);
        if (prevTabIndex === 0) {
          currentTabId = newTabIds[0];
        } else {
          currentTabId = newTabIds.slice(0, prevTabIndex).reverse()[0];
        }
      }

      let loadedTabs = s.currentRoom.loadedTabs;
      // load new selected tab if it wasn't already
      if (currentTabId && !loadedTabs.includes(currentTabId)) {
        loadedTabs = [...loadedTabs, currentTabId];
      }

      // filter out deleted tabs
      loadedTabs = loadedTabs.filter((tabId) => Object.keys(newFileDetails).includes(tabId));

      s.currentRoom.loadedTabs = loadedTabs;
      s.currentRoom.currentTabId = currentTabId;
      s.currentRoom.roomSharedState.fileDetailsStates = newFileDetails;
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
        roomDetails: data.createRoom,
        roomSharedState: {
          gistLoaded: false,
        },
      },
    }));

    builder.addCase(fileRenamingActions.startRenameCurrentFile, (state) => {
      if (!state.currentRoom) {
        throw 'current room not set';
      }

      const {
        roomSharedState: { fileDetailsStates },
        currentTabId,
      } = state.currentRoom;
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

    builder.addCase(fileRenamingActions.startFileRename, (state, { payload: tabId }) => {
      if (!state.currentRoom) {
        throw 'current room not set';
      }
      const {
        roomSharedState: { fileDetailsStates },
      } = state.currentRoom;
      if (!fileDetailsStates) {
        throw 'current tab or file details not initialized';
      }
      state.currentRoom.currentRename = {
        tabIdToRename: tabId,
        newFilename: fileDetailsStates[tabId].filename,
        userChangedNewFilename: false,
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

      state.currentRoom.awareness = globalAwareness;
    });
  },
});
