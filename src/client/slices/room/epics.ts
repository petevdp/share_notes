import { request as octokitRequest } from '@octokit/request';
import { GistsGetResponseData } from '@octokit/types/dist-types';
import { DURATION } from 'baseui/snackbar';
import { anonymousLoginActions, roomMemberInputSelector } from 'Client/slices/session/types';
import { rootState } from 'Client/store';
import { enqueueSnackbar } from 'Client/utils/basewebUtils';
import {
  DELETE_ROOM,
  deleteRoomResponse,
  GET_ROOM,
  getRoomResponse,
  UPDATE_ROOM,
  updateRoomResponse,
  updateRoomVariables,
} from 'Client/utils/queries';
import { octokitRequestWithAuth as getOctokitRequestWithAuth, octokitRequestWithAuth } from 'Client/utils/utils';
import { response } from 'express';
import _isEqual from 'lodash/isEqual';
import { Action, AnyAction } from 'redux';
import { Epic, StateObservable } from 'redux-observable';
import { EMPTY } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { concat } from 'rxjs/internal/observable/concat';
import { from } from 'rxjs/internal/observable/from';
import { fromPromise } from 'rxjs/internal/observable/fromPromise';
import { merge } from 'rxjs/internal/observable/merge';
import { of } from 'rxjs/internal/observable/of';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { ignoreElements } from 'rxjs/internal/operators/ignoreElements';
import { map } from 'rxjs/internal/operators/map';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { startWith } from 'rxjs/internal/operators/startWith';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { takeWhile } from 'rxjs/internal/operators/takeWhile';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { GRAPHQL_URL } from 'Shared/environment';
import { gistDetails } from 'Shared/githubTypes';
import { roomMemberInput } from 'Shared/types/roomMemberAwarenessTypes';
import { clientSideRoom, deleteRoomInput, GistUpdateType } from 'Shared/types/roomTypes';

