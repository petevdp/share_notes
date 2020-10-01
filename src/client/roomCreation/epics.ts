import {
  CREATE_ROOM,
  createRoomResponse,
  GET_CURRENT_USER_GISTS,
  GET_CURRENT_USER_GISTS_COUNT,
  GET_GIST,
  getCurrentUserGistsCountResponse,
  getCurrentUserGistsResponse,
  getCurrentUserGistsVariables,
  gistDetails,
  gistFileDetails,
} from 'Client/queries';
import { roomCreated } from 'Client/room/types';
import { setCurrentUserData } from 'Client/session/types';
import { rootState } from 'Client/store';
import { getGithubGraphqlClient, octokitRequestWithAuth } from 'Client/utils/utils';
import { request as gqlRequest } from 'graphql-request';
import { Epic, StateObservable } from 'redux-observable';
import { auditTime } from 'rxjs/internal/operators/auditTime';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { GRAPHQL_URL } from 'Shared/environment';

import { CreateRoomInput } from '../../../dist/src/shared/inputs/roomInputs';
import {
  computedRoomCreationSliceStateSelector,
  gistDetailsStore,
  GistUrlInputStatus,
  roomCreationActions,
} from './types';

export const initializeRoomCreationEpic: Epic = (action$) =>
  action$.pipe(
    filter(setCurrentUserData.match),
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
        if (!rootState.session.user?.githubLogin) {
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

        const roomCreationInput: CreateRoomInput = {
          ...baseInput,
          gistName: gistDetails.name,
        };

        const res = await gqlRequest<createRoomResponse>(GRAPHQL_URL, CREATE_ROOM, { data: roomCreationInput });
        return roomCreated(res);
      },
    ),
  );

function getCurrentUsersGists(): Promise<gistDetailsStore> {
  const client = getGithubGraphqlClient();
  return (
    client
      // get the total number of gists
      .request<getCurrentUserGistsCountResponse, any>(GET_CURRENT_USER_GISTS_COUNT)
      .then((countRes) =>
        // pass the count to a second request to get the right number of gists(might need to add an upper bound here/do multiple requests, but no indication of an upper bound in the docs)
        client.request<getCurrentUserGistsResponse, getCurrentUserGistsVariables>(GET_CURRENT_USER_GISTS, {
          gistCount: countRes.viewer.gists.totalCount,
        }),
      )
      .then((nodesRes) => nodesRes.viewer.gists.nodes)
      .then((gists) => {
        console.log('gists: ', gists);
        const gistsObj: gistDetailsStore = {};

        for (let gist of gists) {
          const files: { [filename: string]: gistFileDetails } = {};
          for (let file of gist.files) {
            files[file.name] = {
              filename: file.name,
              content: file.content,
            };
          }
          gistsObj[gist.name] = {
            ...gist,
            files,
          };
        }
        return gistsObj;
      })
  );
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

      return roomCreationActions.addOtherGistDetails(details);
    }),
  );
