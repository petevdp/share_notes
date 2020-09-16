import { Epic, StateObservable, ActionsObservable } from 'redux-observable';
import { filter, concatMap, map, withLatestFrom, ignoreElements, first, skipUntil } from 'rxjs/operators';
import {
  initRoom,
  switchCurrentFile,
  addNewFile,
  saveBackToGist,
  gistSaved,
  destroyRoom,
  setCurrentFile,
  createRoom,
  roomCreated,
  gistDetailKeys,
  roomInitialized,
  setRoomData,
  setRoomGistDetails,
  removeFile,
  allFileDetailsStates,
  setGistFileDetails,
  fileDetailsState,
  switchToRoom,
} from './types';
import { Action } from 'redux';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { editor as monacoEditor } from 'monaco-editor';
import { YJS_WEBSOCKET_URL_WS, YJS_ROOM, GRAPHQL_URL, API_URL, GITHUB_GRAPHQL_API_URL } from 'Shared/environment';
import { getKeysForMap, getEntriesForMap, awarenessListener } from 'Client/ydocUtils';
import { Subject, of, concat, Observable, merge, from } from 'rxjs';
import { request as gqlRequest, GraphQLClient } from 'graphql-request';
import { request as octokitRequest } from '@octokit/request';
import {
  getRoomResponse,
  GET_ROOM,
  getGistResponse,
  CREATE_ROOM,
  createRoomResponse,
  GET_GIST,
  gistDetails,
} from 'Client/queries';
import { rootState, epicDependencies } from 'Client/store';
import { getGithubGraphqlClient, octokitRequestWithAuth as getOctokitRequestWIthAuth } from 'Client/utils';

export const createRoomEpic: Epic = (action$) =>
  action$.pipe(
    filter(createRoom.match),
    concatMap(async ({ payload: input }) => {
      const res = await gqlRequest<createRoomResponse>(GRAPHQL_URL, CREATE_ROOM, { data: input });
      console.log('res: ', res);
      return roomCreated(res);
    }),
  );

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
          payload: { roomHashId, editorContainerRef },
        },
      ]) => {
        // if (!sessionToken) {
        //   throw 'session token not set when initing room, need to handle this case still';
        // }
        if (!editorContainerRef.current) {
          throw 'editor container element not loaded';
        }
        const manager = new RoomManager(editorContainerRef.current, roomHashId);

        const syncPromise = new Promise((resolve, reject) => {
          const listener = () => {
            resolve(true);
          };
          manager.provider.on('sync', listener);
          manager.roomDestroyed$$.subscribe(() => {
            reject('room destroyed before sync');
          });
        });

        const fileDetailsState$ = new Observable<allFileDetailsStates>((s) => {
          const fileDetailsListener = () => {
            console.log('emitting file details');
            s.next(manager.yData.fileDetailsState.toJSON() as allFileDetailsStates);
          };

          // initial state on sync
          syncPromise.then(() => s.next(manager.yData.fileDetailsState.toJSON() as allFileDetailsStates));

          manager.yData.fileDetailsState.observe(fileDetailsListener);
          manager.roomDestroyed$$.subscribe(() => {
            manager.yData.fileDetailsState.unobserve(fileDetailsListener);
            s.complete();
          });
        });

        const fileDetailsStateUpdateAction$ = fileDetailsState$.pipe(
          // wait till the room data state is set before trying to emit action
          map((fileDetails) => setGistFileDetails(fileDetails)),
        );

        const roomDataPromise = gqlRequest<getRoomResponse>(GRAPHQL_URL, GET_ROOM, {
          data: { hashId: roomHashId },
        }).then((res) => res.room);

        const gistDataPromise = roomDataPromise.then((r) => {
          return getOctokitRequestWIthAuth()('GET /gists/{gist_id}', {
            gist_id: r.gistName,
          }).then((r) => r.data as gistDetails);
        });

        const isCreatingRoom = false;
        if (isCreatingRoom) {
          Promise.all([gistDataPromise, syncPromise]).then(([gistData]) => {
            const gist = gistData;
            if (!gist) {
              throw 'handle no gist case please';
            }
            const { files } = gist;
            console.log('set filestate for ', Object.keys(files));
            Object.values(files).map((file, index) => {
              manager.addNewFile({ filename: file.filename, text: file.text });
            });
            if (Object.keys(files).length > 0) {
              manager.switchCurrentFile(0); // switch to first file
            } else {
              manager.addNewFile();
            }
          });
        } else {
          syncPromise.then(() => {
            console.log('sync promise resolved');
            const keys = getKeysForMap(manager.yData.fileDetailsState);
            console.log(keys);
            if (keys.length > 0) {
              manager.switchCurrentFile(0);
            } else {
              manager.addNewFile();
            }
          });
        }

        const awarenessListener: awarenessListener = (s, d) => {
          console.log('changed indexes: ', s);
          console.log('origin: ', d);
        };

        manager.provider.awareness.on('change', awarenessListener);

        manager.provider.connect();
        roomManager$$.next(manager);
        return concat(
          of(switchToRoom(roomHashId)),
          merge(roomDataPromise.then(setRoomData), gistDataPromise.then(setRoomGistDetails)),
          of(roomInitialized()),
          fileDetailsStateUpdateAction$,
        );
      },
    ),
  );