import { roomUpdateActions } from '../roomUpdating/types';
import {
  addNewFile,
  copyToClipboard,
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
          payload: { roomHashId, enqueueSnackbar },
        },
        state: rootState,
      }) => {
        const { settings: startingSettings } = rootState;

        const settings$ = state$.pipe(
          map((state) => state.settings),
          distinctUntilChanged(_isEqual),
          startWith(startingSettings),
        );

        const gistDetails$ = state$.pipe(
          takeWhile((state) => !!state.room.currentRoom && state.room.currentRoom.hashId === roomHashId),
          map((state) => state.room.currentRoom?.gistDetails),
        );

        const manager = new ClientSideRoomManager(roomHashId, settings$, gistDetails$);

        const fileDetailsStateUpdateAction$ = manager.fileDetails$.pipe(
          map((fileDetails) => setFileDetailsState(fileDetails)),
        );

        const roomDataPromise = import('graphql-request').then(({ request: gqlRequest }) =>
          gqlRequest<getRoomResponse>(GRAPHQL_URL, GET_ROOM, {
            data: { hashId: roomHashId },
          }).then((res) => res.room),
        );

        const attemptGetGistDataPromise = roomDataPromise.then((roomData) => {
          if (!roomData) {
            console.warn('room not found');
            return;
          }

          if (!roomData.gistName) {
            return;
          }

          return getOctokitRequestWithAuth()('GET /gists/{gist_id}', {
            gist_id: roomData.gistName,
          }).catch(() => {
            return promptGistNotFoundAndReturnDeletionAction(roomData, enqueueSnackbar);
          });
        });

        const updateFromDeletingGistRoomWhenNotFound$ = from(
          attemptGetGistDataPromise.then((res) => !res?.data && (res as AnyAction | undefined)),
        ).pipe(
          filter((action) => !!action),
          map((action) => action as AnyAction),
        );

        const gistDataPromise = attemptGetGistDataPromise.then(
          (res) => res?.data && (res.data as gistDetails | undefined),
        );

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
            const details = manager.yData.fileDetails.get(tabId.toString());
            if (details) {
              manager.yData.fileDetails.set(tabId.toString(), { ...details, filename: newFilename });
            } else {
              console.warn(`tried to rename file at ${tabId}, but no such tab exists`);
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
          map(({ payload: fileInput }) => {
            const fileState = manager.addNewFile(fileInput);
            return switchCurrentFile(fileState.tabId);
          }),
        );

        const roomAwarenessUpdate$ = manager.awareness$.pipe(map((s) => setRoomAwarenessState(s)));

        const gistSaved$ = action$.pipe(
          filter(saveBackToGist.match),
          withLatestFrom(state$),
          takeUntil(manager.roomDestroyed$$),
          concatMap(
            ([
              {
                payload: { enqueueSnackbar },
              },
              rootState,
            ]) => {
              const gist = rootState.room?.currentRoom?.gistDetails;
              const sessionData = rootState.session;
              const { token } = sessionData;
              if (!gist) {
                console.warn('no gist set when attempting to save gist');
                return EMPTY;
              }
              const roomDetails = rootState.room.currentRoom?.roomDetails;
              if (!roomDetails) {
                console.warn('no room data set');
                return EMPTY;
              }
              if (!token) {
                console.warn('no session token set');
                return EMPTY;
              }

              const originalFileData = rootState.room.currentRoom?.gistDetails?.files;
              const allFileDetails = rootState.room.currentRoom?.roomSharedState.fileDetailsStates;
              const allFileContents = manager.getAllFileContents();
              if (!allFileDetails || !allFileContents || !originalFileData) {
                throw 'no file details or contents';
              }
              const filesForGithub: { [filename: string]: { filename: string; content: string } | null } = {};
              for (let key in allFileDetails) {
                const details = allFileDetails[key];
                const content = allFileContents[key];
                filesForGithub[details.filename] = {
                  filename: details.filename,
                  content: content || details.filename,
                };
              }

              // explicitely set nulls to delete removed files from the gist
              Object.keys(originalFileData)
                .filter((k) => !Object.keys(filesForGithub).includes(k))
                .forEach((k) => {
                  filesForGithub[k] = null;
                });

              const saveResultPromise = octokitRequest('PATCH /gists/{id}', {
                id: gist.id,
                files: filesForGithub,
                headers: {
                  Authorization: `bearer ${sessionData.token}`,
                },
              })
                .then((res) => {
                  enqueueSnackbar({ message: 'Successfully saved files to gist.' });
                  return gistSaved(res.data);
                })
                .catch((err) => {
                  console.warn(err);
                  return promptGistNotFoundAndReturnDeletionAction(roomDetails, enqueueSnackbar);
                });

              return from(saveResultPromise).pipe(
                filter(Boolean),
                map((res) => res as AnyAction),
              );
            },
          ),
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
              manager.populate({ ...roomDetails, id: roomDetails.id }, gistDetails?.files);
            } else {
              manager.populate({ ...roomDetails, id: roomDetails.id });
            }
          });

        const initializeRoomUpdate$ = action$.pipe(
          filter(roomUpdateActions.initializeForCurrentRoom.match),
          takeUntil(manager.roomDestroyed$$),
          withLatestFrom(state$),
          filter(([, state]) => !!state.room.currentRoom?.roomDetails),
          map(([, state]) =>
            roomUpdateActions.initialize({
              roomDetails: state.room.currentRoom?.roomDetails as clientSideRoom,
              gistDetails: state.room.currentRoom?.gistDetails,
            }),
          ),
        );

        const roomUpdated$ = action$.pipe(
          filter(roomUpdateActions.updateRoom.match),
          takeUntil(manager.roomDestroyed$$),
          concatMap(async ({ payload: { gistUpdate, roomName, roomId } }) => {
            const response = await import('graphql-request').then(({ request: gqlRequest }) =>
              gqlRequest<updateRoomResponse, updateRoomVariables>(GRAPHQL_URL, UPDATE_ROOM, {
                input: { roomHashId: roomHashId, roomName, gistUpdate: { ...gistUpdate } },
              }),
            );

            const gist =
              (response.updateRoom.gistName &&
                (await octokitRequestWithAuth()('GET /gists/:gist_id', {
                  gist_id: response.updateRoom.gistName,
                }).then((r) => r.data))) ||
              undefined;

            return roomUpdateActions.roomUpdated({ gistDetails: gist, roomDetails: response.updateRoom });
          }),
        );

        manager.connect();
        return concat(
          of(roomInitialized(manager.provider.doc.clientID)),
          merge(
            roomDataPromise.then(setRoomData),
            from(gistDataPromise).pipe(map(setRoomGistDetails)),
            fileDetailsStateUpdateAction$,
            roomAwarenessUpdate$,
            switchCurrentFileAfterAdded$,
            // reached end of merge's type signature, have to nest merges now
            merge(leaveRoom$, gistSaved$, updateFromDeletingGistRoomWhenNotFound$, initializeRoomUpdate$, roomUpdated$),
          ),
        );
      },
    ),
  );

