import { roomCreated } from 'Client/slices/room/types';
import { rootState } from 'Client/store';
import { CREATE_ROOM, createRoomResponse } from 'Client/utils/queries';
import { octokitRequestWithAuth } from 'Client/utils/utils';
import { request as gqlRequest } from 'graphql-request';
import __isEmpty from 'lodash/isEmpty';
import __isEqual from 'lodash/isEqual';
import { Epic, StateObservable } from 'redux-observable';
import { auditTime } from 'rxjs/internal/operators/auditTime';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { GRAPHQL_URL } from 'Shared/environment';
import { gistDetails } from 'Shared/githubTypes';
import { createRoomInput } from 'Shared/types/roomTypes';

import { setCurrentUserDetails } from '../currentUserDetails/types';
import {
  computedRoomCreationSliceStateSelector,
  gistDetailsStore,
  GistUrlInputStatus,
  roomCreationActions,
} from './types';

export const initializeRoomCreationEpic: Epic = (action$) =>
  action$.pipe(
    filter(setCurrentUserDetails.match),
    map(({ payload: data }) => roomCreationActions.initialize(data.githubLogin)),
  );

export const createRoomEpic: Epic = (action$, state$: StateObservable<rootState>) =>
  action$.pipe(
    filter(roomCreationActions.createRoom.match),
    withLatestFrom(state$),
    concatMap(
      async ([
        {
          payload: { input: baseInput },
        },
        rootState,
      ]) => {
        if (!rootState.session.token) {
          throw 'not logged in';
        }
        const roomCreationState = computedRoomCreationSliceStateSelector(rootState);
        let gistDetails: gistDetails;
        if (roomCreationState.urlInputStatus === GistUrlInputStatus.UnownedGist) {
          const githubRequest = octokitRequestWithAuth();
          gistDetails = await githubRequest('POST /gists/{id}/forks', {
            id: baseInput.gistName,
          }).then((res) => res.data);
        } else if (roomCreationState.urlInputStatus === GistUrlInputStatus.OwnedGist) {
          gistDetails = roomCreationState.detailsForUrlAtGist as gistDetails;
        } else {
          throw 'invalid status for room creation';
        }

        const roomCreationInput: createRoomInput = {
          ...baseInput,
          gistName: gistDetails.id,
        };

        const res = await gqlRequest<createRoomResponse>(GRAPHQL_URL, CREATE_ROOM, { data: roomCreationInput });
        return roomCreated(res);
      },
    ),
  );

function getCurrentUsersGists(): Promise<gistDetailsStore> {
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

export const openRoomCreationEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(roomCreationActions.roomCreationOpened.match),
    concatMap(async () => {
      // other initialization takss
      const ownedGists = await getCurrentUsersGists();
      return roomCreationActions.setOwnedGists(ownedGists);
    }),
  );

export const getGistPreviewEpic: Epic = (action$, state$: StateObservable<rootState>) =>
  action$.pipe(
    filter(roomCreationActions.setGistUrl.match),
    auditTime(2000),
    withLatestFrom(state$.pipe(map(computedRoomCreationSliceStateSelector))),
    concatMap(async ([, { urlInputStatus, gistUrlId }]) => {
      if (urlInputStatus !== GistUrlInputStatus.NeedToLoadDetails) {
        return;
      }
      if (!gistUrlId) {
        throw 'need to load gist details, but no gist url id';
      }
      const details = await octokitRequestWithAuth()(`GET /gists/{id}`, { id: gistUrlId }).then(
        (res) => res.data as gistDetails,
      );

      return roomCreationActions.setGistDetails(details);
    }),
  );
