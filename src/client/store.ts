import { createEpicMiddleware, combineEpics } from 'redux-observable';
import { configureStore, combineReducers, getDefaultMiddleware } from '@reduxjs/toolkit';
import { sessionSlice } from './session/slice';
import { logOutEpic, fetchCurrentUserDataOnSetSessionTokenEpic, setSessionTokenEpic } from './session/epics';
import { roomSlice } from './room/slice';
import {
  initRoomEpic,
  switchCurrentFileEpic,
  addNewFileEpic,
  saveBackToGistEpic,
  destroyRoomEpic,
  createRoomEpic,
  RoomManager,
  removeFileEpic,
  renameFileEpic,
} from './room/epics';

import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { Subject } from 'rxjs';
import { settingsSlice } from './settings/slice';
import { roomCreationSlice } from './roomCreation/slice';
import { initializeRoomCreationEpic } from './roomCreation/epics';
import { initRoom } from './room/types';

export interface epicDependencies {
  roomManager$$: Subject<RoomManager>;
}

const epicMiddleware = createEpicMiddleware({ dependencies: { roomManager$$: new Subject<RoomManager>() } });

const settingsPersistConfig = {
  key: 'settings',
  version: 1,
  storage,
};

const rootReducer = combineReducers({
  session: sessionSlice.reducer,
  room: roomSlice.reducer,
  settings: persistReducer(settingsPersistConfig, settingsSlice.reducer),
  roomCreation: roomCreationSlice.reducer,
});

export type rootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware({
    thunk: false,
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, initRoom.type],
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
  switchCurrentFileEpic,
  addNewFileEpic,
  renameFileEpic,
  removeFileEpic,
  saveBackToGistEpic,
  destroyRoomEpic,
];

epicMiddleware.run(combineEpics(...epics));

export type AppDispatch = typeof store.dispatch;
