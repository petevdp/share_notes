import { createAction } from '@reduxjs/toolkit';

import { clientSideRoom } from '../../../dist/src/shared/types/roomTypes';

export type recentRoomsSliceState = clientSideRoom[] | undefined;

export const recentRoomsActions = {
  setRecentRooms: createAction('setRecentRooms', (rooms: clientSideRoom[]) => ({ payload: rooms })),
  fetchRecentRooms: createAction('fetchRecentRooms', (userId: string, first: number) => ({
    payload: { userId, first },
  })),
};
