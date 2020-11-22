import 'prismjs/themes/prism-twilight.css';

import { getAssignedColors } from 'Client/slices/room/types';
import {
  clientSettings,
  getSettingsForEditorWithComputed,
  settingsResolvedForEditor,
} from 'Client/slices/settings/types';
import { sanitize as DOMPurifySanitize } from 'dompurify';
import { uuidv4 } from 'lib0/random';
import __isEqual from 'lodash/isEqual';
import __random from 'lodash/random';
import marked from 'marked';
import * as monaco from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
import { merge } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { combineLatest } from 'rxjs/internal/observable/combineLatest';
import { ConnectableObservable } from 'rxjs/internal/observable/ConnectableObservable';
import { from } from 'rxjs/internal/observable/from';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { filter } from 'rxjs/internal/operators/filter';
import { first } from 'rxjs/internal/operators/first';
import { map } from 'rxjs/internal/operators/map';
import { mapTo } from 'rxjs/internal/operators/mapTo';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { publish } from 'rxjs/internal/operators/publish';
import { scan } from 'rxjs/internal/operators/scan';
import { startWith } from 'rxjs/internal/operators/startWith';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { tap } from 'rxjs/internal/operators/tap';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { Subject } from 'rxjs/internal/Subject';
import { getYjsDocNameForRoom, YJS_WEBSOCKET_URL_WS } from 'Shared/environment';
import { allBaseFileDetailsStates, roomDetails, RoomManager } from 'Shared/roomManager';
import {
  globalAwareness,
  globalAwarenessMap,
  roomMember,
  roomMemberInput,
} from 'Shared/types/roomMemberAwarenessTypes';
import { getKeysForMap } from 'Shared/utils/ydocUtils';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { gistDetails } from '../../../dist/src/shared/githubTypes';
import { MonacoBinding, RemoteCursorStyleManager } from './monacoBinding';

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

export type sharedRoomDetails = {
  assignedColours: { [cliendId: string]: string };
};

interface vimMode {
  dispose(): boolean;
}

export interface tabToProvision {
  tabId: string;
  elements: {
    editor: HTMLElement;
    vimStatusBar: HTMLElement;
    markdownPreview: HTMLElement;
    diffViewer: HTMLElement;
  };
}

interface provisionedTab extends tabToProvision {
  monacoBinding: MonacoBinding;
  vimMode?: vimMode;
  tabOrdinal: number;
}

export class ClientSideRoomManager extends RoomManager {
  provider: WebsocketProvider;
  provisionedTabs$$: BehaviorSubject<Map<string, provisionedTab>>;
  currentFile$$: BehaviorSubject<string | null>;
  tabsToProvision$$: Subject<tabToProvision>;
  providerSynced: Promise<true>;
  roomDetails$: ConnectableObservable<roomDetails>;
  fileDetails$: ConnectableObservable<allBaseFileDetailsStates>;
  awareness$: ConnectableObservable<globalAwareness>;
  orderedClientID$: Observable<string[]>;
  remoteCursorStyleManager: RemoteCursorStyleManager;

  static themeMap = {
    light: 'vs',
    dark: 'vs-dark',
  };
  newProvisionedTabs: Subject<[string, provisionedTab]>;

  constructor(
    roomHashId: string,
    private settings$: Observable<clientSettings>,
    gistDetails$: Observable<gistDetails | undefined>,
  ) {
    super(roomHashId);
    this.currentFile$$ = new BehaviorSubject(null);
    this.tabsToProvision$$ = new Subject();
    this.provisionedTabs$$ = new BehaviorSubject(new Map());
    this.newProvisionedTabs = new Subject();

    this.newProvisionedTabs.subscribe(([tabId, tab]) => {
      const tabs = this.provisionedTabs$$.getValue();
      tabs.set(tabId, tab);
      this.provisionedTabs$$.next(tabs);
    });

    this.provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, getYjsDocNameForRoom(roomHashId), this.ydoc);

    /*
      3024-night
      material-darker
      theme: 'ambiance',
    */

