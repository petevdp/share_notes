import { rootState } from 'Client/store';
import { UPDATE_ROOM, updateRoomResponse, updateRoomVariables } from 'Client/utils/queries';
import { octokitRequestWithAuth } from 'Client/utils/utils';
import { Epic, StateObservable } from 'redux-observable';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { map } from 'rxjs/internal/operators/map';
import { GRAPHQL_URL } from 'Shared/environment';
import { gistDetails } from 'Shared/githubTypes';

import { roomUpdateActions } from './types';

// should only be loaded
export const DEBUG__forceOpenEditRoomDetailsModalEpic: Epic = (action$, state$: StateObservable<rootState>) =>
  state$.pipe(
    map((s) => {
      const roomDetails = s.room.currentRoom?.roomDetails;
      const gistDetails = s.room.currentRoom?.gistDetails;

      if (roomDetails && !roomDetails.gistName) {
        return roomUpdateActions.initialize({ roomDetails });
      }
      if (roomDetails && gistDetails) {
        return roomUpdateActions.initialize({ roomDetails, gistDetails });
      }
    }),
    filter(Boolean),
    first(),
  );

export const updateRoomEpic: Epic = (action$) =>
  action$.pipe(
    filter(roomUpdateActions.updateRoom.match),
    concatMap(async ({ payload: { gistUpdate, roomName, roomId, startingRoomDetails } }) => {
      const variables: updateRoomVariables = { input: { roomId, roomName, gistUpdate } };
      const { updateRoom: updatedRoom } = await import('graphql-request').then(({ request: gqlRequest }) =>
        gqlRequest<updateRoomResponse>(GRAPHQL_URL, UPDATE_ROOM, variables),
      );

      let gist: gistDetails | undefined;
      if (updatedRoom.gistName) {
        if (!startingRoomDetails.gistDetails || updatedRoom.gistName !== startingRoomDetails.gistDetails.id) {
          gist = await octokitRequestWithAuth()('GET /gists/:gist_id', { gist_id: updatedRoom.gistName }).then(
            (r) => r.data,
          );
        } else {
          gist = startingRoomDetails.gistDetails;
        }
      }

      return roomUpdateActions.roomUpdated({ gistDetails: gist, roomDetails: updatedRoom });
    }),
  );
