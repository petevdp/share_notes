import { roomCreated } from 'Client/slices/room/types';
import { rootState } from 'Client/store';
import { CREATE_ROOM, createRoomResponse } from 'Client/utils/queries';
import { octokitRequestWithAuth } from 'Client/utils/utils';
import { request as gqlRequest } from 'graphql-request';
import __isEmpty from 'lodash/isEmpty';
import __isEqual from 'lodash/isEqual';
import { useEffect, useRef } from 'react';
import { AnyAction } from 'redux';
import { Epic, StateObservable } from 'redux-observable';
import { auditTime } from 'rxjs/internal/operators/auditTime';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { Subject } from 'rxjs/internal/Subject';
import { GRAPHQL_URL } from 'Shared/environment';
import { gistDetails } from 'Shared/githubTypes';
import { createRoomInput } from 'Shared/types/roomTypes';

import { setCurrentUserDetails } from '../currentUserDetails/types';
import { gistImportFieldsWithComputed, GistImportStatus } from '../partials/gistImportFields';
import { gistDetailsStore, roomCreationActions, RoomCreationFormType } from './types';

export const initializeRoomCreationEpic: Epic = (action$) =>
  action$.pipe(
    filter(setCurrentUserDetails.match),
    map(({ payload: data }) => roomCreationActions.initialize(data.githubLogin)),
  );

export const createRoomEpic: Epic = (action$, state$: StateObservable<rootState>) =>
  action$.pipe(
    filter(roomCreationActions.createRoom.match),
    auditTime(2000),
    withLatestFrom(state$),
    concatMap(async ([{ payload: roomCreationState }, rootState]) => {
      if (!rootState.session.token) {
        throw 'not logged in';
      }
      const { NoGist: Quick, Creation, Import } = RoomCreationFormType;
      const { formSelected } = roomCreationState;
      let gistDetails: gistDetails | undefined;
      let createdGist = false;
      if (formSelected === Import) {
        const form = roomCreationState.gistImportFields;
        if (form.status === GistImportStatus.UnownedGist) {
          const gistId = getGistId(form.gistUrl);
          const githubRequest = octokitRequestWithAuth();
          gistDetails = await githubRequest('POST /gists/{id}/forks', {
            id: gistId,
          }).then((res) => res.data);
        } else if (form.status === GistImportStatus.OwnedGist) {
          gistDetails = form.detailsForUrlAtGist as gistDetails;
          createdGist = true;
        } else {
          throw 'invalid status for room creation';
        }
      } else if (formSelected === Creation) {
        const form = roomCreationState.gistCreationFields;
        const response = await octokitRequestWithAuth()('POST /gists', {
          files: { [form.name]: { content: form.name } },
        });

        gistDetails = response.data;
        createdGist = true;
      } else if (formSelected === Quick) {
        // do nothing
      }

      const roomCreationInput: createRoomInput = {
        name: roomCreationState.roomName,
        ownerId: rootState.currentUserDetails.userDetails?.id as string,
        gistName: gistDetails?.id,
      };

      if (createdGist && gistDetails && process.env.NODE_ENV === 'development') {
        roomCreationInput.createdGistUrl = gistDetails.url;
      }

      const res = await gqlRequest<createRoomResponse>(GRAPHQL_URL, CREATE_ROOM, { data: roomCreationInput });
      return roomCreated(res);
    }),
  );

export function fetchCurrentUsersGists(): Promise<gistDetailsStore> {
  return octokitRequestWithAuth()('GET /gists').then((res) => {
    const store: gistDetailsStore = {};
    for (let gist of res.data) {
      store[gist.id] = {
        ...gist,
        forks: [],
        history: [],
      };
    }

    return store;
  });
}

export function useFetchImportableGistDetails(
  importFields: gistImportFieldsWithComputed,
  setGistDetails: (details: gistDetails) => void,
) {
  const gistUrlSubject = useRef(new Subject<gistImportFieldsWithComputed>());
  useEffect(() => {
    gistUrlSubject.current
      .pipe(
        auditTime(2000),
        filter(({ status }) => status === GistImportStatus.NeedToLoadDetails),
        concatMap(async ({ status: urlInputStatus, gistUrlId }) => {
          return octokitRequestWithAuth()(`GET /gists/{id}`, { id: gistUrlId as string }).then(
            (res) => res.data as gistDetails,
          );
        }),
      )
      .subscribe({
        next: setGistDetails,
      });

    return () => gistUrlSubject.current.complete();
  }, []);

  useEffect(() => {
    if (!gistUrlSubject.current.isStopped) {
      console.log('next: ', importFields);
      gistUrlSubject.current.next(importFields);
    }
  }, [gistUrlSubject, importFields]);
}

function getGistId(gistUrl: string) {
  const url = new URL(gistUrl);
  return url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
}
