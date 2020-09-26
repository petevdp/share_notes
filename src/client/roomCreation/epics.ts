import { setCurrentUserData } from 'Client/session/types';
import { Epic } from 'redux-observable';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';

import { roomCreationActions } from './types';

export const initializeRoomCreationEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(setCurrentUserData.match),
    map(({ payload: data }) => roomCreationActions.initialize(data.githubLogin)),
  );
