import { createAction } from '@reduxjs/toolkit';
import { Option } from 'baseui/select';
import { rootState } from 'Client/store';
import { gistDetails } from 'Shared/githubTypes';
import { clientSideRoom, gistUpdate, GistUpdateType } from 'Shared/types/roomTypes';

import {
  createGistCreationFieldsActions,
  getGistCreationFieldsWithComputed,
  gistCreationFields,
  gistCreationFieldsWithComputed,
} from '../partials/gistCreationFields';
import {
  createGistImportFieldsActions,
  getGistImportFieldsWithComputed,
  gistImportFields,
  gistImportFieldsWithComputed,
} from '../partials/gistImportFields';
import { gistDetailsStore } from '../roomCreation/types';

export interface roomUpdatingState {
  startingDetails: { roomDetails: clientSideRoom; gistDetails?: gistDetails };
  roomName: string;
  gistUpdateType: GistUpdateType;
  ownedGists?: gistDetailsStore;
  otherGists?: gistDetailsStore;
  gistCreationFields: gistCreationFields;
  gistImportFields: gistImportFields;
  submitted: boolean;
}

export interface roomUpdatingStateWithComputed extends roomUpdatingState {
  gistCreationFields: gistCreationFieldsWithComputed;
  gistImportFields: gistImportFieldsWithComputed;
  gistSelectionOptions: Option[];
  canSubmit: boolean;
}

export type roomUpdatingSliceState = roomUpdatingState | null;
export type roomUpdatingSliceStateWithComputed = roomUpdatingStateWithComputed | null;

export function getComputedRoomUpdatingSliceState(state: roomUpdatingState): roomUpdatingStateWithComputed {
  const gistCreationFields = getGistCreationFieldsWithComputed(state.gistCreationFields);
  const gistImportFields = getGistImportFieldsWithComputed(state.gistImportFields, state.ownedGists, state.otherGists);
  const canSubmit = (() => {
    const roomNameIsValid = state.roomName.trim().length > 0;
    const { None, Create, Delete, Import } = GistUpdateType;
    const { gistUpdateType } = state;

    return (
      roomNameIsValid &&
      ([None, Delete].includes(gistUpdateType) ||
        (gistUpdateType === Create && gistCreationFields.isValid) ||
        (gistUpdateType === Import && gistImportFields.isValid))
    );
  })();

  return {
    ...state,
    gistCreationFields,
    gistImportFields,
    canSubmit,
    gistSelectionOptions: state.ownedGists
      ? (Object.values(state.ownedGists) as gistDetails[]).map((gist) => ({
          id: gist.id,
          label: Object.values(gist.files)[0].filename,
          details: gist,
        }))
      : [],
  };
}

export function roomUpdatingSliceStateWithComputedSelector(state: rootState) {
  if (state.roomUpdating) {
    return getComputedRoomUpdatingSliceState(state.roomUpdating);
  } else {
    return null;
  }
}

export const ROOM_UPDATE_ACTION_NAMESPACE = 'roomUpdating';

export interface startingRoomDetails {
  roomDetails: clientSideRoom;
  gistDetails?: gistDetails;
}

const namespaceAction = (action: string) => `${ROOM_UPDATE_ACTION_NAMESPACE}/${action}`;

export const roomUpdateActions = {
  initialize: createAction(namespaceAction('initialize'), (startingRoomDetails: startingRoomDetails) => ({
    payload: startingRoomDetails,
  })),
  updateRoom: createAction(
    namespaceAction('updateRoom'),
    (roomName: string, roomId: string, gistUpdate: gistUpdate, startingRoomDetails: startingRoomDetails) => ({
      payload: { roomName, roomId, gistUpdate, startingRoomDetails },
    }),
  ),
  roomUpdated: createAction(namespaceAction('roomUpdated'), (startingRoomDetails: startingRoomDetails) => ({
    payload: startingRoomDetails,
  })),
  close: createAction(namespaceAction('close')),
  setRoomName: createAction(namespaceAction('setRoomName'), (newName: string) => ({ payload: newName })),
  setGistUpdateType: createAction(namespaceAction('setGistUpdateType'), (type: GistUpdateType) => ({ payload: type })),
  setOwnedGists: createAction(namespaceAction('setOwnedGists'), (ownedGists: gistDetailsStore) => ({
    payload: ownedGists,
  })),
  gistCreation: createGistCreationFieldsActions('roomUpdating'),
  gistImport: createGistImportFieldsActions('roomUpdating'),
};
