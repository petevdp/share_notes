import { rootState } from 'Client/store';
import { Epic, StateObservable } from 'redux-observable';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { ignoreElements } from 'rxjs/internal/operators/ignoreElements';
import { map } from 'rxjs/internal/operators/map';

import { roomUpdateActions } from './types';

// should only be loaded
export const DEBUG__forceOpenEditRoomDetailsModalEpic: Epic = (action$, state$: StateObservable<rootState>) =>
  state$.pipe(
    map((s) => {
      const roomDetails = s.room.currentRoom?.roomDetails;
      const gistDetails = s.room.currentRoom?.gistDetails;

      if (roomDetails && !roomDetails.gistName) {
        return roomUpdateActions.initialize(roomDetails);
      }
      if (roomDetails && gistDetails) {
        return roomUpdateActions.initialize(roomDetails, gistDetails);
      }
    }),
    filter(Boolean),
    first(),
  );
