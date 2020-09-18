import { createEpicMiddleware, combineEpics } from 'redux-observable';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
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
import { RoomService } from './services/roomService';
import { Subject } from 'rxjs';

export interface epicDependencies {
  roomManager$$: Subject<RoomManager>;
}

const epicMiddleware = createEpicMiddleware({ dependencies: { roomManager$$: new Subject<RoomManager>() } });

const rootReducer = combineReducers({
  session: sessionSlice.reducer,
  room: roomSlice.reducer,
});

export type rootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
  reducer: rootReducer,
  middleware: [epicMiddleware],
});

const epics = [
  setSessionTokenEpic,
  fetchCurrentUserDataOnSetSessionTokenEpic,
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