    // listen for and apply settings changes to editors
    settings$.pipe(takeUntil(this.roomDestroyed$$)).subscribe((settings) => {
      const allDetails = this.getFileDetailsWithComputed();
      for (let [tabId, tab] of this.provisionedTabs$$.value.entries()) {
        const details = allDetails[tabId];
        const settingsForEditor = getSettingsForEditorWithComputed(
          settings,
          roomHashId,
          tabId,
          details.filetype === 'markdown',
        );
        this.setEditorSettings(tabId, settingsForEditor);
        tab.monacoBinding.getEditor().updateOptions({ theme: ClientSideRoomManager.themeMap[settings.theme] });
      }
    });

    this.providerSynced = new Promise((resolve, reject) => {
      const roomDestroyedSubscription = this.roomDestroyed$$.subscribe(() => {
        reject();
      });
      const listener = () => {
        resolve(true);
        roomDestroyedSubscription.unsubscribe();
        this.provider.off('sync', listener);
      };
      this.provider.on('sync', listener);
    });

    this.providerSynced.catch(() => {
      console.warn('room destroyed before sync');
    });

    this.awareness$ = (() => {
      return new Observable<globalAwareness>((s) => {
        this.providerSynced.then(() => {
          s.next(this.getAwarenessStates());
        });

        const awarenessListener = () => {
          s.next(this.getAwarenessStates());
        };

        // change doesn't catch all changes to local state fields it seems
        this.provider.awareness.on('update', awarenessListener);

        this.roomDestroyed$$.subscribe(() => {
          this.provider.awareness.off('update', awarenessListener);
          s.complete();
        });
      }).pipe(distinctUntilChanged(__isEqual), publish()) as ConnectableObservable<globalAwareness>;
    })();

    this.roomDetails$ = this.yjsTypeToObservable(this.yData.details, this.roomDestroyed$$).pipe(
      publish(),
    ) as ConnectableObservable<roomDetails>;

    this.fileDetails$ = this.yjsTypeToObservable(this.yData.fileDetails, this.roomDestroyed$$).pipe(
      map((state: allBaseFileDetailsStates) => {
        const newState: allBaseFileDetailsStates = {};
        for (let [tabId, details] of Object.entries(state)) {
          newState[tabId] = {
            ...details,
            filetype: ClientSideRoomManager.determineLanguage(details.filename),
          };
        }
        return newState;
      }),
      publish(),
    ) as ConnectableObservable<allBaseFileDetailsStates>;

    console.log(
      this.fileDetails$.subscribe((details) => {
        console.log('emitted details.....: ', details);
      }),
    );

    // initialize provisioned tabs
    let tabOrdinal = 1;
    this.tabsToProvision$$
      .pipe(withLatestFrom(this.settings$, this.fileDetails$))
      .subscribe(async ([tabToProvision, settings, allFileDetails]) => {
        const { tabId, elements: tabElements } = tabToProvision;
        const uriInput = uuidv4();
        const uri = monaco.Uri.file(uriInput);
        const model = monaco.editor.createModel('', undefined, uri);
        const editor = monaco.editor.create(tabElements.editor, {
          value: '',
          model,
          theme: ClientSideRoomManager.themeMap[settings.theme],
          automaticLayout: true,
        });
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
        const tab: provisionedTab = {
          ...tabToProvision,
          monacoBinding: binding,
          tabOrdinal,
        };
        this.newProvisionedTabs.next([tabId, tab]);
        const settingsForEditor = getSettingsForEditorWithComputed(
          settings,
          roomHashId,
          tabId,
          allFileDetails[tabId].filetype === 'markdown',
        );
        this.setEditorSettings(tabId, settingsForEditor);
        tabOrdinal++;
      });

    combineLatest(this.fileDetails$, this.provisionedTabs$$).subscribe(([details, tabs]) => {
      for (let [tabId, tab] of tabs.entries()) {
        const tabDetails = details[tabId];

        const model = tab.monacoBinding.getEditor().getModel();
        if (tabDetails.filetype && model) {
          monaco.editor.setModelLanguage(model, tabDetails.filetype);
        }
      }
    });

