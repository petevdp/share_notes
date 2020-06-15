import { Epic } from 'redux-observable';
import { Observable } from 'rxjs';
import { rootState } from '../store';
import { filter, map, withLatestFrom, concatMap } from 'rxjs/operators';
import { roomData } from './state';
import { connectionEstablished } from '../convergenceConnection/slice';
import { createRoom, roomCreated, subscribeToUserOwnedRooms, createEditor, editorCreated } from './slice';

export const createRoomEpic: Epic = (action$, state$: Observable<rootState>) => {
  const domain$ = action$.pipe(
    filter(connectionEstablished.match),
    map(({ payload }) => payload),
  );

  return action$.pipe(
    filter(createRoom.match),
    withLatestFrom(domain$),
    concatMap(async ([{ payload }, domain]) => {
      if (!domain) {
        throw "domain isn't connected";
      }
      const { name } = payload;
      const data: roomData = {
        name,
        ownerId: domain.session().user().userId.username,
        participantIds: [],
        editorIds: [],
      };

      console.log('creating room');
      const id = await domain.models().create({
        collection: 'rooms',
        data,
      });

      console.log('created room + ' + id);
      return roomCreated(id);
    }),
  );
};

export const userOwnedRoomsEpic: Epic = (action$, state$) => {
  const domain$ = action$.pipe(
    filter(connectionEstablished.match),
    map(({ payload }) => payload),
  );

  return action$.pipe(
    filter(subscribeToUserOwnedRooms.match),
    withLatestFrom(domain$),
    concatMap(async ([{ payload: userId }, domain]) => {
      if (!domain) {
        throw "domain isn't connected";
      }

      const model = await domain.models().open(userId);

      model.root().events;
    }),
  );
};

export const createEditorEpic: Epic = (action$, state$: Observable<rootState>) => {
  const domain$ = action$.pipe(
    filter(connectionEstablished.match),
    map(({ payload }) => payload),
  );

  return action$.pipe(
    filter(createEditor.match),
    withLatestFrom(domain$),
    concatMap(async ([{ payload: roomId }, domain]) => {
      if (!domain) {
        throw "domain isn't connected when creating editor";
      }
      console.log('creating editor');
      const editorId = await domain.models().create({ collection: 'editors' });
      return editorCreated(editorId);
    }),
  );
};