export const deleteRoomEpic: Epic = (action$) =>
  action$.pipe(
    filter(deleteRoom.match),
    concatMap(async ({ payload: roomId }) => {
      await import('graphql-request').then(({ request: gqlRequest }) =>
        gqlRequest<deleteRoomResponse, { data: deleteRoomInput }>(GRAPHQL_URL, DELETE_ROOM, {
          data: { id: roomId },
        }),
      );
      return roomDeleted(roomId);
    }),
  );

export const copyToClipboardEpic: Epic = (action$) =>
  action$.pipe(
    filter(copyToClipboard.match),
    map(({ payload: { text, enqueueSnackbar } }) => {
      //create our hidden div element
      let hiddenCopy = document.createElement('div');
      //set the innerHTML of the div
      hiddenCopy.innerHTML = text;
      //set the position to be absolute and off the screen
      hiddenCopy.style.position = 'absolute';
      hiddenCopy.style.left = '-9999px';

      //check and see if the user had a text selection range
      let currentRange: null | Range;
      if ((document.getSelection() as Selection).rangeCount > 0) {
        //the user has a text selection range, store it
        currentRange = (document.getSelection() as Selection).getRangeAt(0);
        //remove the current selection
        (window.getSelection() as Selection).removeRange(currentRange);
      } else {
        //they didn't have anything selected
        currentRange = null;
      }

      //append the div to the body
      document.body.appendChild(hiddenCopy);
      //create a selection range
      let CopyRange = document.createRange();
      //set the copy range to be the hidden div
      CopyRange.selectNode(hiddenCopy);
      //add the copy range
      (window.getSelection() as Selection).addRange(CopyRange);

      //since not all browsers support this, use a try block
      try {
        //copy the text
        document.execCommand('copy');
        enqueueSnackbar({ message: 'Room url copied to clipboard' });
      } catch (err) {
        window.alert(
          "Your Browser Doesn't support copying from clipboard. Please copy the url directly from the search bar.",
        );
      }
      //remove the selection range (Chrome throws a warning if we don't.)
      (window.getSelection() as Selection).removeRange(CopyRange);
      //remove the hidden div
      document.body.removeChild(hiddenCopy);

      //return the old selection range
      if (currentRange) {
        (window.getSelection() as Selection).addRange(currentRange);
      }
    }),
    ignoreElements(),
  );

function promptGistNotFoundAndReturnDeletionAction(room: clientSideRoom, enqueueSnackbar: enqueueSnackbar) {
  return new Promise<AnyAction>((resolve) => {
    enqueueSnackbar(
      {
        message:
          "Gist for this room was not found, or something else went wrong when accessing github. The room was most likely deleted. You'll have to add another one manually.",
        actionMessage: 'ok',
        actionOnClick: () => {
          resolve(roomUpdateActions.updateRoom(room.name, room.id.toString(), { type: GistUpdateType.Delete }));
        },
      },
      DURATION.infinite,
    );
  });
}