    /**
     * Emits changes to the set of tabs that should be showing previews.
     * For a tab to be showing previews, it must be:
     * - a provisioned tab
     * - markdown preview setting resolved for the tab must be on
     * - must be displaying a markdown file
     */
    const showPreviewDelta$ = combineLatest(this.fileDetails$, this.settings$, this.provisionedTabs$$).pipe(
      scan(
        (acc, [allDetails, settings, bindings]) => {
          const ids = new Set([...bindings.keys(), ...acc.prevShowPreviewState.keys()]);
          let delta = new Map<string, boolean>();
          let showPreviewState = new Set<string>();

          for (let tabId of ids) {
            const details = allDetails[tabId];
            const settingsForEditor = getSettingsForEditorWithComputed(
              settings,
              roomHashId,
              tabId,
              details && details.filetype === 'markdown',
            );
            const willShowMarkdownPreview = bindings.get(tabId) && settingsForEditor.displayMode === 'markdownPreview';
            const didShowMarkdownPreview = acc.prevShowPreviewState.has(tabId);
            if (willShowMarkdownPreview) {
              showPreviewState.add(tabId);
              if (didShowMarkdownPreview === false) {
                delta.set(tabId, true);
              }
            } else if (!willShowMarkdownPreview && didShowMarkdownPreview) {
              delta.set(tabId, false);
            }
          }

          return { prevShowPreviewState: showPreviewState, delta };
        },
        { prevShowPreviewState: new Set<string>(), delta: new Map<string, boolean>() },
      ),
      concatMap(({ delta }) => from(delta.entries())),
    );

    // emits the html for previews for tabs that should be showing them
    const markdownPreview$ = showPreviewDelta$.pipe(
      filter(([, showPreview]) => showPreview),
      mergeMap(
        ([tabId]): Observable<[string, string]> => {
          const stopPreview$ = showPreviewDelta$.pipe(
            filter(([id, previewDelta]) => id === tabId && !previewDelta),
            mapTo(true),
            first(),
          );
          const binding = this.provisionedTabs$$.value.get(tabId)?.monacoBinding as MonacoBinding;
          const content$ = new Observable<string>((s) => {
            const disposable = binding.monacoModel.onDidChangeContent(() => {
              const value = binding.monacoModel.getValue();
              s.next(value);
            });
            binding.monacoModel.onWillDispose(() => {
              s.complete();
            });
            s.next(binding.monacoModel.getValue());
            return () => disposable.dispose();
          });

          return content$.pipe(
            takeUntil(stopPreview$),
            map((content) => {
              const markedContent = marked(content, { sanitizer: DOMPurifySanitize });
              return [tabId, markedContent];
            }),
          );
        },
      ),
    );

    markdownPreview$.subscribe(([tabId, htmlString]) => {
      const tab = this.provisionedTabs$$.value.get(tabId);
      if (!tab) {
        console.warn('tried to set markdown preview for unprovisioned tab ', tabId);
        return;
      }
      tab.elements.markdownPreview.innerHTML = htmlString;
    });

    const provisionedDiffEditorDelta$ = combineLatest(this.provisionedTabs$$, this.roomDetails$).pipe(
      scan(
        (acc, [tabs, roomDetails]) => {
          const ids = new Set([...tabs.keys(), ...acc.prevShowDiffEditorState.keys()]);
          let delta = new Map<string, boolean>();
          let showDiffEditorState = new Set<string>();
          for (let tabId of ids) {
            console.log({ tabId, gistLoaded: roomDetails.gistLoaded });
            const willProvisionDiffEditor = tabs.has(tabId) && roomDetails.gistLoaded;
            const didProvisionDiffEditor = acc.prevShowDiffEditorState.has(tabId);
            if (willProvisionDiffEditor) {
              showDiffEditorState.add(tabId);
              if (!didProvisionDiffEditor) {
                delta.set(tabId, true);
              }
            } else if (!willProvisionDiffEditor && didProvisionDiffEditor) {
              delta.set(tabId, false);
            }
          }

          return { prevShowDiffEditorState: showDiffEditorState, delta };
        },
        { prevShowDiffEditorState: new Set<string>(), delta: new Map<string, boolean>() },
      ),
      concatMap(({ delta }) => from(delta.entries())),
    );

    provisionedDiffEditorDelta$.subscribe((delta) => {
      console.log({ diffDelta: delta });
    });

