import { GET_OWNED_ROOMS_FOR_CURRENT_USER, getOwnedRoomsForCurrentUserResponse } from 'Client/utils/queries';
import { request as gqlRequest } from 'graphql-request';
import { Epic } from 'redux-observable';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';

import { GRAPHQL_URL } from '../../../../dist/src/shared/environment';
import { ownedRoomsActions } from './types';

export const fetchOwnedRoomsEpic: Epic = (action$) =>
  action$.pipe(
    filter(ownedRoomsActions.fetchOwnedRooms.match),
    concatMap(async () => {
      const res = await gqlRequest<getOwnedRoomsForCurrentUserResponse>(GRAPHQL_URL, GET_OWNED_ROOMS_FOR_CURRENT_USER);
      return ownedRoomsActions.setOwnedRooms(res.currentUser.ownedRooms);
    }),
  );
