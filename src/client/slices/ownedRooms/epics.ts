import { GET_OWNED_ROOMS_FOR_CURRENT_USER, getOwnedRoomsForCurrentUserResponse } from 'Client/utils/queries';
import { request as gqlRequest } from 'graphql-request';
import { Epic } from 'redux-observable';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { GRAPHQL_URL } from 'Shared/environment';

import { ownedRoomsActions } from './types';

export const fetchOwnedRoomsEpic: Epic = (action$) =>
  action$.pipe(
    filter(ownedRoomsActions.fetchOwnedRooms.match),
    mergeMap(async () => {
      const res = await gqlRequest<getOwnedRoomsForCurrentUserResponse>(GRAPHQL_URL, GET_OWNED_ROOMS_FOR_CURRENT_USER);
      const sortedRooms = res.currentUser.ownedRooms.sort(
        (a, b) => Number(new Date(b.visits[0].visitTime)) - Number(new Date(a.visits[0].visitTime)),
      );
      return ownedRoomsActions.setOwnedRooms(sortedRooms);
    }),
  );