    provisionedDiffEditorDelta$
      .pipe(
        filter(([, shouldProvision]) => shouldProvision),
        withLatestFrom(gistDetails$),
      )
      .subscribe(([[tabId], gistDetails]) => {
        const tab = this.provisionedTabs$$.value.get(tabId);
        if (!tab) {
          console.warn('tried to get unprovisioned tab ', tabId);
          return;
        }

        const originalContent = this.getFileDetails()[tabId].gistContent || '';
        const editor = monaco.editor.createDiffEditor(tab.elements.diffViewer, {
          readOnly: true,
          automaticLayout: true,
        });
        const originalContentModel = monaco.editor.createModel(originalContent, undefined);
        editor.setModel({
          original: originalContentModel,
          modified: tab.monacoBinding.monacoModel,
        });

        const dispose$ = merge(
          provisionedDiffEditorDelta$.pipe(
            filter(([deltaTabId, shouldProvision]) => deltaTabId == tabId && !shouldProvision),
            mapTo(true),
          ),
          this.roomDestroyed$$,
        ).pipe(first());

        this.fileDetails$.subscribe((filedetails) => {
          console.log({ filedetails });
        });

        // update original content when it's changed
        gistDetails$
          .pipe(
            startWith(gistDetails),
            filter((gistDetails) => !!gistDetails),
            withLatestFrom(
              this.fileDetails$.pipe(
                startWith(this.getFileDetails()),
                filter((details) => !!details[tabId]),
              ),
            ),
            map(([gistDetails, fileDetails]) => {
              const originalFile = gistDetails?.files[fileDetails[tabId].filename];
              const content = originalFile?.content || '';
              return content;
            }),
            distinctUntilChanged(),
          )
          .subscribe((content) => {
            originalContentModel.setValue(content);
          });

        dispose$.toPromise().then(() => {
          editor.dispose();
          originalContentModel.dispose();
        });
      });

