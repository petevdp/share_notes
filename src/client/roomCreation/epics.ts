import { Epic } from 'redux-observable';
import { setCurrentUserData } from 'Client/session/types';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';
import { roomCreationActions } from './types';

export const initializeRoomCreationEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(setCurrentUserData.match),
    map(({ payload: data }) => roomCreationActions.initialize(data.githubLogin)),
  );
