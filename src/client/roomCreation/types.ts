import { createAction } from '@reduxjs/toolkit';
import { Value } from 'baseui/select';
import { gistDetails } from 'Client/queries';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import { CreateRoomInput } from 'Shared/inputs/roomInputs';

export interface gistDetailsStore {
  [id: string]: gistDetails | undefined;
}

export interface roomCreationSliceState {
  submitted: boolean;
  gistUrl: string;
  roomName: string;
  ownedGists?: gistDetailsStore;
  otherGists: { [id: string]: gistDetails | 'notFound' | undefined };
  selectedGistValue: Value;
}

export const roomCreationActions = {
  roomCreationOpened: createAction('roomCreationOpened'),
  roomCreationClosed: createAction('roomCreationClosed', (username) => ({ payload: username })),
  setOwnedGists: createAction('setOwnedGistsForRoomCreation', (ownedGists: gistDetailsStore) => ({
    payload: ownedGists,
  })),
  addOtherGistDetails: createAction('addOtherGistsDetailsForRoomCreation', (gistDetails: gistDetails) => ({
    payload: gistDetails,
  })),
  setGistSelectionValue: createAction('setGistSelectionValueForRoomCreation', (value: Value) => ({
    payload: value,
  })),
  setRoomName: createAction('setRoomNameForRoomCreation', (roomName: string) => ({ payload: roomName })),
  setGistUrl: createAction('setGistUrlForRoomCreation', (gistUrl: string) => ({ payload: gistUrl })),
  initialize: createAction('initializeRoomCreation', (username: string) => ({
    payload: username,
  })),
  createRoom: createAction('createRoom', (input: CreateRoomInput, username: string) => ({
    payload: { input, username },
  })),
};

export enum GistUrlInputStatus {
  Empty = 1,
  Invalid,
  NeedToLoadDetails, // implicitely valid url, id isn't in ownedGists or unownedGists, just need to get data from github.
  OwnedGist, // implicitely valid url, id can be found in ownedGists
  UnownedGist, // implicitely valid url, id can be found in otherGists
  NotFound, // implicitely valid url, and value for otherGIsts[id] is 'notFound'
}

export interface computedRoomCreationSliceState extends roomCreationSliceState {
  urlInputStatus: GistUrlInputStatus;
  errorMessage?: string;
  gistUrlId?: string;
  detailsForUrlAtGist?: gistDetails;
}

export function computedRoomCreationSliceStateSelector(rootState: rootState): computedRoomCreationSliceState {
  const { roomCreation } = rootState;
  const { gistUrl } = roomCreation;
  let url: URL;
  try {
    if (!gistUrl) {
      return {
        urlInputStatus: GistUrlInputStatus.Empty,
        ...roomCreation,
      };
    }
    url = new URL(gistUrl);
  } catch (err) {
    if (err instanceof TypeError) {
      return {
        urlInputStatus: GistUrlInputStatus.Invalid,
        errorMessage: 'Not a valid url.',
        ...roomCreation,
      };
    } else {
      throw err;
    }
  }

  console.log('href: ', url.href);
  console.log('path: ', url.pathname);
  console.log('host', url.hostname);

  const wrongDomain = url.hostname !== 'gist.github.com';
  const notGistPath = !/^\/[^\/]+(\/[^\/]+)?\/?$/.test(url.pathname);

  if (wrongDomain || notGistPath) {
    return {
      ...roomCreation,
      urlInputStatus: GistUrlInputStatus.Invalid,
      errorMessage: 'Not a valid Gist url.',
    };
  }

  const gistUrlId = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);

  if (roomCreation.ownedGists && roomCreation.ownedGists[gistUrlId]) {
    return {
      ...roomCreation,
      gistUrlId,
      urlInputStatus: GistUrlInputStatus.OwnedGist,
      detailsForUrlAtGist: roomCreation.ownedGists[gistUrlId],
    };
  }

  if (roomCreation.ownedGists && roomCreation.otherGists[gistUrlId]) {
    const data = roomCreation.otherGists[gistUrlId] as gistDetails | 'notFound';
    if (data === 'notFound') {
      return {
        ...roomCreation,
        gistUrlId,
        urlInputStatus: GistUrlInputStatus.NotFound,
      };
    } else {
      return {
        ...roomCreation,
        gistUrlId,
        detailsForUrlAtGist: data,
        urlInputStatus: GistUrlInputStatus.UnownedGist,
      };
    }
  }

  return {
    ...roomCreation,
    gistUrlId,
    urlInputStatus: GistUrlInputStatus.NeedToLoadDetails,
  };
}
