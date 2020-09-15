import { Epic, StateObservable, ActionsObservable } from 'redux-observable';
import { filter, concatMap, map, withLatestFrom, ignoreElements, tap } from 'rxjs/operators';
import {
  initRoom,
  setFilenames,
  switchCurrentFile,
  addNewFile,
  saveBackToGist,
  gistSaved,
  destroyRoom,
  setCurrentFile,
  createRoom,
  roomCreated,
  gistDetailKeys,
  gistDetails,
  roomInitialized,
} from './types';
import { Action } from 'redux';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { editor as monacoEditor } from 'monaco-editor';
import { YJS_WEBSOCKET_URL_WS, YJS_ROOM, GRAPHQL_URL, API_URL, GITHUB_GRAPHQL_API_URL } from 'Shared/environment';
import { getKeysForMap, getEntriesForMap } from 'Client/ydocUtils';
import { Observable } from 'rxjs';
import { Subject, of, merge, pipe } from 'rxjs';
import { request as gqlRequest, GraphQLClient } from 'graphql-request';
import { request as octokitRequest } from '@octokit/request';
import {
  getRoomResponse,
  GET_ROOM,
  getGistResponse,
  CREATE_ROOM,
  createRoomResponse,
  GET_GIST,
  getGistRestResponse,
} from 'Client/queries';
import { rootState, epicDependencies } from 'Client/store';
import { getGithubGraphqlClient } from 'Client/utils';

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
        rootState,
      ]) => {
        // if (!sessionToken) {
        //   throw 'session token not set when initing room, need to handle this case still';
        // }
        if (!editorContainerRef.current) {
          throw 'editor container element not loaded';
        }
        const manager = new RoomManager(editorContainerRef.current, roomHashId);

        const setFilename$ = new Observable<Action>((s) => {
          const filenameListener = () => {
            s.next(setFilenames(getKeysForMap(manager.yData.documents)));
          };
          manager.yData.documents.observe(filenameListener);
          manager.roomDestroyed$$.subscribe(() => {
            manager.yData.documents.unobserve(filenameListener);
            s.complete();
          });
        });

        const syncPromise = new Promise((resolve, reject) => {
          const listener = () => {
            resolve(true);
          };
          manager.provider.on('sync', listener);
          manager.roomDestroyed$$.subscribe(() => {
            reject('room destroyed before sync');
          });
        });
        const roomDataPromise = gqlRequest<getRoomResponse>(GRAPHQL_URL, GET_ROOM, { data: { hashId: roomHashId } });

        const githubClient = getGithubGraphqlClient();
        const gistDataPromise = roomDataPromise.then((r) => {
          return octokitRequest('GET /gists/{gist_id}', {
            gist_id: r.room.gistName,
          }).then((r) => r.data as getGistRestResponse);
        });

        const isCreatingRoom = false;
        if (isCreatingRoom) {
          Promise.all([gistDataPromise, syncPromise]).then(([gistData]) => {
            const gist = gistData;
            if (!gist) {
              throw 'handle no gist case please';
            }

            const { files } = gist;
            for (let filename in files) {
              const file = files[filename];
              manager.yData.documents.set(file.filename, new Y.Text(file.text));
            }
            if (Object.keys(files).length > 0) {
              manager.switchCurrentFile(files[0].filename);
            } else {
              manager.addNewFile();
            }
          });
        } else {
          syncPromise.then(() => {
            const keys = getKeysForMap(manager.yData.documents);
            if (keys.length > 0) {
              manager.switchCurrentFile(keys[0] as string);
            } else {
              manager.addNewFile();
            }
          });
        }

        roomManager$$.next(manager);
        return merge(setFilename$, of(roomInitialized()));
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
      const filename = roomManager.addNewFile();
      return setCurrentFile(filename);
    }),
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
      const gist = rootState.room?.room?.gist;
      const sessionData = rootState.session;
      const { token } = sessionData;
      if (!gist) {
        throw 'no data from github retreived';
      }
      if (!token) {
        throw 'no token set';
      }

      const entriesForGithub = getEntriesForMap(roomManager.yData.documents).reduce((obj, [filename, ytext]) => {
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
    documents: Y.Map<Y.Text>;
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
      documents: this.ydoc.getMap(`room/${roomHashId}/documents`),
      details: this.ydoc.getMap(`room/${roomHashId}/details`),
    };

    this.provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, YJS_ROOM, this.ydoc);
    this.editor = monacoEditor.create(editorContainerElement, { readOnly: true, minimap: { enabled: false } });
  }

  switchCurrentFile(filename: string) {
    const keys = getKeysForMap(this.yData.documents);
    if (!keys.includes(filename)) {
      this.yData.documents.set(filename, new Y.Text());
    }
    const type = this.yData.documents.get(filename) as Y.Text;
    this.binding?.destroy();
    this.binding = new MonacoBinding(type, this.editor.getModel(), new Set([this.editor]), this.provider.awareness);
    if (this.editor.getOption(monacoEditor.EditorOption.readOnly)) {
      this.editor.updateOptions({ readOnly: false });
    }
  }

  addNewFile() {
    const newFilename = `new-file${getKeysForMap(this.yData.documents).length}`;
    this.switchCurrentFile(newFilename);
    return newFilename;
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
