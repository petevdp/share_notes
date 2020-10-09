import 'codemirror/theme/3024-day.css';
import 'codemirror/theme/3024-night.css';
import 'codemirror/mode/css/css.js';
import 'codemirror/keymap/vim.js';
import 'codemirror/keymap/emacs.js';
import 'codemirror/keymap/sublime.js';

import { LightTheme } from 'baseui';
import { DEBUG_FLAGS } from 'Client/debugFlags';
import { DETECT_LANGUAGES, languageDetectionResponse } from 'Client/queries';
import { userType } from 'Client/session/types';
import { clientSettings, getSettingsForEditor, settingsResolvedForEditor } from 'Client/settings/types';
import { request as gqlRequest } from 'graphql-request';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { ConnectableObservable } from 'rxjs/internal/observable/ConnectableObservable';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { map } from 'rxjs/internal/operators/map';
import { mergeScan } from 'rxjs/internal/operators/mergeScan';
import { publish } from 'rxjs/internal/operators/publish';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { Subject } from 'rxjs/internal/Subject';
import { getYjsDocNameForRoom, GRAPHQL_URL, YJS_WEBSOCKET_URL_WS } from 'Shared/environment';
import { allFileDetailsStates, fileDetailsState, roomDetails, RoomManager } from 'Shared/roomManager';
import { getKeysForMap } from 'Shared/ydocUtils';
import { CodeMirrorBinding, CodemirrorBinding } from 'y-codemirror';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

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

const allColors = [
  LightTheme.colors.accent,
  LightTheme.colors.negative,
  LightTheme.colors.warning,
  LightTheme.colors.positive,
];

export class ClientSideRoomManager extends RoomManager {
  provider: WebsocketProvider;
  bindings: Map<string, CodemirrorBinding>;
  currentFile$$: BehaviorSubject<string | null>;
  availableColours$$: BehaviorSubject<string[] | null>;
  roomDestroyed$$: Subject<boolean>;
  provisionedTab$$: Subject<{ tabId: string; editorContainer: HTMLElement }>;
  providerSynced: Promise<true>;
  fileDetails$: ConnectableObservable<allFileDetailsStates>;
  roomDetails$: ConnectableObservable<roomDetails>;
  awareness$: ConnectableObservable<globalAwareness>;

  constructor(roomHashId: string, private settings$: Observable<clientSettings>) {
    super();
    const CodeMirrorModule = import('codemirror');
    this.roomDestroyed$$ = new Subject<boolean>();
    this.ydoc = new Y.Doc();
    this.yData = {
      fileDetailsState: this.ydoc.getMap(`fileDetails`),
      fileContents: this.ydoc.getMap(`fileContents`),
      details: this.ydoc.getMap(`details`),
    };

    this.currentFile$$ = new BehaviorSubject(null);
    this.provisionedTab$$ = new Subject();
    this.bindings = new Map();

    this.provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, getYjsDocNameForRoom(roomHashId), this.ydoc);

    /*
      3024-night
      material-darker
      theme: 'ambiance',
    */
    const themeMap = {
      light: '3024-day',
      dark: '3024-night',
    };

    // initialize provisioned tabs
    this.provisionedTab$$
      .pipe(withLatestFrom(this.settings$))
      .subscribe(async ([{ tabId, editorContainer }, settings]) => {
        const CodeMirror = await CodeMirrorModule;
        const editor = CodeMirror.default(editorContainer, {
          mode: { name: 'css' },
          viewportMargin: Infinity,
          lineWrapping: true,
          theme: themeMap[settings.theme],
        });

        const settingsForEditor = getSettingsForEditor(settings, roomHashId, tabId);
        ClientSideRoomManager.setEditorSettings(settingsForEditor, editor);

        const content = this.yData.fileContents.get(tabId);
        if (!content) {
          throw 'tried to provision nonexistant editor';
        }
        const binding = new CodeMirrorBinding(content, editor, this.provider.awareness);
        if (process.env.NODE_ENV === 'development' && DEBUG_FLAGS.stopRemoveCursorOnBlur) {
          binding.cm.off('blur', binding._blurListeer);
        }
        this.bindings.set(tabId, binding);
      });

