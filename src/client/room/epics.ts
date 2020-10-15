import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/night.css';

import { request as octokitRequest } from '@octokit/request';
import { DELETE_ROOM, deleteRoomResponse, GET_ROOM, getRoomResponse } from 'Client/queries';
import { unifiedUser, unifiedUserSelector } from 'Client/session/types';
import { clientSettings, settingsActions, theme } from 'Client/settings/types';
import { epicDependencies, rootState } from 'Client/store';
import { octokitRequestWithAuth as getOctokitRequestWIthAuth } from 'Client/utils/utils';
import { request as gqlRequest } from 'graphql-request';
import _isEqual from 'lodash/isEqual';
import { Action } from 'redux';
import { Epic, StateObservable } from 'redux-observable';
import { Observable } from 'rxjs/internal/Observable';
import { concat } from 'rxjs/internal/observable/concat';
import { merge } from 'rxjs/internal/observable/merge';
import { of } from 'rxjs/internal/observable/of';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { ignoreElements } from 'rxjs/internal/operators/ignoreElements';
import { map } from 'rxjs/internal/operators/map';
import { startWith } from 'rxjs/internal/operators/startWith';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { GRAPHQL_URL } from 'Shared/environment';
import { gistDetails } from 'Shared/githubTypes';

import { deleteRoomInput } from '../../shared/types/roomTypes';
import {
  addNewFile,
  deleteRoom,
  destroyRoom,
  gistSaved,
  initRoom,
  provisionTab,
  removeFile,
  renameFile,
  roomDeleted,
  roomInitialized,
  saveBackToGist,
  setFileDetailsState,
  setRoomAwarenessState,
  setRoomData,
  setRoomGistDetails,
  switchCurrentFile,
  unprovisionTab,
} from './types';

export const initRoomEpic: Epic = (
  action$,
  state$: StateObservable<rootState>,
  { roomManager$$ }: epicDependencies,
): Observable<Action> =>
  action$.pipe(
    filter(initRoom.match),
    withLatestFrom(state$),
    concatMap(async (args) => ({
      ClientSideRoomManager: (await import('Client/services/clientSideRoomManager')).ClientSideRoomManager,
      action: args[0],
      state: args[1],
    })),
    concatMap(
      ({
        ClientSideRoomManager,
        action: {
          payload: { roomHashId },
        },
        state: rootState,
      }) => {
        const { settings: startingSettings } = rootState;
        const settings$: Observable<clientSettings> = state$.pipe(
          map((state) => state.settings),
          distinctUntilChanged(_isEqual),
          startWith(startingSettings),
        );
        // const {} = await import('Client/services/clientSideRoomManager');

        const manager = new ClientSideRoomManager(roomHashId, settings$);

        const fileDetailsStateUpdateAction$ = manager.fileDetails$.pipe(
          map((fileDetails) => setFileDetailsState(fileDetails)),
        );

        const roomDataPromise = gqlRequest<getRoomResponse>(GRAPHQL_URL, GET_ROOM, {
          data: { hashId: roomHashId },
        }).then((res) => res.room);

        const gistDataPromise = roomDataPromise.then((r) => {
          return getOctokitRequestWIthAuth()('GET /gists/{gist_id}', {
            gist_id: r.gistName,
          }).then((r) => r.data as gistDetails);
        });

        const roomAwarenessUpdate$ = manager.awareness$.pipe(map((s) => setRoomAwarenessState(s)));
        state$
          .pipe(
            map(unifiedUserSelector),
            filter((s) => !!s),
            distinctUntilChanged(_isEqual),
          )
          .subscribe((userDetails) => {
            manager.setAwarenessUserDetails(userDetails as unifiedUser);
          });

        roomManager$$.next(manager);
        manager.connect();
        return concat(
          of(roomInitialized(manager.provider.doc.clientID)),
          merge(
            roomDataPromise.then(setRoomData),
            gistDataPromise.then(setRoomGistDetails),
            fileDetailsStateUpdateAction$,
            roomAwarenessUpdate$,
          ),
        );
      },
    ),
  );

export const addNewFileEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(addNewFile.match),
    withLatestFrom(roomManager$$),
    map(([, roomManager]) => {
      const fileState = roomManager.addNewFile();
      return switchCurrentFile(fileState.tabId);
    }),
  );

