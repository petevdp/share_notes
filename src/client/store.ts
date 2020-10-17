import { combineReducers, configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { ClientSideRoomManager } from 'Client/services/clientSideRoomManager';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { Subject } from 'rxjs/internal/Subject';

import { currentUserDetailsSlice } from './slices/currentUserDetails/slice';
import { fetchOwnedRoomsEpic } from './slices/ownedRooms/epics';
import { ownedRoomsSlice } from './slices/ownedRooms/slice';
import { deleteRoomEpic, initRoomEpic } from './slices/room/epics';
import { roomSlice } from './slices/room/slice';
import { initRoom, provisionTab } from './slices/room/types';
import {
  createRoomEpic,
  getGistPreviewEpic,
  initializeRoomCreationEpic,
  openRoomCreationEpic,
} from './slices/roomCreation/epics';
import { roomCreationSlice } from './slices/roomCreation/slice';
import { logOutEpic, retreiveSessionTokenEpic } from './slices/session/epics';
import { sessionSlice } from './slices/session/slice';
import { settingsSlice } from './slices/settings/slice';

const epicMiddleware = createEpicMiddleware();

const persistSettingsConfig = {
  key: 'settings',
  version: 1,
  storage,
};

const rootReducer = combineReducers({
  session: sessionSlice.reducer,
  room: roomSlice.reducer,
  settings: persistReducer(persistSettingsConfig, settingsSlice.reducer),
  currentUserDetails: currentUserDetailsSlice.reducer,
  roomCreation: roomCreationSlice.reducer,
  ownedRooms: ownedRoomsSlice.reducer,
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
  // it's important that we set the session token first
  retreiveSessionTokenEpic,
  initializeRoomCreationEpic,
  logOutEpic,
  createRoomEpic,
  initRoomEpic,
  openRoomCreationEpic,
  getGistPreviewEpic,
  deleteRoomEpic,
  fetchOwnedRoomsEpic,
];

epicMiddleware.run(combineEpics(...epics));

export type AppDispatch = typeof store.dispatch;
