import { GET_RECENT_ROOMS_FOR_USER, getRecentRoomsForUserInput, getRecentRoomsForUserResponse } from 'Client/queries';
import { request as gqlRequest } from 'graphql-request';
import { Epic } from 'redux-observable';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';

import { GRAPHQL_URL } from '../../../dist/src/shared/environment';
import { recentRoomsActions } from './types';

export const fetchRecentRoomsEpic: Epic = (action$) =>
  action$.pipe(
    filter(recentRoomsActions.fetchRecentRooms.match),
    concatMap(async ({ payload: { userId, first } }) => {
      const res = await gqlRequest<getRecentRoomsForUserResponse, getRecentRoomsForUserInput>(
        GRAPHQL_URL,
        GET_RECENT_ROOMS_FOR_USER,
        { userId, first },
      );

      return recentRoomsActions.setRecentRooms(res.roomsByVisits);
    }),
  );
