import { createSlice, PayloadAction, Observable, createAction } from '@reduxjs/toolkit';
import { sliceState, roomCreationDetails, roomData } from './state';
import { StateObservable, Epic } from 'redux-observable';
import { filter, map, withLatestFrom, concatMap } from 'rxjs/operators';
import { userOwnedRoomsEpic } from './epics';

const initialState: sliceState = {
  creationHistory: [],
  creationStatus: null,
  subscribedToUserOwnedRooms: false,
  userOwnedRooms: [],
};

export const createRoom = createAction('createRoom', (details: roomCreationDetails) => ({ payload: details }));

export const roomCreated = createAction('roomCreated', (roomId) => ({
  payload: roomId,
}));

export const roomCreationConsumed = createAction('roomCreationConsumed');

export const subscribeToUserOwnedRooms = createAction('subscribeToUserOwnedRooms', (userId) => ({ payload: userId }));

export const createEditor = createAction('createEditor', (roomId: string) => ({ payload: roomId }));
export const editorCreated = createAction('editorCreated', (editorId: string) => ({ payload: editorId }));

export const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(createRoom, (state, action) => ({
        ...state,
        creationStatus: 'creating',
      }))
      .addCase(roomCreated, (state, action) => ({
        ...state,
        creationHistory: action.payload,
        creationStatus: 'created',
      }))
      .addCase(roomCreationConsumed, (state) => ({ ...state, creationStatus: null })),
});
