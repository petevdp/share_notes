import { AnyAction, createAction } from '@reduxjs/toolkit';
import { WritableDraft } from 'immer/dist/internal';

export type gistCreationFieldsCreatingRoom = {
  type: 'noPreexistingFiles';
  name: string;
  description: string;
  isPrivate: boolean;
};

export type gistCreationFieldsEditingRoom = {
  type: 'usePreexistingFiles';
  description: string;
  isPrivate: boolean;
};

export type gistCreationFields = gistCreationFieldsEditingRoom | gistCreationFieldsCreatingRoom;

export type gistCreationFieldsCreatingRoomWithComputed = gistCreationFieldsCreatingRoom & {
  isValid: boolean;
};

export type gistCreationFieldsEditingRoomWithComputed = gistCreationFieldsEditingRoom & {
  isValid: boolean;
};

export type gistCreationFieldsWithComputed = gistCreationFields & {
  isValid: boolean;
};

export type actionName = 'setGistName' | 'setGistDescription' | 'setIsGistPrivate';

// export const initialState: gistCreationFields = {
//   name: '',
//   description: '',
//   isPrivate: false,
// };

function namespaceAction(namespace: string, actionName: actionName) {
  return `${namespace}/gistCreationFields/${actionName}`;
}

export function createGistCreationFieldsActions(namespace: string) {
  const getLocalAction = (actionName: actionName) => namespaceAction(namespace, actionName);
  return {
    setGistName: createAction(getLocalAction('setGistName'), (name: string) => ({ payload: name })),
    setGistDescription: createAction(getLocalAction('setGistDescription'), (description: string) => ({
      payload: description,
    })),
    setIsGistPrivate: createAction(getLocalAction('setIsGistPrivate'), (isPrivate: boolean) => ({
      payload: isPrivate,
    })),
  };
}

export function createGistCreationFieldsReducer(namespace = '') {
  const { setGistName, setGistDescription, setIsGistPrivate } = createGistCreationFieldsActions(namespace);
  return function gistCreationFieldsReducer(state: WritableDraft<gistCreationFields>, action: AnyAction) {
    if (state.type === 'noPreexistingFiles' && setGistName.match(action)) {
      state.name = action.payload;
      return;
    }
    if (setGistDescription.match(action)) {
      state.description = action.payload;
      return;
    }

    if (setIsGistPrivate.match(action)) {
      state.isPrivate = action.payload;
      return;
    }
  };
}

export function getGistCreationFieldsWithComputed(fields: gistCreationFields): gistCreationFieldsWithComputed {
  if (fields.type === 'noPreexistingFiles') {
    const { name } = fields;
    const isValid = name.trim().length > 0;
    return {
      ...fields,
      isValid,
      name,
    };
  } else {
    return {
      ...fields,
      isValid: true,
    };
  }
}