export const switchCurrentFileEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(switchCurrentFile.match),
    withLatestFrom(roomManager$$),
    map(([{ payload: filename }, roomManager]) => {
      roomManager.switchCurrentFile(filename);
      return setCurrentFile(filename);
    }),
  );

export const addNewFileEpic: Epic = (action$, state$, { roomManager$$ }: epicDependencies) =>
  action$.pipe(
    filter(addNewFile.match),
    withLatestFrom(roomManager$$),
    map(([, roomManager]) => {
      const fileState = roomManager.addNewFile();
      return setCurrentFile(fileState.tabId);
    }),
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

      const entriesForGithub = getEntriesForMap(roomManager.yData.fileDetailsState).reduce((obj, [filename, ytext]) => {
        return {
          ...obj,
          filename: {
            filename,
            content: ytext.toString(),
          },
        };
      }, {});

      await octokitRequest('PATCH /gists/{id}', {
        id: gist.id,
        files: entriesForGithub,
        headers: {
          Authorization: `bearer ${sessionData.token}`,
        },
      });

      return gistSaved();
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

export class RoomManager {
  private binding?: any;
  roomDestroyed$$: Subject<boolean>;
  yData: {
    // storing file text and details separately as a performance optimization
    fileDetailsState: Y.Map<Y.Map<any>>;
    fileContents: Y.Map<Y.Text>;
    // for now just contains an object with details, there's probably a better way to do this though
    details: Y.Map<gistDetails>;
  };
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  editor: monacoEditor.IStandaloneCodeEditor;
  constructor(editorContainerElement: HTMLElement, roomHashId: string) {
    this.roomDestroyed$$ = new Subject<boolean>();
    this.ydoc = new Y.Doc();
    this.yData = {
      fileDetailsState: this.ydoc.getMap(`room/${roomHashId}/fileDetails`),
      fileContents: this.ydoc.getMap(`room/${roomHashId}/fileContents`),
      details: this.ydoc.getMap(`room/${roomHashId}/details`),
    };

    this.provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, YJS_ROOM, this.ydoc);
    this.editor = monacoEditor.create(editorContainerElement, { readOnly: true, minimap: { enabled: false } });
  }

  switchCurrentFile(tabId: string | number) {
    const fileState = this.yData.fileDetailsState.get(tabId.toString());
    const text = this.yData.fileContents.get(tabId.toString());
    if (!fileState) {
      throw `tab with id ${tabId} doesn't exist`;
    }
    this.binding?.destroy();
    this.binding = new MonacoBinding(text, this.editor.getModel(), new Set([this.editor]), this.provider.awareness);
    if (this.editor.getOption(monacoEditor.EditorOption.readOnly)) {
      this.editor.updateOptions({ readOnly: false });
    }

    return fileState.toJSON() as fileDetailsState;
  }

  addNewFile(detailsInput?: { filename?: string; text: string }) {
    const ids = getKeysForMap(this.yData.fileDetailsState);
    const fileDetails = new Y.Map();
    const text = new Y.Text();
    const tabId = ids.length.toString();
    fileDetails.set('tabId', tabId);
    fileDetails.set('deleted', false);
    if (detailsInput) {
      text.insert(0, detailsInput.text);
      this.yData.fileContents.set(tabId, new Y.Text());
    } else {
      fileDetails.set('filename', `new-file-${getKeysForMap(this.yData.fileDetailsState).length}`);
    }
    this.yData.fileDetailsState.set(tabId, fileDetails);
    this.yData.fileContents.set(tabId, text);
    console.log('added new file: new file details: ');
    console.log(fileDetails.toJSON());
    return fileDetails.toJSON() as fileDetailsState;
  }

  removeFile(tabId: string) {
    this.yData.fileDetailsState.delete(tabId);
    this.yData.fileContents.delete(tabId);
    console.log('removed file');
  }

  destroy() {
    this.binding?.destroy();
    this.provider.destroy();
    this.editor.dispose();
    this.ydoc.destroy();
    this.roomDestroyed$$.next(true);
    this.roomDestroyed$$.complete();
  }
}
