import { combineReducers } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { configureStore } from '@reduxjs/toolkit';
import { sessionSlice } from './session/slice';

const epicMiddleware = createEpicMiddleware();

const rootReducer = combineReducers({
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
