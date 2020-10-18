import { createAction } from '@reduxjs/toolkit';
import { Option } from 'baseui/select';
import { Value } from 'baseui/select';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import { ownKeys } from 'immer/dist/internal';
import { gistDetails } from 'Shared/githubTypes';

import { roomCreated } from '../room/types';

export interface gistDetailsStore {
  [id: string]: gistDetails | undefined;
}

export type gistCreationForm = {
  name: string;
  description: string;
  isPrivate: boolean;
};

export type gistImportForm = {
  gistUrl: string;
  selectedGistValue: Value;
  shouldForkCheckboxChecked: boolean;
};

export enum RoomCreationFormType {
  Creation,
  Import,
}

export interface roomCreationSliceState {
  submitted: boolean;
  roomName: string;
  formSelected: RoomCreationFormType;
  gistCreationForm: gistCreationForm;
  gistImportForm: gistImportForm;
  ownedGists?: gistDetailsStore;
  otherGists: { [id: string]: gistDetails | 'notFound' | undefined };
}

export const roomCreationActions = {
  setActiveForm: createAction('setSelectedFormForRoomCreation', (type: RoomCreationFormType) => ({ payload: type })),
  roomCreationOpened: createAction('roomCreationOpened'),
  setOwnedGists: createAction('setOwnedGistsForRoomCreation', (ownedGists: gistDetailsStore) => ({
    payload: ownedGists,
  })),
  setGistDetails: createAction('addOtherGistsDetailsForRoomCreation', (gistDetails: gistDetails) => ({
    payload: gistDetails,
  })),
  setRoomName: createAction('setRoomNameForRoomCreation', (roomName: string) => ({ payload: roomName })),
  initialize: createAction('initializeRoomCreation', (username: string) => ({
    payload: username,
  })),
  createRoom: createAction('createRoom', (createRoomState: roomCreationSliceStateWithComputed) => ({
    payload: {
      ...createRoomState,
      roomName: createRoomState.roomName.trim(),
      gistImportForm: {
        ...createRoomState.gistImportForm,
        gistUrl: createRoomState.gistImportForm.gistUrl.trim(),
      },
    },
  })),
  setIsCheckboxChecked: createAction('setIsForkCheckboxCheckedForRoomCreation', (checked: boolean) => ({
    payload: checked,
  })),

  gistCreation: {
    setGistName: createAction('setGistNameForRoomCreation', (name: string) => ({ payload: name })),
    setGistDescription: createAction('setGistDescriptionForRoomCreation', (description: string) => ({
      payload: description,
    })),
    setIsGistPrivate: createAction('setIsGistPrivateForRoomCreation', (isPrivate: boolean) => ({ payload: isPrivate })),
  },
  gistImport: {
    setGistUrl: createAction('setGistUrlForRoomCreation', (gistUrl: string) => ({ payload: gistUrl })),
    setGistSelectionValue: createAction('setGistSelectionValueForRoomCreation', (value: Value) => ({
      payload: value,
    })),
  },
};

export enum GistImportStatus {
  Empty = 1,
  Invalid,
  NeedToLoadDetails, // well formed gist url, id isn't in ownedGists or unownedGists, just need to get data from github.
  OwnedGist, // valid url, id can be found in ownedGists
  UnownedGist, // valid url, id can be found in otherGists
  NotFound, //  invalid url, value for otherGIsts[id] is 'notFound'
}

const SUBMITTABLE_IMPORT_STATUSES = [GistImportStatus.OwnedGist, GistImportStatus.UnownedGist];

export interface computedRoomCreationSliceState extends roomCreationSliceState {
  urlInputStatus: GistImportStatus;
  errorMessage?: string;
  gistUrlId?: string;
  detailsForUrlAtGist?: gistDetails;
}

export type gistCreationFormWithComputed = gistCreationForm & {
  isValid: boolean;
};

export type gistImportFormWithComputed = gistImportForm & {
  status: GistImportStatus;
  errorMessage?: string;
  gistUrlId?: string;
  detailsForUrlAtGist?: gistDetails;
};

export interface roomCreationSliceStateWithComputed extends roomCreationSliceState {
  gistCreationForm: gistCreationFormWithComputed;
  gistImportForm: gistImportFormWithComputed;
  gistSelectionOptions: Option[];
  canSubmit: boolean;
}

export function computedRoomCreationSliceStateSelector(state: rootState) {
  return getComputedRoomCreationSliceState(state.roomCreation);
}

export function getComputedRoomCreationSliceState(
  roomCreation: roomCreationSliceState,
): roomCreationSliceStateWithComputed {
  const gistCreationForm = getGistCreationFormWithComputed(roomCreation);
  const gistImportForm = getGistImportFormWithComputed(roomCreation);

  const roomNameIsValid = roomCreation.roomName.trim().length > 0;

  const canSubmit =
    roomNameIsValid &&
    !roomCreation.submitted &&
    (roomCreation.formSelected === RoomCreationFormType.Creation
      ? gistCreationForm.isValid
      : SUBMITTABLE_IMPORT_STATUSES.includes(gistImportForm.status));

  return {
    ...roomCreation,
    gistCreationForm,
    gistImportForm,
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

function getGistCreationFormWithComputed(state: roomCreationSliceState): gistCreationFormWithComputed {
  const { name } = state.gistCreationForm;
  const isValid = name.trim().length > 0;
  return {
    ...state.gistCreationForm,
    isValid,
  };
}

function getGistImportFormWithComputed(state: roomCreationSliceState): gistImportFormWithComputed {
  const form = state.gistImportForm;
  const { gistUrl } = form;
  let url: URL;
  try {
    if (!gistUrl) {
      return {
        ...form,
        status: GistImportStatus.Empty,
      };
    }
    url = new URL(gistUrl);
  } catch (err) {
    if (err instanceof TypeError) {
      return {
        ...form,
        status: GistImportStatus.Invalid,
        errorMessage: 'Not a valid url.',
      };
    } else {
      throw err;
    }
  }

  const wrongDomain = url.hostname !== 'gist.github.com';
  const notGistPath = !/^\/[^\/]+(\/[^\/]+)?\/?$/.test(url.pathname);

  if (wrongDomain || notGistPath) {
    return {
      ...form,
      status: GistImportStatus.Invalid,
      errorMessage: 'Not a valid Gist url.',
    };
  }

  const gistUrlId = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);

  if (state.ownedGists && state.ownedGists[gistUrlId]) {
    return {
      ...form,
      gistUrlId,
      status: GistImportStatus.OwnedGist,
      detailsForUrlAtGist: state.ownedGists[gistUrlId],
    };
  }

  if (state.ownedGists && state.otherGists[gistUrlId]) {
    const data = state.otherGists[gistUrlId] as gistDetails | 'notFound';
    if (data === 'notFound') {
      return {
        ...form,
        gistUrlId,
        status: GistImportStatus.NotFound,
      };
    } else {
      return {
        ...form,
        gistUrlId,
        detailsForUrlAtGist: data,
        status: GistImportStatus.UnownedGist,
      };
    }
  }

  return {
    ...form,
    gistUrlId,
    status: GistImportStatus.NeedToLoadDetails,
  };
}
