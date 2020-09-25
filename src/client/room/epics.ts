import { Epic, StateObservable, ActionsObservable } from 'redux-observable';
import {
  filter,
  concatMap,
  map,
  withLatestFrom,
  ignoreElements,
  first,
  skipUntil,
  publish,
  startWith,
} from 'rxjs/operators';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/night.css';
import {
  initRoom,
  addNewFile,
  saveBackToGist,
  gistSaved,
  destroyRoom,
  setCurrentFile,
  roomCreated,
  roomInitialized,
  setRoomData,
  setRoomGistDetails,
  removeFile,
  allFileDetailsStates,
  setGistFileDetails,
  fileDetailsState,
  switchToRoom,
  renameFile,
  provisionTab,
  unprovisionTab,
  switchCurrentFile,
} from './types';
import { Action } from 'redux';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import CodeMirror from 'codemirror';
import { CodeMirrorBinding, CodemirrorBinding } from 'y-codemirror';
import { YJS_WEBSOCKET_URL_WS, YJS_ROOM, GRAPHQL_URL } from 'Shared/environment';
import { getKeysForMap, getEntriesForMap, awarenessListener } from 'Client/ydocUtils';
import { Subject, of, concat, Observable, merge, ConnectableObservable, Subscription, BehaviorSubject } from 'rxjs';
import { request as gqlRequest } from 'graphql-request';
import { request as octokitRequest } from '@octokit/request';
import { getRoomResponse, GET_ROOM, CREATE_ROOM, createRoomResponse, gistDetails } from 'Client/queries';
import { rootState, epicDependencies } from 'Client/store';
import { octokitRequestWithAuth as getOctokitRequestWIthAuth } from 'Client/utils/utils';
import { roomCreationActions } from 'Client/roomCreation/types';
import { theme, settingsActions } from 'Client/settings/types';

