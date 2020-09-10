import { createEpicMiddleware, combineEpics } from 'redux-observable';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { sessionSlice } from './session/slice';
import { fetchCurrentUserDetailsEpic, logOutEpic } from './session/epics';
import { roomSlice } from './room/slice';

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

epicMiddleware.run(combineEpics(fetchCurrentUserDetailsEpic, logOutEpic));

export type AppDispatch = typeof store.dispatch;
