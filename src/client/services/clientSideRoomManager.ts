import 'codemirror/theme/3024-day.css';
import 'codemirror/theme/3024-night.css';
import 'codemirror/mode/css/css.js';
import './allThemeImports';
import 'codemirror/keymap/vim.js';
import 'codemirror/keymap/emacs.js';
import 'codemirror/keymap/sublime.js';

import { LightTheme } from 'baseui';
import { DEBUG_FLAGS } from 'Client/debugFlags';
import { userType } from 'Client/session/types';
import { clientSettings, getSettingsForEditor, settingsResolvedForEditor } from 'Client/settings/types';
import __isEqual from 'lodash/isEqual';
import * as monaco from 'monaco-editor';
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

export class ClientSideRoomManager extends RoomManager {
  static lastRoomManagerId = 0;
  id: number;
  provider: WebsocketProvider;
  bindings: Map<string, MonacoBinding>;
  currentFile$$: BehaviorSubject<string | null>;
  availableColours$$: BehaviorSubject<string[] | null>;
  provisionedTab$$: Subject<{ tabId: string; editorContainer: HTMLElement }>;
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
    this.provisionedTab$$ = new Subject();
    this.bindings = new Map();

    this.provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, getYjsDocNameForRoom(roomHashId), this.ydoc);

    /*
      3024-night
      material-darker
      theme: 'ambiance',
    */

    // listen for and apply settings changes to editors
    settings$.subscribe(() => {
      for (let [] of this.bindings.entries()) {
        // const settingsForEditor = getSettingsForEditor(settings, roomHashId, tabId);
        // ClientSideRoomManager.setEditorSettings(settingsForEditor, binding.cm);
        // binding.cm.setOption('theme', themeMap[settings.theme]);
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

    this.awareness$ = new Observable<globalAwarenessMap>((s) => {
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
    this.provisionedTab$$
      .pipe(withLatestFrom(this.settings$, this.fileDetails$))
      .subscribe(async ([{ tabId, editorContainer }, settings, fileDetails]) => {
        console.log('computed when provisioning ', tabId, ' ', fileDetails);

        const uri = monaco.Uri.file(fileDetails[tabId].filename + '-' + this.id);
        console.log(monaco.editor.getModels());
        const model = monaco.editor.createModel('', undefined, uri);
        const editor = monaco.editor.create(editorContainer, { value: '', model });
        console.log('model: ', editor.getModel());
        // const CodeMirror = await CodeMirrorModule;
        // const editor = CodeMirror.default(editorContainer, {
        //   mode: computedFileDetails[tabId].mode,
        //   viewportMargin: Infinity,
        //   indentWithTabs: false,
        //   lineWrapping: true,
        //   theme: themeMap[settings.theme],
        // });

        // ClientSideRoomManager.setEditorSettings(settingsForEditor, editor);

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

  async provisionTab(tabId: string, editorContainer: HTMLElement) {
    await this.providerSynced;
    this.provisionedTab$$.next({ tabId, editorContainer });
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

  static setEditorSettings(settings: settingsResolvedForEditor, editor: CodeMirror.Editor) {
    for (let [key, value] of Object.entries(settings)) {
      switch (key) {
        case 'keyMap':
          const keyMap = value as string | undefined;
          editor.setOption('keyMap', keyMap);
          break;
        default:
          (editor.setOption as any)(key, value);
          break;
      }
    }
  }

  static setAllEditorSettings(settings: clientSettings, roomHashId: string, editors: Map<string, CodeMirror.Editor>) {
    for (let [tabId, editor] of editors.entries()) {
      const settingsForTab = getSettingsForEditor(settings, roomHashId, tabId);
      ClientSideRoomManager.setEditorSettings(settingsForTab, editor);
    }
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
