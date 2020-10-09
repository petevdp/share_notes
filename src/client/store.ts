import { combineReducers, configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { ClientSideRoomManager } from 'Client/services/clientSideRoomManager';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { Subject } from 'rxjs/internal/Subject';

import { fetchRecentRoomsEpic } from './recentRooms/epics';
import { recentRoomsSlice } from './recentRooms/slice';
import {
  addNewFileEpic,
  deleteRoomEpic,
  destroyRoomEpic,
  initRoomEpic,
  provisionTabEpic,
  removeFileEpic,
  renameFileEpic,
  saveBackToGistEpic,
  unprovisionTabEpic,
  updateCurrentFileAwarenessEpic,
} from './room/epics';
import { roomSlice } from './room/slice';
import { initRoom, provisionTab } from './room/types';
import {
  createRoomEpic,
  getGistPreviewEpic,
  initializeRoomCreationEpic,
  openRoomCreationEpic,
} from './roomCreation/epics';
import { roomCreationSlice } from './roomCreation/slice';
import {
  fetchCurrentUserDataOnSetSessionTokenEpic,
  loginAnonymouslyEpic,
  logOutEpic,
  setSessionTokenEpic,
} from './session/epics';
import { sessionSlice } from './session/slice';
import { settingsSlice } from './settings/slice';

export interface epicDependencies {
  roomManager$$: Subject<ClientSideRoomManager>;
}

const epicMiddleware = createEpicMiddleware({ dependencies: { roomManager$$: new Subject<ClientSideRoomManager>() } });

const persistSettingsConfig = {
  key: 'settings',
  version: 1,
  storage,
};

// const persistSessionConfig = {
//   key: 'session',
//   version: 1,
//   storage,
// };

const rootReducer = combineReducers({
  session: sessionSlice.reducer,
  room: roomSlice.reducer,
  settings: persistReducer(persistSettingsConfig, settingsSlice.reducer),
  roomCreation: roomCreationSlice.reducer,
  recentRooms: recentRoomsSlice.reducer,
});

export type rootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware({
    thunk: false,
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, initRoom.type, provisionTab.type],
    },
  }).concat([epicMiddleware]),
});

export const persistor = persistStore(store);

const epics = [
  setSessionTokenEpic,
  fetchCurrentUserDataOnSetSessionTokenEpic,
  initializeRoomCreationEpic,
  logOutEpic,
  createRoomEpic,
  initRoomEpic,
  provisionTabEpic,
  unprovisionTabEpic,
  addNewFileEpic,
  renameFileEpic,
  removeFileEpic,
  saveBackToGistEpic,
  destroyRoomEpic,
  loginAnonymouslyEpic,
  updateCurrentFileAwarenessEpic,
  openRoomCreationEpic,
  getGistPreviewEpic,
  deleteRoomEpic,
  fetchRecentRoomsEpic,
];

epicMiddleware.run(combineEpics(...epics));

export type AppDispatch = typeof store.dispatch;
