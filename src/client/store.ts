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
} from './room/epics';

const epicMiddleware = createEpicMiddleware();

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
  saveBackToGistEpic,
  destroyRoomEpic,
];

epicMiddleware.run(combineEpics(...epics));

export type AppDispatch = typeof store.dispatch;
