import 'codemirror/theme/3024-day.css';
import 'codemirror/theme/3024-night.css';

import { LightTheme } from 'baseui';
import { DEBUG_FLAGS } from 'Client/debugFlags';
import { userType } from 'Client/session/types';
import { theme } from 'Client/settings/types';
import CodeMirror from 'codemirror';
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

  constructor(roomHashId: string, private theme$: Observable<theme>) {
    super();
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
      const binding = new CodeMirrorBinding(content, editor, this.provider.awareness);
      if (process.env.NODE_ENV === 'development' && DEBUG_FLAGS.stopRemoveCursorOnBlur) {
        binding.cm.off('blur', binding._blurListeer);
      }
      this.bindings.set(tabId, binding);
    });

    theme$.subscribe((theme) => {
      for (const binding of this.bindings.values()) {
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
        console.log('awareness state: ', JSON.parse(JSON.stringify([...state.entries()])));
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
    console.log('local state: ', this.provider.awareness.getLocalState());
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
}