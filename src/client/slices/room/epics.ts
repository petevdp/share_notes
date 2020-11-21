import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/night.css';

import { request as octokitRequest } from '@octokit/request';
import { anonymousLoginActions, roomMemberInputSelector } from 'Client/slices/session/types';
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
import { deleteRoomInput } from 'Shared/types/roomTypes';

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

        const gistDetails$ = state$.pipe(
          takeWhile((state) => !!state.room.currentRoom && state.room.currentRoom.hashId === roomHashId),
          map((state) => state.room.currentRoom?.gistDetails),
        );

        const manager = new ClientSideRoomManager(roomHashId, settings$, gistDetails$);

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
              manager.populate({ ...roomDetails, id: roomDetails.id }, gistDetails?.files);
            } else {
              manager.populate({ ...roomDetails, id: roomDetails.id });
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