export const provisionTabEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(provisionTab.match),
    withLatestFrom(roomManager$$),
    map(
      ([
        {
          payload: { tabId, containerElement, vimStatusBarRef },
        },
        roomManager,
      ]) => {
        roomManager.provisionTab(tabId, containerElement, vimStatusBarRef);
      },
    ),
    ignoreElements(),
  );

export const unprovisionTabEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(unprovisionTab.match),
    withLatestFrom(roomManager$$),
    map(
      ([
        {
          payload: { tabId },
        },
        roomManager,
      ]) => {
        roomManager.unprovisionTab(tabId);
      },
    ),
    ignoreElements(),
  );

export const renameFileEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(renameFile.match),
    withLatestFrom(roomManager$$),
    map(
      ([
        {
          payload: { tabId, newFilename },
        },
        roomManager,
      ]) => {
        const detailsMap = roomManager.yData.fileDetailsState.get(tabId.toString());
        if (!detailsMap) {
          throw 'bad key';
        }

        detailsMap.set('filename', newFilename);
      },
    ),
    ignoreElements(),
  );

export const removeFileEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(removeFile.match),
    withLatestFrom(roomManager$$),
    map(([{ payload: tabId }, roomManager]) => {
      roomManager.removeFile(tabId);
    }),
    ignoreElements(),
  );

export const saveBackToGistEpic: Epic = (
  action$,
  state$: StateObservable<rootState>,
  { roomManager$$ }: epicDependencies,
) =>
  action$.pipe(
    filter(saveBackToGist.match),
    withLatestFrom(state$, roomManager$$),
    concatMap(async ([, rootState, roomManager]) => {
      const gist = rootState.room?.currentRoom?.gistDetails;
      const sessionData = rootState.session;
      const { token } = sessionData;
      if (!gist) {
        throw 'no data from github retreived';
      }
      if (!token) {
        throw 'no token set';
      }

      const originalFileData = rootState.room.currentRoom?.gistDetails?.files;
      const allFileDetails = rootState.room.currentRoom?.roomSharedState.fileDetailsStates;
      const allFileContents = roomManager.yData.fileContents.toJSON() as { [tabId: string]: string };
      if (!allFileDetails || !allFileContents || !originalFileData) {
        return 'no file details and/or contents';
      }
      const filesForGithub: any = {};
      for (let key in allFileDetails) {
        const details = allFileDetails[key];
        const content = allFileContents[key];
        filesForGithub[details.filename] = {
          filename: details.filename,
          content,
        };
      }

      // explicitely set nulls to delete removed files from the gist
      Object.keys(originalFileData)
        .filter((k) => !Object.keys(filesForGithub).includes(k))
        .forEach((k) => {
          filesForGithub[k] = null;
        });

      const updatedDetails: gistDetails = await octokitRequest('PATCH /gists/{id}', {
        id: gist.id,
        files: filesForGithub,
        headers: {
          Authorization: `bearer ${sessionData.token}`,
        },
      }).then((res) => res.data);

      return gistSaved(updatedDetails);
    }),
  );

export const destroyRoomEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(destroyRoom.match),
    withLatestFrom(roomManager$$),
    map(([, roomManager]) => {
      roomManager.destroy();
    }),
    ignoreElements(),
  );

export const updateCurrentFileAwarenessEpic: Epic = (
  action$,
  state$: StateObservable<rootState>,
  { roomManager$$ }: epicDependencies,
) =>
  state$.pipe(
    map((s) => s.room.currentRoom?.currentTabId),
    distinctUntilChanged(),
    withLatestFrom(roomManager$$),
    map(([tabId, roomManager]) => {
      roomManager.provider.awareness.setLocalStateField('currentTab', tabId);
    }),
    ignoreElements(),
  );

export const deleteRoomEpic: Epic = (action$) =>
  action$.pipe(
    filter(deleteRoom.match),
    concatMap(async ({ payload: roomId }) => {
      const response = await gqlRequest<deleteRoomResponse, { data: deleteRoomInput }>(GRAPHQL_URL, DELETE_ROOM, {
        data: { id: roomId },
      });
      return roomDeleted(response.deleteRoom);
    }),
  );
