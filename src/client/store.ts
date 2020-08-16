import { combineReducers } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { configureStore } from '@reduxjs/toolkit';
import { roomsSlice } from './rooms/slice';
import { GRAPHQL_URL } from 'Shared/environment';
import { sessionSlice } from './session/slice';
import { attemptConnectionEpic } from './convergenceConnection/epics';
import { createRoomEpic, userOwnedRoomsEpic, createEditorEpic } from './rooms/epics';
import { loginWithGithubEpic } from './session/epics';
import { ApolloClient, InMemoryCache } from '@apollo/client';

const epicMiddleware = createEpicMiddleware();

const rootReducer = combineReducers({
  rooms: roomsSlice.reducer,
  session: sessionSlice.reducer,
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

const rootEpic = combineEpics(
  attemptConnectionEpic,
  createRoomEpic,
  createEditorEpic,
  userOwnedRoomsEpic,
  loginWithGithubEpic,
);

epicMiddleware.run(rootEpic);
