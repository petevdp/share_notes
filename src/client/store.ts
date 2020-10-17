import { combineReducers, configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { ClientSideRoomManager } from 'Client/services/clientSideRoomManager';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { Subject } from 'rxjs/internal/Subject';

import { fetchOwnedRoomsEpic } from './ownedRooms/epics';
import { ownedRoomsSlice } from './ownedRooms/slice';
import { deleteRoomEpic, initRoomEpic } from './room/epics';
import { roomSlice } from './room/slice';
import { initRoom, provisionTab } from './room/types';
import {
  createRoomEpic,
  getGistPreviewEpic,
  initializeRoomCreationEpic,
  openRoomCreationEpic,
} from './roomCreation/epics';
import { roomCreationSlice } from './roomCreation/slice';
import { fetchCurrentUserDataOnSetSessionTokenEpic, logOutEpic, setSessionTokenEpic } from './session/epics';
import { sessionSlice } from './session/slice';
import { settingsSlice } from './settings/slice';

const epicMiddleware = createEpicMiddleware();

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
  setSessionTokenEpic,
  fetchCurrentUserDataOnSetSessionTokenEpic,
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
