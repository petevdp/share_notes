import { DEBUG_FLAGS } from 'Client/debugFlags';
import { userType } from 'Client/session/types';
import { clientSettings, getSettingsForEditor, settingsResolvedForEditor } from 'Client/settings/types';
import { stat } from 'fs';
import __isEqual from 'lodash/isEqual';
import * as monaco from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { ConnectableObservable } from 'rxjs/internal/observable/ConnectableObservable';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { map } from 'rxjs/internal/operators/map';
import { publish } from 'rxjs/internal/operators/publish';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { Subject } from 'rxjs/internal/Subject';
import { getYjsDocNameForRoom, YJS_WEBSOCKET_URL_WS } from 'Shared/environment';
import { allBaseFileDetailsStates, allComputedFileDetailsStates, roomDetails, RoomManager } from 'Shared/roomManager';
import { getKeysForMap } from 'Shared/ydocUtils';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { allColors } from './awarenessColors';
import { MonacoBinding, RemoteCursorStyleManager } from './monacoBinding';

export interface userAwarenessDetailsInput {
  type: userType;
  name: string;
  userId?: string;
  avatarUrl?: string;
}

export interface userAwarenessDetails extends userAwarenessDetailsInput {
  clientID: number;
  color: string;
}

export interface userAwareness {
  user?: userAwarenessDetails;
  selection?: {
    anchor: Y.RelativePosition;
    head: Y.RelativePosition;
  };
  currentTab?: string;
}

export interface langaugeDetectInput {
  filename: string;
  tabId: string;
}

export interface langaugeDetectPayload extends langaugeDetectInput {
  filename: string;
  tabId: string;
  content: string;
}

export interface languageDetectState {
  input: langaugeDetectInput;
  outputMode?: string;
}

export type globalAwarenessMap = Map<number, userAwareness>;
export type globalAwareness = { [id: string]: userAwareness };

export type sharedRoomDetails = {
  assignedColours: { [cliendId: string]: string };
};

interface vimMode {
  dispose(): boolean;
}

interface vimBindingState {
  vimMode?: vimMode;
  statusElement: HTMLElement;
}

// export class AwarenessManager {
//   constructor() {
//     this.awareness$ = new Observable<globalAwarenessMap>((s) => {
//       this.providerSynced.then(() => {
//         const state = this.provider.awareness.getStates() as globalAwarenessMap;
//         s.next(state);
//       });

//       const awarenessListener = () => {
//         const state = this.provider.awareness.getStates() as globalAwarenessMap;
//         s.next(state);
//       };

//       // change doesn't catch all changes to local state fields it seems
//       this.provider.awareness.on('update', awarenessListener);

//       this.roomDestroyed$$.subscribe(() => {
//         this.provider.awareness.off('update', awarenessListener);
//         s.complete();
//       });
//     }).pipe(
//       map((globalAwarenessMap) => {
//         const globalAwareness: globalAwareness = {};
//         for (let [i, v] of globalAwarenessMap.entries()) {
//           globalAwareness[i.toString()] = {
//             currentTab: v.currentTab,
//             user: v.user,
//           };
//         }
//         return globalAwareness;
//       }),
//       distinctUntilChanged(__isEqual),
//       publish(),
//     ) as ConnectableObservable<globalAwareness>;
//   }
// }

export class ClientSideRoomManager extends RoomManager {
  static lastRoomManagerId = 0;
  id: number;
  provider: WebsocketProvider;
  bindings: Map<string, MonacoBinding>;
  vimBindings: Map<string, vimBindingState>;
  currentFile$$: BehaviorSubject<string | null>;
  availableColours$$: BehaviorSubject<string[] | null>;
  tabsToProvision$$: Subject<{ tabId: string; editorContainer: HTMLElement; vimStatusBarContainer: HTMLElement }>;
  providerSynced: Promise<true>;
  roomDetails$: ConnectableObservable<roomDetails>;
  fileDetails$: ConnectableObservable<allBaseFileDetailsStates>;
  computedFileDetails$: ConnectableObservable<allComputedFileDetailsStates>;
  awareness$: ConnectableObservable<globalAwareness>;
  remoteCursorStyleManager: RemoteCursorStyleManager;

  constructor(roomHashId: string, private settings$: Observable<clientSettings>) {
    super();
    this.id = ClientSideRoomManager.lastRoomManagerId + 1;
    ClientSideRoomManager.lastRoomManagerId++;
    this.currentFile$$ = new BehaviorSubject(null);
    this.tabsToProvision$$ = new Subject();
    this.bindings = new Map();
    this.vimBindings = new Map();
    this.provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, getYjsDocNameForRoom(roomHashId), this.ydoc);

