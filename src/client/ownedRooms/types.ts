import { createAction } from '@reduxjs/toolkit';
import { roomWithVisited } from 'Client/queries';

import { clientSideRoom } from '../../../dist/src/shared/types/roomTypes';
import { roomVisit } from '../../../dist/src/shared/types/roomVisitTypes';

export type ownedRoomsSliceState = { allRooms: roomWithVisited[] } | null;

export const ownedRoomsActions = {
  setOwnedRooms: createAction('setOwnedRooms', (allRooms: roomWithVisited[]) => ({
    payload: { allRooms },
  })),
  fetchOwnedRooms: createAction('fetchOwnedRooms'),
  resetOwnedRooms: createAction('resetOwnedRooms'),
};
