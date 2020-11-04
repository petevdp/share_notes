import { AnyAction, createAction, createReducer } from '@reduxjs/toolkit';
import { Option } from 'baseui/select';
import { Value } from 'baseui/select';
import produce from 'immer';
import { WritableDraft } from 'immer/dist/internal';
import __last from 'lodash/last';
import { gistDetails } from 'Shared/githubTypes';

import { gistDetailsStore } from '../roomCreation/types';

export type gistImportFields = {
  gistUrl: string;
  selectedGistValue: Option[];
  shouldForkCheckboxChecked: boolean;
};

export enum GistImportStatus {
  Empty = 1,
  Invalid,
  NeedToLoadDetails, // well Fieldsed gist url, id isn't in ownedGists or unownedGists, just need to get data from github.
  OwnedGist, // valid url, id can be found in ownedGists
  UnownedGist, // valid url, id can be found in otherGists
  NotFound, //  invalid url, value for otherGIsts[id] is 'notFound'
}

export type gistImportFieldsWithComputed = gistImportFields & {
  status: GistImportStatus;
  errorMessage?: string;
  gistUrlId?: string;
  detailsForUrlAtGist?: gistDetails;
  isValid: boolean;
};

export const initialState: gistImportFields = { gistUrl: '', selectedGistValue: [], shouldForkCheckboxChecked: false };

type actionName = 'setGistUrl' | 'setGistSelectionValue' | 'setIsForkCheckboxChecked';

function namespaceAction(namespace: string, actionName: actionName) {
  return `${namespace}/gistImportFields/${actionName}`;
}

// function actionBasename(namespacedAction: string) {
//   return __last(namespacedAction.split('/'));
// }

export function createGistImportFieldsActions(namespace: string) {
  const getLocalActionName = (actionName: actionName) => namespaceAction(namespace, actionName);
  return {
    setGistUrl: createAction(getLocalActionName('setGistUrl'), (gistUrl: string) => ({ payload: gistUrl })),
    setGistSelectionValue: createAction(getLocalActionName('setGistSelectionValue'), (value: Value) => ({
      payload: value,
    })),
    setIsForkCheckboxChecked: createAction(getLocalActionName('setIsForkCheckboxChecked'), (checked: boolean) => ({
      payload: checked,
    })),
  };
}

export function createGistImportFieldsReducer(namespace: string, initial: gistImportFields = initialState) {
  const { setGistSelectionValue, setGistUrl, setIsForkCheckboxChecked } = createGistImportFieldsActions(namespace);
  return function gistImportFieldsReducer(
    state: WritableDraft<gistImportFields>,
    action: AnyAction,
    ownedGists?: WritableDraft<gistDetailsStore | undefined>,
  ) {
    if (setGistSelectionValue.match(action)) {
      const value = action.payload;
      const selectedGist = value[0]?.id && ownedGists && ownedGists[value[0]?.id];
      if (selectedGist && selectedGist !== 'notFound') {
        state.gistUrl = selectedGist.html_url;
      }
      // value is a readonly array for somre reason
      state.selectedGistValue = value as Option[];
    } else if (setGistUrl.match(action)) {
      state.gistUrl = action.payload;
      state.selectedGistValue = [];
    } else if (setIsForkCheckboxChecked.match(action)) {
      state.shouldForkCheckboxChecked = action.payload;
    }
  };
}

export function getGistImportFieldsWithComputed(
  fields: gistImportFields,
  ownedGists?: gistDetailsStore,
  otherGists?: gistDetailsStore,
): gistImportFieldsWithComputed {
  const { gistUrl } = fields;
  let url: URL;
  try {
    if (!gistUrl) {
      return {
        ...fields,
        status: GistImportStatus.Empty,
        isValid: false,
      };
    }
    url = new URL(gistUrl);
  } catch (err) {
    if (err instanceof TypeError) {
      return {
        ...fields,
        status: GistImportStatus.Invalid,
        errorMessage: 'Not a valid url.',
        isValid: false,
      };
    } else {
      throw err;
    }
  }

  const wrongDomain = url.hostname !== 'gist.github.com';
  const notGistPath = !/^\/[^\/]+(\/[^\/]+)?\/?$/.test(url.pathname);

  if (wrongDomain || notGistPath) {
    return {
      ...fields,
      status: GistImportStatus.Invalid,
      errorMessage: 'Not a valid Gist url.',
      isValid: false,
    };
  }

  const gistUrlId = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);

  let gistDetails = ownedGists && ownedGists[gistUrlId];
  if (gistDetails && gistDetails !== 'notFound') {
    return {
      ...fields,
      gistUrlId,
      status: GistImportStatus.OwnedGist,
      detailsForUrlAtGist: gistDetails,
      isValid: true,
    };
  }

  gistDetails = otherGists && otherGists[gistUrlId];

  if (gistDetails) {
    if (gistDetails === 'notFound') {
      return {
        ...fields,
        gistUrlId,
        status: GistImportStatus.NotFound,
        isValid: false,
      };
    } else {
      return {
        ...fields,
        gistUrlId,
        detailsForUrlAtGist: gistDetails,
        status: GistImportStatus.UnownedGist,
        isValid: fields.shouldForkCheckboxChecked,
      };
    }
  }

  return {
    ...fields,
    gistUrlId,
    status: GistImportStatus.NeedToLoadDetails,
    isValid: false,
  };
}
