import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/night.css';

import { request as octokitRequest } from '@octokit/request';
import { anonymousLoginActions, roomMemberInputSelector } from 'Client/slices/session/types';
import { clientSettings, settingsActions } from 'Client/slices/settings/types';
import { rootState } from 'Client/store';
import { DELETE_ROOM, deleteRoomResponse, GET_ROOM, getRoomResponse } from 'Client/utils/queries';
import { octokitRequestWithAuth as getOctokitRequestWithAuth } from 'Client/utils/utils';
import { request as gqlRequest } from 'graphql-request';
import _isEqual from 'lodash/isEqual';
import { Action } from 'redux';
import { Epic, StateObservable } from 'redux-observable';
import { Observable } from 'rxjs/internal/Observable';
import { concat } from 'rxjs/internal/observable/concat';
import { from } from 'rxjs/internal/observable/from';
import { merge } from 'rxjs/internal/observable/merge';
import { of } from 'rxjs/internal/observable/of';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { map } from 'rxjs/internal/operators/map';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { startWith } from 'rxjs/internal/operators/startWith';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { GRAPHQL_URL } from 'Shared/environment';
import { gistDetails } from 'Shared/githubTypes';

import { RoomManager } from '../../../../dist/src/shared/roomManager';
import { roomMemberInput } from '../../../../dist/src/shared/types/roomMemberAwarenessTypes';
import { deleteRoomInput } from '../../../shared/types/roomTypes';
import { roomUpdateActions } from '../roomUpdating/types';
import {
  addNewFile,
  deleteRoom,
  destroyRoom,
  gistSaved,
  initRoom,
  leaveRoom,
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

export const initRoomEpic: Epic = (action$, state$: StateObservable<rootState>): Observable<Action> =>
  action$.pipe(
    filter(initRoom.match),
    withLatestFrom(state$),
    mergeMap(async (args) => ({
      ClientSideRoomManager: (await import('Client/services/clientSideRoomManager')).ClientSideRoomManager,
      action: args[0],
      state: args[1],
    })),
    mergeMap(
      ({
        ClientSideRoomManager,
        action: {
          payload: { roomHashId },
        },
        state: rootState,
      }) => {
        const { settings: startingSettings } = rootState;

        const settings$ = state$.pipe(
          map((state) => state.settings),
          distinctUntilChanged(_isEqual),
          startWith(startingSettings),
        );

        const togglePreviewMarkdown$: Observable<[string, boolean]> = action$.pipe(
          filter(settingsActions.setIndividualEditorSetting.match),
          filter(
            ({
              payload: {
                setting: { key },
                roomHashId: actionRoomHashId,
              },
            }) => roomHashId === actionRoomHashId && key === 'showMarkdownPreview',
          ),
          map(({ payload: { tabId, setting: { value } } }) => [tabId.toString(), value as boolean]),
        );

        togglePreviewMarkdown$.subscribe(([id, val]) => {
          console.log('toggle: ', id, val);
        });

        const manager = new ClientSideRoomManager(roomHashId, settings$, togglePreviewMarkdown$);

        const fileDetailsStateUpdateAction$ = manager.fileDetails$.pipe(
          map((fileDetails) => setFileDetailsState(fileDetails)),
        );

        const roomDataPromise = gqlRequest<getRoomResponse>(GRAPHQL_URL, GET_ROOM, {
          data: { hashId: roomHashId },
        }).then((res) => res.room);

        const gistDataPromise = roomDataPromise.then((r) => {
          if (!r) {
            throw 'room not found';
          }

          if (!r.gistName) {
            return;
          }

          return getOctokitRequestWithAuth()('GET /gists/{gist_id}', {
            gist_id: r.gistName,
          }).then((r) => r.data as gistDetails);
        });

        state$
          .pipe(
            map(roomMemberInputSelector),
            filter((s) => !!s),
            distinctUntilChanged(_isEqual),
            takeUntil(manager.roomDestroyed$$),
          )
          .subscribe((userDetails) => {
            manager.setAwarenessUserDetails(userDetails as roomMemberInput);
          });

        action$.pipe(filter(provisionTab.match), takeUntil(manager.roomDestroyed$$)).subscribe(({ payload }) => {
          manager.provisionTab(payload);
        });

        action$
          .pipe(filter(unprovisionTab.match), takeUntil(manager.roomDestroyed$$))
          .subscribe(({ payload: { tabId } }) => manager.unprovisionTab(tabId));

        action$
          .pipe(filter(renameFile.match), takeUntil(manager.roomDestroyed$$))
          .subscribe(({ payload: { tabId, newFilename } }) => {
            const detailsMap = manager.yData.fileDetailsState.get(tabId.toString());
            if (detailsMap) {
              detailsMap.set('filename', newFilename);
            }
          });

        // update awareness for current tab
        state$
          .pipe(
            map((s) => s.room.currentRoom?.currentTabId),
            distinctUntilChanged(),
            takeUntil(manager.roomDestroyed$$),
          )
          .subscribe((tabId) => {
            if (tabId) {
              manager.setCurrentTab(tabId);
            }
          });

        action$
          .pipe(filter(removeFile.match), takeUntil(manager.roomDestroyed$$))
          .subscribe(({ payload: tabId }) => manager.removeFile(tabId));

        action$
          .pipe(filter(anonymousLoginActions.logInAnonymously.match), takeUntil(manager.roomDestroyed$$))
          .subscribe(({ payload: input }) => {
            manager.setAwarenessUserDetails(input);
          });

        const leaveRoom$ = action$.pipe(
          filter(destroyRoom.match),
          first(),
          map(() => {
            manager.destroy();
            return leaveRoom();
          }),
        );

        const switchCurrentFileAfterAdded$ = action$.pipe(
          filter(addNewFile.match),
          takeUntil(manager.roomDestroyed$$),
          map(() => {
            const fileState = manager.addNewFile();
            return switchCurrentFile(fileState.tabId);
          }),
        );

        const roomAwarenessUpdate$ = manager.awareness$.pipe(map((s) => setRoomAwarenessState(s)));

        const gistSaved$ = action$.pipe(
          filter(saveBackToGist.match),
          withLatestFrom(state$),
          takeUntil(manager.roomDestroyed$$),
          concatMap(async ([, rootState]) => {
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
            const allFileContents = manager.getAllFileContents();
            if (!allFileDetails || !allFileContents || !originalFileData) {
              throw 'no file details or contents';
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

        action$
          .pipe(
            filter(roomUpdateActions.roomUpdated.match),
            filter(
              ({ payload: { roomDetails } }) =>
                roomDetails.hashId === roomHashId && manager.getRoomDetails().id === roomDetails.id,
            ),
            takeUntil(manager.roomDestroyed$$),
          )
          .subscribe(async ({ payload: { roomDetails, gistDetails } }) => {
            const existingDetails = manager.getRoomDetails();
            if (roomDetails.gistName && existingDetails.gistName !== roomDetails.gistName) {
              manager.populate({ ...roomDetails, id: roomDetails.id }, gistDetails);
            } else {
              manager.setRoomDetails(roomDetails);
            }
          });

        manager.connect();
        return concat(
          of(roomInitialized(manager.provider.doc.clientID)),
          merge(
            roomDataPromise.then(setRoomData),
            from(gistDataPromise).pipe(filter(Boolean), map(setRoomGistDetails)),
            fileDetailsStateUpdateAction$,
            roomAwarenessUpdate$,
            switchCurrentFileAfterAdded$,
            // reached end of merge's type signature, have to nest merges now
            merge(leaveRoom$, gistSaved$),
          ),
        );
      },
    ),
  );

export const deleteRoomEpic: Epic = (action$) =>
  action$.pipe(
    filter(deleteRoom.match),
    concatMap(async ({ payload: roomId }) => {
      const response = await gqlRequest<deleteRoomResponse, { data: deleteRoomInput }>(GRAPHQL_URL, DELETE_ROOM, {
        data: { id: roomId },
      });
      return roomDeleted(roomId);
    }),
  );