    // listen for and apply settings changes to editors
    settings$.subscribe((settings) => {
      for (let [tabId, binding] of this.bindings.entries()) {
        const settingsForEditor = getSettingsForEditor(settings, roomHashId, tabId);
        ClientSideRoomManager.setEditorSettings(settingsForEditor, binding.cm);
        binding.cm.setOption('theme', themeMap[settings.theme]);
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
        const currState = (this.yData.fileDetailsState.toJSON() as allFileDetailsStates) || undefined;
        currState && s.next(currState);
      };

      // initial state on sync
      this.providerSynced.then(() => s.next(this.yData.fileDetailsState.toJSON() as allFileDetailsStates));

      this.yData.fileDetailsState.observeDeep(fileDetailsListener);
      this.roomDestroyed$$.subscribe(() => {
        this.yData.fileDetailsState.unobserveDeep(fileDetailsListener);
        s.complete();
      });
    }).pipe(publish()) as ConnectableObservable<allFileDetailsStates>;

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
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      publish(),
    ) as ConnectableObservable<globalAwareness>;

    this.roomDetails$ = new Observable<roomDetails>((s) => {
      const listener = () => {
        s.next(this.yData.details.toJSON() as roomDetails);
      };
      this.yData.details.observeDeep(listener);
      // this.providerSynced.then(() => s.next(this.yData.details.toJSON() as sharedRoomDetails));

      this.roomDestroyed$$.subscribe(() => {
        this.yData.details.unobserveDeep(listener);
        s.complete();
      });
    }).pipe(publish()) as ConnectableObservable<roomDetails>;

    this.availableColours$$ = new BehaviorSubject(null);

    this.fileDetails$
      .pipe(
        map((allDetails) => {
          let data: { [tabId: string]: langaugeDetectInput } = {};
          for (let [tabId, details] of Object.entries(allDetails)) {
            data[tabId] = {
              tabId,
              filename: details.filename,
            };
          }
          return data;
        }),
        distinctUntilChanged(),
        mergeScan(async (prevState, newInputs) => {
          const next: { [key: string]: languageDetectState } = {};
          const toDetect: langaugeDetectPayload[] = [];
          for (let input of Object.values(newInputs)) {
            if (!prevState[input.tabId] || input !== prevState[input.tabId].input) {
              toDetect.push({
                ...input,
                content: this.yData.fileContents.get(input.tabId)?.toJSON() || ('' as string),
              });
            } else {
              next[input.tabId] = prevState[input.tabId];
            }
          }

          const response = await gqlRequest<languageDetectionResponse>(GRAPHQL_URL, DETECT_LANGUAGES, {
            data: toDetect,
          });
          return response.detectFiletype.reduce(
            (state, output) => ({
              ...state,
              [output.tabId]: { input: newInputs[output.tabId], outputMode: output.mode },
            }),
            {} as { [tabId: string]: languageDetectState },
          );
        }, {} as { [tabId: string]: languageDetectState }),
      )
      .subscribe(async (langageDetectionState) => {
        for (let [tabId, state] of Object.entries(langageDetectionState)) {
          const binding = this.bindings.get(tabId);
          if (!binding) {
            continue;
          }
          // right now this imports all files that match the blow pattern for a given template variable (https://webpack.js.org/api/module-methods/#magic-comments), could maybe be improved
          await import(`codemirror/mode/${state.outputMode}/${state.outputMode}.js`);

          binding.cm.setOption('mode', state.outputMode);
        }
      });

    this.awareness$
      .pipe(
        map((awareness) => {
          if (Object.keys(awareness).length === 0) {
            return allColors;
          }
          const takenColors = Object.values(awareness)
            .filter((u) => !!u?.user?.color)
            .map((u) => u?.user?.color as string);
          return allColors.filter((c) => !takenColors.includes(c));
        }),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      )
      .subscribe(this.availableColours$$);
  }

  connect() {
    this.fileDetails$.connect();
    this.awareness$.connect();
    this.roomDetails$.connect();
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
    const userAwareness: userAwarenessDetails = { clientID: this.ydoc.clientID, color: availableColors[0], ...user };
    this.provider.awareness.setLocalStateField('user', userAwareness);
  }

  unprovisionTab(tabId: string) {
    const binding = this.bindings.get(tabId);
    binding?.destroy();
    this.bindings.delete(tabId);
  }

  addNewFile(detailsInput?: { filename?: string; content?: string }) {
    const fileDetails = new Y.Map();
    const text = new Y.Text();
    const highestId = getKeysForMap(this.yData.fileDetailsState).reduce(
      (max, id) => (Number(id) > max ? Number(id) : max),
      0,
    );

    const tabId = (Number(highestId) + 1).toString();
    fileDetails.set('tabId', tabId);
    fileDetails.set('deleted', false);
    if (detailsInput) {
      text.insert(0, detailsInput.content || '');
      this.yData.fileContents.set(tabId, new Y.Text());
      fileDetails.set('filename', detailsInput.filename);
    } else {
      fileDetails.set('filename', `new-file-${tabId}`);
    }
    this.yData.fileDetailsState.set(tabId, fileDetails);
    this.yData.fileContents.set(tabId, text);
    return fileDetails.toJSON() as fileDetailsState;
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
      }
    }
  }

  static setAllEditorSettings(settings: clientSettings, roomHashId: string, editors: Map<string, CodeMirror.Editor>) {
    for (let [tabId, editor] of editors.entries()) {
      const settingsForTab = getSettingsForEditor(settings, roomHashId, tabId);
      ClientSideRoomManager.setEditorSettings(settingsForTab, editor);
    }
  }
}
