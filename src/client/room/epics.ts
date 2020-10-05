import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/night.css';

import { request as octokitRequest } from '@octokit/request';
import { GET_ROOM, getRoomResponse, gistDetails } from 'Client/queries';
import { RoomManager } from 'Client/services/roomManager';
import { unifiedUserSelector } from 'Client/session/types';
import { settingsActions, theme } from 'Client/settings/types';
import { epicDependencies, rootState } from 'Client/store';
import { octokitRequestWithAuth as getOctokitRequestWIthAuth } from 'Client/utils/utils';
import { getKeysForMap } from 'Client/ydocUtils';
import { request as gqlRequest } from 'graphql-request';
import { Action } from 'redux';
import { Epic, StateObservable } from 'redux-observable';
import { Observable } from 'rxjs/internal/Observable';
import { concat } from 'rxjs/internal/observable/concat';
import { merge } from 'rxjs/internal/observable/merge';
import { of } from 'rxjs/internal/observable/of';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { filter } from 'rxjs/internal/operators/filter';
import { ignoreElements } from 'rxjs/internal/operators/ignoreElements';
import { map } from 'rxjs/internal/operators/map';
import { startWith } from 'rxjs/internal/operators/startWith';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { GRAPHQL_URL } from 'Shared/environment';

import {
  addNewFile,
  destroyRoom,
  fileRenamingActions,
  gistSaved,
  initRoom,
  provisionTab,
  removeFile,
  renameFile,
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
    concatMap(
      ([
        {
          payload: { roomHashId },
        },
        rootState,
        // {
        //   session: { token: sessionToken, user: userDetails },
        //   room: { isCurrentUserCreatingRoom },
        //   settings: { theme: startingTheme },
        // },
      ]) => {
        const {
          room: { isCurrentUserCreatingRoom },
          settings: { theme: startingTheme },
        } = rootState;
        const theme$: Observable<theme> = action$.pipe(
          filter(settingsActions.toggleTheme.match),
          withLatestFrom(state$),
          map(([, state]) => state.settings.theme),
          startWith(startingTheme),
        );

        const manager = new RoomManager(roomHashId, theme$);

        manager.providerSynced.then(() => {
          console.log('state on sync: ', manager.yData.fileDetailsState.toJSON());
        });

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

        if (isCurrentUserCreatingRoom) {
          Promise.all([gistDataPromise, manager.providerSynced]).then(([gistData]) => {
            const gist = gistData;
            if (!gist) {
              throw 'handle no gist case please';
            }
            const { files } = gist;
            console.log('gist: ', gist);
            console.log('set filestate for ', Object.keys(files));
            Object.values(files).map((file) => {
              manager.addNewFile({ filename: file.filename, content: file.content });
            });
            const ids = Object.keys(files);
            if (ids.length > 0) {
              // manager.switchCurrentFile('1'); // switch to first file
            } else {
              manager.addNewFile();
            }
          });
        } else {
          manager.providerSynced.then(() => {
            console.log('sync promise resolved');
            const keys = getKeysForMap(manager.yData.fileDetailsState);
            console.log(keys);
          });
        }

        const roomAwarenessUpdate$ = manager.awareness$.pipe(map((s) => setRoomAwarenessState(s)));
        manager.connect();
        const unifiedUserDetails = unifiedUserSelector(rootState);
        if (unifiedUserDetails) {
          manager.setAwarenessUserDetails(unifiedUserDetails);
        }

        roomManager$$.next(manager);

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
    concatMap(([, roomManager]) => {
      const fileState = roomManager.addNewFile();
      return of(switchCurrentFile(fileState.tabId), fileRenamingActions.startRenameCurrentFile());
    }),
  );

export const provisionTabEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(provisionTab.match),
    withLatestFrom(roomManager$$),
    map(
      ([
        {
          payload: { tabId, containerElement },
        },
        roomManager,
      ]) => {
        roomManager.provisionTab(tabId, containerElement);
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
        console.log('state', roomManager.yData.fileDetailsState.toJSON());
      },
    ),
    ignoreElements(),
  );

export const removeFileEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(removeFile.match),
    withLatestFrom(roomManager$$),
    map(([{ payload: tabId }, roomManager]) => {
      console.log('removed file I guess');
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
      const allFileDetails = rootState.room.currentRoom?.fileDetailsStates;
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