    /*
      3024-night
      material-darker
      theme: 'ambiance',
    */
    const themeMap = {
      light: 'vs',
      dark: 'vs-dark',
    };

    // listen for and apply settings changes to editors
    settings$.subscribe((settings) => {
      for (let [tabId, binding] of this.bindings.entries()) {
        const settingsForEditor = getSettingsForEditor(settings, roomHashId, tabId);
        this.setEditorSettings(tabId, settingsForEditor, binding.getEditor());
        binding.getEditor().updateOptions({ theme: themeMap[settings.theme] });
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

    this.awareness$ = (() => {
      return new Observable<globalAwarenessMap>((s) => {
        this.providerSynced.then(() => {
          const state = this.provider.awareness.getStates() as globalAwarenessMap;
          s.next(state);
        });

        const awarenessListener = () => {
          const state = this.provider.awareness.getStates() as globalAwarenessMap;
          s.next(state);
        };

        // change doesn't catch all changes to local state fields it seems
        this.provider.awareness.on('update', awarenessListener);

        this.roomDestroyed$$.subscribe(() => {
          this.provider.awareness.off('update', awarenessListener);
          s.complete();
        });
      }).pipe(
        map((globalAwarenessMap) => {
          const globalAwareness: globalAwareness = {};
          for (let [i, v] of globalAwarenessMap.entries()) {
            globalAwareness[i.toString()] = {
              currentTab: v.currentTab,
              user: v.user,
            };
          }
          return globalAwareness;
        }),
        distinctUntilChanged(__isEqual),
        publish(),
      ) as ConnectableObservable<globalAwareness>;
    })();

    this.roomDetails$ = this.yMapToObservable(this.yData.details, this.roomDestroyed$$).pipe(
      publish(),
    ) as ConnectableObservable<roomDetails>;

    this.fileDetails$ = this.yMapToObservable(this.yData.fileDetailsState, this.roomDestroyed$$).pipe(
      publish(),
    ) as ConnectableObservable<allBaseFileDetailsStates>;

    this.computedFileDetails$ = this.yMapToObservable<allComputedFileDetailsStates>(
      this.yData.computedFileDetails,
      this.roomDestroyed$$,
    ).pipe(publish()) as ConnectableObservable<allComputedFileDetailsStates>;

    // initialize provisioned tabs
    this.tabsToProvision$$
      .pipe(withLatestFrom(this.settings$, this.fileDetails$))
      .subscribe(async ([{ tabId, editorContainer, vimStatusBarContainer }, settings, fileDetails]) => {
        console.log('computed when provisioning ', tabId, ' ', { ...fileDetails[tabId] });
        this.vimBindings.set(tabId, { statusElement: vimStatusBarContainer });

        const uri = monaco.Uri.file('-' + this.id + fileDetails[tabId].filename);
        console.log(monaco.editor.getModels());
        const model = monaco.editor.createModel('', undefined, uri);
        const editor = monaco.editor.create(editorContainer, {
          value: '',
          model,
          theme: themeMap[settings.theme],
          automaticLayout: true,
        });
        const settingsForEditor = getSettingsForEditor(settings, roomHashId, tabId);
        this.setEditorSettings(tabId, settingsForEditor, editor);
        console.log('model: ', editor.getModel());
        const content = this.yData.fileContents.get(tabId);

        if (!content) {
          throw 'tried to provision nonexistant editor';
        }
        const binding = new MonacoBinding(
          content,
          model,
          new Set([editor]),
          this.remoteCursorStyleManager,
          this.provider.awareness,
          this.awareness$,
        );
        this.bindings.set(tabId, binding);
      });

    this.fileDetails$.subscribe((state) => {
      const languages = monaco.languages.getLanguages();

      for (let [id, { filename }] of Object.entries(state)) {
        const binding = this.bindings.get(id);
        if (!binding) {
          continue;
        }
        const editor: monaco.editor.IStandaloneCodeEditor = [...binding.editors.values()][0];
        console.log('editor: ', editor);
        const model = editor.getModel();

        if (!model) {
          continue;
        }
        const extension = '.' + filename.split('.').pop();

        const language = languages.find((language) => language.extensions?.includes(extension));
        if (language) {
          monaco.editor.setModelLanguage(model, language.id);
        }
      }
    });

    this.availableColours$$ = new BehaviorSubject(null);

    // determine current available colors and pipe into available colors subject
    this.awareness$
      .pipe(
        map((awareness) => {
          if (Object.keys(awareness).length === 0) {
            return allColors;
          }
          const takenColors = Object.values(awareness)
            .filter((u) => !!u?.user?.color)
            .map((u) => u?.user?.color as string);

          return allColors.filter((color) => !takenColors.includes(color));
        }),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      )
      .subscribe(this.availableColours$$);

    this.remoteCursorStyleManager = new RemoteCursorStyleManager(
      this.provider.awareness,
      this.awareness$,
      this.ydoc.clientID,
    );
  }

  connect() {
    this.awareness$.connect();
    this.roomDetails$.connect();
    this.fileDetails$.connect();
    this.computedFileDetails$.connect();
    this.provider.connect();
  }

  async provisionTab(tabId: string, editorContainer: HTMLElement, vimStatusBarContainer: HTMLElement) {
    await this.providerSynced;
    this.tabsToProvision$$.next({ tabId, editorContainer, vimStatusBarContainer });
  }

  async setAwarenessUserDetails(user: userAwarenessDetailsInput) {
    const availableColors = (await this.availableColours$$
      .pipe(
        filter((s) => !!s),
        first(),
      )
      .toPromise()) as string[];
    const userAwareness: userAwarenessDetails = {
      clientID: this.ydoc.clientID,
      color: availableColors[0],
      ...user,
    };
    this.provider.awareness.setLocalStateField('user', userAwareness);
  }

  unprovisionTab(tabId: string) {
    const binding = this.bindings.get(tabId);
    binding?.destroy();
    this.bindings.delete(tabId);
  }

  removeFile(tabId: string) {
    const ids = getKeysForMap(this.yData.fileDetailsState);
    if (ids.length === 1) {
      throw 'handle no files left case better';
    }
    const binding = this.bindings.get(tabId);
    if (binding) {
      binding.destroy();
    }
    this.bindings.delete(tabId);
    this.yData.fileDetailsState.delete(tabId);
    this.yData.fileContents.delete(tabId);
  }

  destroy() {
    super.destroy();
    this.provider.destroy();
    this.currentFile$$.complete();
    this.roomDestroyed$$.next(true);
    this.roomDestroyed$$.complete();
    this.availableColours$$.complete();
    this.remoteCursorStyleManager.destroy();

    for (const binding of this.bindings.values()) {
      binding.destroy();
    }
  }

  setEditorSettings(tabId: string, settings: settingsResolvedForEditor, editor: monaco.editor.IStandaloneCodeEditor) {
    const updates: monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions = {};
    const vimBindingState = this.vimBindings.get(tabId) as vimBindingState;
    for (let option of Object.entries(settings)) {
      const key = option[0] as keyof settingsResolvedForEditor;
      const value = option[1] as settingsResolvedForEditor[keyof settingsResolvedForEditor];
      if (key === 'keyMap') {
        if (value === 'vim' && !vimBindingState.vimMode) {
          const vimMode = initVimMode(editor, vimBindingState.statusElement);
          this.vimBindings.set(tabId, { ...vimBindingState, vimMode });
        } else if (value === 'regular' && vimBindingState.vimMode) {
          vimBindingState.vimMode.dispose();
          delete vimBindingState.vimMode;
        }
      } else if (key === 'lineWrapping') {
        updates['wordWrap'] = value ? 'on' : 'off';
      } else if (key === 'autoIndent') {
        updates['autoIndent'] = value ? 'advanced' : 'none';
      } else if (key === 'minimap') {
        updates['minimap'] = { enabled: value as boolean };
      } else if (key === 'intellisense') {
        updates['quickSuggestions'] = value as boolean;
      } else {
        (updates as any)[key] = value;
      }
    }
    console.log('updates: ', updates);
    editor.updateOptions({ ...updates });
  }

  static setAllEditorSettings(
    settings: clientSettings,
    roomHashId: string,
    editors: Map<string, monaco.editor.IStandaloneCodeEditor>,
  ) {
    ClientSideRoomManager.setAllEditorSettings(settings, roomHashId, editors);
  }

  yMapToObservable<V>(map: Y.Map<unknown>, roomDestroyed$$: Observable<boolean>) {
    return new Observable<V>((subscriber) => {
      const listener = () => {
        subscriber.next(map.toJSON() as V);
      };
      map.observeDeep(listener);
      this.providerSynced.then(() => subscriber.next(map.toJSON() as V));
      roomDestroyed$$.subscribe(() => {
        map.unobserveDeep(listener);
        subscriber.complete();
      });
    });
  }
}