    // this.orderedClientID$ = this.yjsTypeToObservable<string[]>(this.yData.orderedUserIDs, this.roomDestroyed$$);
    this.remoteCursorStyleManager = new RemoteCursorStyleManager(
      this.provider.awareness,
      this.awareness$,
      this.ydoc.clientID,
      this.awareness$.pipe(map(getAssignedColors)),
    );
  }

  connect() {
    this.awareness$.connect();
    this.roomDetails$.connect();
    this.fileDetails$.connect();
    this.provider.connect();
  }

  updateSettings(settings: clientSettings) {
    const allDetails = this.getFileDetails();
    for (let [tabId, binding] of this.provisionedTabs$$.value.entries()) {
      const details = allDetails[tabId];
      const settingsForEditor = getSettingsForEditorWithComputed(
        settings,
        this.roomHashId,
        tabId,
        details.filetype === 'markdown',
      );
      this.setEditorSettings(tabId, settingsForEditor);
      binding.monacoBinding.getEditor().updateOptions({ theme: ClientSideRoomManager.themeMap[settings.theme] });
    }
  }

  async provisionTab(tabToProvision: tabToProvision) {
    await this.providerSynced;
    this.tabsToProvision$$.next(tabToProvision);
  }

  async setAwarenessUserDetails(input: roomMemberInput) {
    let member: roomMember;
    const awarenessState = this.getAwarenessStates();
    const existingClientForUser = Object.values(awarenessState)
      .map((userAwareness) => userAwareness.roomMemberDetails)
      .find(
        (roomMemberDetails) =>
          roomMemberDetails?.userIdOrAnonID && roomMemberDetails.userIdOrAnonID === input.userIdOrAnonID,
      );

    if (existingClientForUser) {
      // the user has this room open elsewhere, so we can just copy his details from there.
      member = existingClientForUser;
    } else {
      member = input;
      this.provider.awareness.setLocalStateField('timeJoined', Date.now());
    }

    this.provider.awareness.setLocalStateField('roomMemberDetails', member);
  }

  unprovisionTab(tabId: string) {
    const binding = this.provisionedTabs$$.value.get(tabId)?.monacoBinding;
    binding?.destroy();
    this.provisionedTabs$$.value.delete(tabId);
    this.provisionedTabs$$.next(this.provisionedTabs$$.value);
  }

  removeFile(tabId: string) {
    const ids = getKeysForMap(this.yData.fileDetails);
    if (ids.length === 1) {
      throw 'handle no files left case better';
    }
    this.yData.fileDetails.delete(tabId);
    this.yData.fileContents.delete(tabId);
  }

  destroy() {
    this.provider.destroy();
    this.currentFile$$.complete();
    this.roomDestroyed$$.next(true);
    this.roomDestroyed$$.complete();
    this.remoteCursorStyleManager.destroy();

    for (const tab of this.provisionedTabs$$.value.values()) {
      // disposing the model will also dispose the binding
      tab.monacoBinding.monacoModel.dispose();
      tab.monacoBinding.destroy();
    }
    this.provisionedTabs$$.complete();
    super.destroy();
  }

  setEditorSettings(tabId: string, settings: settingsResolvedForEditor) {
    const updates: monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions = {};
    const tabs = this.provisionedTabs$$.getValue();
    const tab = tabs.get(tabId);
    if (!tab) {
      console.warn('tried to set editor settings for undefined tabid ', tabId);
      return;
    }
    const editor = tab.monacoBinding.getEditor();
    for (let option of Object.entries(settings)) {
      const key = option[0] as keyof settingsResolvedForEditor;
      const value = option[1] as settingsResolvedForEditor[keyof settingsResolvedForEditor];
      if (key === 'keyMap') {
        if (value === 'vim' && !tab.vimMode) {
          const vimMode = initVimMode(editor, tab.elements.vimStatusBar);
          tabs.set(tabId, { ...tab, vimMode });
          this.provisionedTabs$$.next(tabs);
        } else if (value === 'regular' && tab.vimMode) {
          tab.vimMode.dispose();
          delete tab.vimMode;
          this.provisionedTabs$$.next(tabs);
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
    editor.updateOptions(updates);
  }

  getAwarenessStates() {
    const awarenessMap = this.provider.awareness.getStates() as globalAwarenessMap;
    const globalAwareness: globalAwareness = {};
    for (let [i, v] of awarenessMap.entries()) {
      globalAwareness[i.toString()] = {
        currentTab: v.currentTab,
        roomMemberDetails: v.roomMemberDetails,
        timeJoined: v.timeJoined,
      };
    }
    return globalAwareness;
  }

  async setCurrentTab(tabId: string) {
    this.provider.awareness.setLocalStateField('currentTab', tabId);
    // the current implementation here to retrieve the binding assums that the tab for this tabid will at some point be provisioned. If it isn't this will never resolve.
    const binding = await this.provisionedTabs$$
      .pipe(
        filter((tabs) => tabs.has(tabId)),
        map((tabs) => tabs.get(tabId)?.monacoBinding as MonacoBinding),
        first(),
      )
      .toPromise();
    binding.getEditor().focus();
  }

  static setAllEditorSettings(
    settings: clientSettings,
    roomHashId: string,
    editors: Map<string, monaco.editor.IStandaloneCodeEditor>,
  ) {
    ClientSideRoomManager.setAllEditorSettings(settings, roomHashId, editors);
  }

  yjsTypeToObservable<V>(type: Y.Map<unknown> | Y.Array<unknown>, roomDestroyed$$: Observable<boolean>) {
    return new Observable<V>((subscriber) => {
      const listener = () => {
        subscriber.next(type.toJSON() as V);
      };
      type.observeDeep(listener);
      this.providerSynced.then(() => subscriber.next(type.toJSON() as V));
      roomDestroyed$$.subscribe(() => {
        type.unobserveDeep(listener);
        subscriber.complete();
      });
    });
  }

  getFileDetailsWithComputed(): allBaseFileDetailsStates {
    const details = this.getFileDetails();
    return Object.keys(details).reduce(
      (obj, tabId) => ({
        ...obj,
        [tabId]: { ...details[tabId], filetype: ClientSideRoomManager.determineLanguage(details[tabId].filename) },
      }),
      {} as allBaseFileDetailsStates,
    );
  }

  static determineLanguage(filename: string) {
    if (!filename) {
      return;
    }
    const extension = '.' + filename.split('.').pop();
    return (
      monaco.languages.getLanguages().find((language) => language.extensions?.includes(extension))?.id || 'markdown'
    );
  }
}
