import { createAction } from '@reduxjs/toolkit';
import { MutableRefObject } from 'react';
import { ApolloClient } from '@apollo/client';
import { getRoomResponse, getGistResponse } from 'Client/queries';
import * as Y from 'yjs';
import { YArray } from 'yjs/dist/src/internals';
import { WebsocketProvider } from 'y-websocket';

export const initRoom = createAction(
  'initRoom',
  (
    editorContainerRef: MutableRefObject<HTMLDivElement>,
    apolloClient: ApolloClient<object>,
    roomHashId: string,
    isCreatingRoom: boolean,
  ) => ({
    payload: { editorContainerRef, apolloClient, roomHashId, isCreatingRoom },
  }),
);

export const roomInitialized = createAction(
  'roomInitialized',
  (ydoc: Y.Doc, provider: WebsocketProvider, editor: CodeMirror.Editor) => ({ payload: { ydoc, provider, editor } }),
);

export const receivedRoomData = createAction('receivedRoomData', (data: getRoomResponse) => ({ payload: data }));
export const receivedGistData = createAction('receivedGistData', (data: getGistResponse) => ({ payload: data }));
export const streamDocumentNameChanges = createAction('streamDocumentNameChanges');
export const documentNamesChanged = createAction('documentNamesChanged', (documentNames: string[]) => ({
  payload: documentNames,
}));
export const setCurrentDocumentName = createAction('setCurrentDocumentName', (documentName: string) => ({
  payload: documentName,
}));
export const startCreatingRoom = createAction('startCreatingRoom');
export const completeCreatingRoom = createAction('createAction');
export const leaveRoomAction = createAction('leaveRoomAction');