export const createRoomEpic: Epic = (action$) =>
  action$.pipe(
    filter(roomCreationActions.createRoom.match),
    concatMap(async ({ payload: { input } }) => {
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
          payload: { roomHashId, startingTab },
        },
        {
          room: { isCurrentUserCreatingRoom },
          settings: { theme: startingTheme },
        },
      ]) => {
        const theme$ = action$.pipe(
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

        if (isCurrentUserCreatingRoom) {
          Promise.all([gistDataPromise, manager.providerSynced]).then(([gistData]) => {
            const gist = gistData;
            if (!gist) {
              throw 'handle no gist case please';
            }
            const { files } = gist;
            console.log('gist: ', gist);
            console.log('set filestate for ', Object.keys(files));
            Object.values(files).map((file, index) => {
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

        const awarenessListener: awarenessListener = (s, d) => {
          console.log('changed indexes: ', s);
          console.log('origin: ', d);
        };

        manager.provider.awareness.on('change', awarenessListener);

        manager.provider.connect();
        roomManager$$.next(manager);

        const firstCurrentFile$ = manager.fileDetails$.pipe(
          first(),
          map((state) => switchCurrentFile(Object.keys(state)[0])),
        );

        return concat(
          of(roomInitialized()),
          merge(
            roomDataPromise.then(setRoomData),
            gistDataPromise.then(setRoomGistDetails),
            fileDetailsStateUpdateAction$,
            firstCurrentFile$,
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
  yData: {
    // storing file text and details separately as a performance optimization
    fileDetailsState: Y.Map<Y.Map<any>>;
    fileContents: Y.Map<Y.Text>;
    // for now just contains an object with details, there's probably a better way to do this though
    details: Y.Map<gistDetails>;
  };
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  bindings: Map<string, CodemirrorBinding>;

  currentFile$$: BehaviorSubject<string | null>;
  roomDestroyed$$: Subject<boolean>;
  provisionedTab$$: Subject<{ tabId: string; editorContainer: HTMLElement }>;
  providerSynced: Promise<true>;
  fileDetails$: Observable<allFileDetailsStates>;
  fileDetailsSubscription: Subscription;

  constructor(roomHashId: string, private theme$: Observable<theme>) {
    this.roomDestroyed$$ = new Subject<boolean>();
    this.ydoc = new Y.Doc();
    this.yData = {
      fileDetailsState: this.ydoc.getMap(`room/${roomHashId}/fileDetails`),
      fileContents: this.ydoc.getMap(`room/${roomHashId}/fileContents`),
      details: this.ydoc.getMap(`room/${roomHashId}/details`),
    };

    this.currentFile$$ = new BehaviorSubject(null);
    this.provisionedTab$$ = new Subject();
    this.bindings = new Map();

    this.provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, YJS_ROOM, this.ydoc);

    // this.editor = monacoEditor.create(editorContainerElement, {
    //   readOnly: true,
    //   minimap: { enabled: false },
    //   lineNumbers: 'off',
    //   automaticLayout: true,
    //   theme: themeMap[startingTheme],
    // });
    // });

    /*
      3024-night
      material-darker
      theme: 'ambiance',
    */
    console.log(CodeMirror.modes);
    console.log(CodeMirror.mimeModes);

    const themeMap = {
      light: '3024-day',
      dark: 'pastel-on-dark',
      // dark: 'material-darker',
    };

    this.provisionedTab$$.pipe(withLatestFrom(this.theme$)).subscribe(([{ tabId, editorContainer }, currentTheme]) => {
      const editor = CodeMirror(editorContainer, {
        mode: 'xml',
        viewportMargin: Infinity,
        lineWrapping: true,
        theme: themeMap[currentTheme],
      });
      const content = this.yData.fileContents.get(tabId);
      if (!content) {
        throw 'tried to provision nonexistant editor';
      }
      console.log('provisioning tab!');
      const binding = new CodeMirrorBinding(content, editor, this.provider.awareness);
      this.bindings.set(tabId, binding);
    });

    theme$.subscribe((theme) => {
      for (let binding of this.bindings.values()) {
        binding.cm.setOption('theme', themeMap[theme]);
      }
    });

    this.providerSynced = new Promise((resolve, reject) => {
      const roomDestroyedSubscription = this.roomDestroyed$$.subscribe(() => {
        reject('room destroyed before sync');
      });
      const listener = () => {
        resolve(true);
        roomDestroyedSubscription.unsubscribe();
      };
      this.provider.on('sync', listener);
    });

    this.fileDetails$ = new Observable<allFileDetailsStates>((s) => {
      const fileDetailsListener = () => {
        s.next(this.yData.fileDetailsState.toJSON() as allFileDetailsStates);
      };

      // initial state on sync
      this.providerSynced.then(() => s.next(this.yData.fileDetailsState.toJSON() as allFileDetailsStates));

      this.yData.fileDetailsState.observeDeep(fileDetailsListener);
      this.roomDestroyed$$.subscribe(() => {
        this.yData.fileDetailsState.unobserveDeep(fileDetailsListener);
        s.complete();
      });
    }).pipe(publish());
    this.fileDetailsSubscription = (this.fileDetails$ as ConnectableObservable<allFileDetailsStates>).connect();
  }

  provisionTab(tabId: string, editorContainer: HTMLElement) {
    this.provisionedTab$$.next({ tabId, editorContainer });
  }

  unprovisionTab(tabId: string) {
    const binding = this.bindings.get(tabId);
    binding?.destroy();
    this.bindings.delete(tabId);
  }

  addNewFile(detailsInput?: { filename?: string; content: string }) {
    const fileDetails = new Y.Map();
    const text = new Y.Text();
    const highestId = getKeysForMap(this.yData.fileDetailsState).reduce(
      (max, id) => (Number(id) > max ? Number(id) : max),
      0,
    );

    const tabId = (Number(highestId) + 1).toString();
    fileDetails.set('tabId', tabId);
    fileDetails.set('deleted', false);
    console.log('details: ', detailsInput);
    if (detailsInput) {
      text.insert(0, detailsInput.content);
      this.yData.fileContents.set(tabId, new Y.Text());
      fileDetails.set('filename', detailsInput.filename);
    } else {
      fileDetails.set('filename', `new-file-${tabId}`);
    }
    this.yData.fileDetailsState.set(tabId, fileDetails);
    this.yData.fileContents.set(tabId, text);
    console.log('added new file: new file details: ');
    console.log(fileDetails.toJSON());
    return fileDetails.toJSON() as fileDetailsState;
  }

  removeFile(tabId: string) {
    const ids = getKeysForMap(this.yData.fileDetailsState);
    if (ids.length === 1) {
      throw 'handle no files left case better';
    }
    if (this.currentFile$$.value === tabId) {
      const otherIds = ids.filter((v) => v !== tabId);
      // this.switchCurrentFile(otherIds[0]);
    }
    const binding = this.bindings.get(tabId);
    if (binding) {
      binding.destroy();
    }
    this.bindings.delete(tabId);
    this.yData.fileDetailsState.delete(tabId);
    this.yData.fileContents.delete(tabId);
    console.log('removed file');
  }

  destroy() {
    // this.binding?.destroy();
    this.provider.destroy();
    this.ydoc.destroy();
    this.currentFile$$.complete();
    this.roomDestroyed$$.next(true);
    this.roomDestroyed$$.complete();
    this.fileDetailsSubscription.unsubscribe();

    for (let binding of this.bindings.values()) {
      binding.destroy();
    }
  }
}
