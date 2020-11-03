import { createAction } from '@reduxjs/toolkit';
import { Option } from 'baseui/select';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import { gistDetails } from 'Shared/githubTypes';

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
  GistImportStatus,
} from '../partials/gistImportFields';

export interface gistDetailsStore {
  [id: string]: gistDetails | undefined | 'notFound';
}

export enum RoomCreationFormType {
  NoGist,
  Creation,
  Import,
}

export interface roomCreationSliceState {
  submitted: boolean;
  roomName: string;
  formSelected: RoomCreationFormType;
  gistCreationFields: gistCreationFields;
  gistImportFields: gistImportFields;
  ownedGists?: gistDetailsStore;
  otherGists: gistDetailsStore;
}

export interface computedRoomCreationSliceState extends roomCreationSliceState {
  urlInputStatus: GistImportStatus;
  errorMessage?: string;
  gistUrlId?: string;
  detailsForUrlAtGist?: gistDetails;
}

export interface roomCreationSliceStateWithComputed extends roomCreationSliceState {
  gistCreationFields: gistCreationFieldsWithComputed;
  gistImportFields: gistImportFieldsWithComputed;
  gistSelectionOptions: Option[];
  canSubmit: boolean;
}

export function computedRoomCreationSliceStateSelector(state: rootState) {
  return getComputedRoomCreationSliceState(state.roomCreation);
}

export function getComputedRoomCreationSliceState(
  roomCreation: roomCreationSliceState,
): roomCreationSliceStateWithComputed {
  const gistCreationForm = getGistCreationFieldsWithComputed(roomCreation.gistCreationFields);
  const gistImportForm = getGistImportFieldsWithComputed(
    roomCreation.gistImportFields,
    roomCreation.ownedGists,
    roomCreation.otherGists,
  );

  const roomNameIsValid = roomCreation.roomName.trim().length > 0;

  const { NoGist, Creation, Import } = RoomCreationFormType;
  const { formSelected } = roomCreation;

  const canSubmit =
    roomNameIsValid &&
    !roomCreation.submitted &&
    (formSelected === NoGist ||
      (formSelected === Creation && gistCreationForm.isValid) ||
      (formSelected === Import && gistImportForm.isValid));

  return {
    ...roomCreation,
    gistCreationFields: gistCreationForm,
    gistImportFields: gistImportForm,
    canSubmit,
    gistSelectionOptions: roomCreation.ownedGists
      ? (Object.values(roomCreation.ownedGists) as gistDetails[]).map((gist) => ({
          id: gist.id,
          label: Object.values(gist.files)[0].filename,
          details: gist,
        }))
      : [],
  };
}

export const ROOM_CREATION_ACTION_NAMESPACE = 'roomCreation';
export const roomCreationActions = {
  setActiveForm: createAction(namespaceAction('setActiveForm'), (type: RoomCreationFormType) => ({ payload: type })),
  roomCreationOpened: createAction(namespaceAction('roomCreationOpened')),
  setOwnedGists: createAction(namespaceAction('setOwnedGists'), (ownedGists: gistDetailsStore) => ({
    payload: ownedGists,
  })),
  setGistDetails: createAction(namespaceAction('setGistDetails'), (gistDetails: gistDetails) => ({
    payload: gistDetails,
  })),
  setRoomName: createAction(namespaceAction('setRoomName'), (roomName: string) => ({ payload: roomName })),
  initialize: createAction(namespaceAction('initialize'), (username: string) => ({
    payload: username,
  })),
  createRoom: createAction(namespaceAction('createRoom'), (createRoomState: roomCreationSliceStateWithComputed) => ({
    payload: createRoomState,
  })),
  setIsCheckboxChecked: createAction(namespaceAction('setIsCheckboxChecked'), (checked: boolean) => ({
    payload: checked,
  })),
  gistCreation: createGistCreationFieldsActions(ROOM_CREATION_ACTION_NAMESPACE),
  gistImport: createGistImportFieldsActions(ROOM_CREATION_ACTION_NAMESPACE),
};

function namespaceAction(actionName: string) {
  return `${ROOM_CREATION_ACTION_NAMESPACE}/${actionName}`;
}
