import { Epic, StateObservable } from 'redux-observable';
import { filter, concatMap, map, withLatestFrom, ignoreElements, tap } from 'rxjs/operators';
import {
  initRoom,
  setFilenames,
  roomInitialized,
  switchCurrentFile,
  addNewFile,
  saveBackToGist,
  gistSaved,
  destroyRoom,
  setCurrentFile,
  createRoom,
  roomCreated,
} from './types';
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
import { getRoomResponse, GET_ROOM, getGistResponse, CREATE_ROOM, createRoomResponse, GET_GIST } from 'Client/queries';
import { rootState } from 'Client/store';
import { getGithubGraphqlClient } from 'Client/utils';

export const createRoomEpic: Epic = (action$) =>
  action$.pipe(
    filter(createRoom.match),
    concatMap(async ({ payload: input }) => {
      const res = await gqlRequest<createRoomResponse>(GRAPHQL_URL, CREATE_ROOM, { data: input });
      return roomCreated(res);
    }),
  );

export const initRoomEpic: Epic = (action$, state$: StateObservable<rootState>) =>
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
        const ydoc = new Y.Doc();
        const documents: Y.Map<Y.Text> = ydoc.getMap(`room/${roomHashId}/documents`);

        const provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, YJS_ROOM, ydoc);
        const editor = monacoEditor.create(editorContainerRef.current, { readOnly: true, minimap: { enabled: false } });
        const manager = new RoomManager(provider, editor, ydoc, documents);

        const setFilename$ = new Observable((s) => {
          const filenameListener = () => {
            s.next(setFilenames(getKeysForMap(documents)));
          };
          documents.observe(filenameListener);
          manager.roomDestroyed$$.subscribe(() => {
            documents.unobserve(filenameListener);
            s.complete();
          });
        });

        const syncPromise = new Promise((resolve, reject) => {
          const listener = () => {
            resolve(true);
          };
          provider.on('sync', listener);
          manager.roomDestroyed$$.subscribe(() => {
            reject('room destroyed before sync');
          });
        });
        const roomDataPromise = gqlRequest<getRoomResponse>(GRAPHQL_URL, GET_ROOM, { data: { hashId: roomHashId } });

        const githubClient = getGithubGraphqlClient(rootState.session.token);
        const gistDataPromise = roomDataPromise.then((r) => {
          return githubClient.request<getGistResponse>(GET_GIST, {
            name: r.room.gistName,
            ownerLogin: r.room.owner.githubLogin,
          });
        });

        const isCreatingRoom = false;
        if (isCreatingRoom) {
          Promise.all([gistDataPromise, syncPromise]).then(([gistData]) => {
            const { files } = gistData.user.gist;
            for (let file of files) {
              documents.set(file.name, new Y.Text(file.text));
            }
            if (files.length > 0) {
              return manager.switchCurrentFile(files[0].name);
            } else {
              return manager.addNewFile();
            }
          });
        } else {
          syncPromise.then(() => {
            const keys = getKeysForMap(documents);
            if (keys.length > 0) {
              return manager.switchCurrentFile(keys[0] as string);
            } else {
              return manager.addNewFile();
            }
          });
        }

        return merge(of(roomInitialized(manager)), setFilename$);
      },
    ),
  );

export const switchCurrentFileEpic: Epic = (action$) =>
  action$.pipe(
    filter(switchCurrentFile.match),
    withLatestFrom(action$.pipe(filter(roomInitialized.match))),
    map(([{ payload: filename }, { payload: roomManager }]) => {
      roomManager.switchCurrentFile(filename);
      return setCurrentFile(filename);
    }),
  );

export const addNewFileEpic: Epic = (action$) =>
  action$.pipe(
    filter(addNewFile.match),
    withLatestFrom(action$.pipe(filter(roomInitialized.match))),
    map(([, { payload: roomManager }]) => {
      const filename = roomManager.addNewFile();
      return setCurrentFile(filename);
    }),
  );

export const saveBackToGistEpic: Epic = (action$, state$: StateObservable<rootState>) =>
  action$.pipe(
    filter(saveBackToGist.match),
    withLatestFrom(state$, action$.pipe(filter(roomInitialized.match))),
    concatMap(async ([, rootState, { payload: roomManager }]) => {
      const roomData = rootState.room.room;
      const sessionData = rootState.session;
      if (!roomData.gist) {
        throw 'no data from github retreived';
      }
      if (!sessionData.token) {
        throw 'no token set';
      }

      const entriesForGithub = getEntriesForMap(roomManager.documents).reduce((obj, [filename, ytext]) => {
        return {
          ...obj,
          filename: {
            filename,
            content: ytext.toString(),
          },
        };
      }, {});

      await octokitRequest('PATCH /gists/{id}', {
        id: roomData.gist.id,
        files: entriesForGithub,
        headers: {
          Authorization: `bearer ${sessionData.token}`,
        },
      });

      return gistSaved();
    }),
  );

export const destroyRoomEpic: Epic = (action$) =>
  action$.pipe(
    filter(destroyRoom.match),
    withLatestFrom(action$.pipe(filter(roomInitialized.match))),
    map(([, { payload: roomManager }]) => {
      roomManager.destroy();
    }),
    ignoreElements(),
  );

export class RoomManager {
  private binding?: any;
  roomDestroyed$$: Subject<boolean>;
  constructor(
    private provider: WebsocketProvider,
    private editor: monacoEditor.IStandaloneCodeEditor,
    private ydoc: Y.Doc,
    public documents: Y.Map<Y.Text>,
  ) {
    this.roomDestroyed$$ = new Subject<boolean>();
  }

  switchCurrentFile(filename: string) {
    const keys = getKeysForMap(this.documents);
    if (!keys.includes(filename)) {
      this.documents.set(filename, new Y.Text());
    }
    const type = this.documents.get(filename) as Y.Text;
    this.binding?.destroy();
    this.binding = new MonacoBinding(type, this.editor.getModel(), new Set([this.editor]), this.provider.awareness);
    if (this.editor.getOption(monacoEditor.EditorOption.readOnly)) {
      this.editor.updateOptions({ readOnly: false });
    }
  }

  addNewFile() {
    const newFilename = `new-file${getKeysForMap(this.documents).length}`;
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
