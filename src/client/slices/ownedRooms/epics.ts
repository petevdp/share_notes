import { GET_OWNED_ROOMS_FOR_CURRENT_USER, getOwnedRoomsForCurrentUserResponse } from 'Client/utils/queries';
import { Epic } from 'redux-observable';
import { filter } from 'rxjs/internal/operators/filter';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { GRAPHQL_URL } from 'Shared/environment';

import { ownedRoomsActions } from './types';

export const fetchOwnedRoomsEpic: Epic = (action$) =>
  action$.pipe(
    filter(ownedRoomsActions.fetchOwnedRooms.match),
    mergeMap(async () => {
      const res = await import('graphql-request').then(({ request: gqlRequest }) =>
        gqlRequest<getOwnedRoomsForCurrentUserResponse>(GRAPHQL_URL, GET_OWNED_ROOMS_FOR_CURRENT_USER),
      );
      const sortedRooms = res.currentUser.ownedRooms.sort((a, b) => {
        if (b.visits[0] && a.visits[0]) {
          return Number(new Date(b.visits[0].visitTime)) - Number(new Date(a.visits[0].visitTime));
        } else if (b.visits[0] && !a.visits[0]) {
          return -1;
        } else if (a.visits[0]) {
          return 1;
        } else {
          return 0;
        }
      });
      return ownedRoomsActions.setOwnedRooms(sortedRooms);
    }),
  );
