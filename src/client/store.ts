import { createStore, applyMiddleware, Action, Store, combineReducers } from 'redux';
import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable';
import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';
import { filter, map, concatMap, withLatestFrom } from 'rxjs/operators';
import { Observable, of, from } from 'rxjs';
import { Convergence, ConvergenceDomain, RealTimeObject } from '@convergence/convergence';
import { CONVERGENCE_SERVICE_URL } from 'Shared/environment';
import { createLightTheme } from 'baseui';
import { roomsSlice } from './rooms/slice';
import { attemptConnectionEpic } from './convergenceConnection/epics';
import { createRoomEpic, userOwnedRoomsEpic, createEditorEpic } from './rooms/epics';

const epicMiddleware = createEpicMiddleware();

const rootReducer = combineReducers({
  rooms: roomsSlice.reducer,
});

export type rootState = ReturnType<typeof rootReducer>;

// const reducer = createReducer(initialState, (builder) =>
//   builder
//     .addCase(createRoom, createRoomReducer)
//     .addCase(roomCreated, (state, action) => ({
//       ...state,
//       creatingRoomStatus: action.payload, // roomId
//     }))
//     .addCase(resetRoomCreationStatus, (state, action) => ({
//       ...state,
//       creatingRoomStatus: undefined,
//     })),
// );

export const store = configureStore({
  reducer: rootReducer,
  middleware: [epicMiddleware],
});

export type AppDispatch = typeof store.dispatch;

const rootEpic = combineEpics(attemptConnectionEpic, createRoomEpic, createEditorEpic, userOwnedRoomsEpic);

epicMiddleware.run(rootEpic);
