// import 'codemirror/theme/abcdef.css';
// import 'codemirror/theme/ambiance.css';
// import 'codemirror/theme/ambiance-mobile.css';
// import 'codemirror/theme/ayu-dark.css';
// import 'codemirror/theme/ayu-mirage.css';
// import 'codemirror/theme/base16-dark.css';
// import 'codemirror/theme/base16-light.css';
// import 'codemirror/theme/bespin.css';
// import 'codemirror/theme/blackboard.css';
// import 'codemirror/theme/cobalt.css';
// import 'codemirror/theme/colorforth.css';
// import 'codemirror/theme/darcula.css';
// import 'codemirror/theme/dracula.css';
// import 'codemirror/theme/duotone-dark.css';
// import 'codemirror/theme/duotone-light.css';
// import 'codemirror/theme/eclipse.css';
// import 'codemirror/theme/elegant.css';
// import 'codemirror/theme/erlang-dark.css';
// import 'codemirror/theme/gruvbox-dark.css';
// import 'codemirror/theme/hopscotch.css';
// import 'codemirror/theme/icecoder.css';
// import 'codemirror/theme/idea.css';
// import 'codemirror/theme/isotope.css';
// import 'codemirror/theme/lesser-dark.css';
// import 'codemirror/theme/liquibyte.css';
// import 'codemirror/theme/lucario.css';
// import 'codemirror/theme/material.css';
// import 'codemirror/theme/material-darker.css';
// import 'codemirror/theme/material-ocean.css';
// import 'codemirror/theme/material-palenight.css';
// import 'codemirror/theme/mbo.css';
// import 'codemirror/theme/mdn-like.css';
// import 'codemirror/theme/midnight.css';
// import 'codemirror/theme/monokai.css';
// import 'codemirror/theme/moxer.css';
// import 'codemirror/theme/neat.css';
// import 'codemirror/theme/neo.css';
// import 'codemirror/theme/night.css';
// import 'codemirror/theme/nord.css';
// import 'codemirror/theme/oceanic-next.css';
// import 'codemirror/theme/panda-syntax.css';
// import 'codemirror/theme/paraiso-dark.css';
// import 'codemirror/theme/paraiso-light.css';
// import 'codemirror/theme/pastel-on-dark.css';
// import 'codemirror/theme/railscasts.css';
// import 'codemirror/theme/rubyblue.css';
// import 'codemirror/theme/seti.css';
// import 'codemirror/theme/shadowfox.css';
// import 'codemirror/theme/solarized.css';
// import 'codemirror/theme/ssms.css';
// import 'codemirror/theme/the-matrix.css';
// import 'codemirror/theme/tomorrow-night-bright.css';
// import 'codemirror/theme/tomorrow-night-eighties.css';
// import 'codemirror/theme/ttcn.css';
// import 'codemirror/theme/twilight.css';
// import 'codemirror/theme/vibrant-ink.css';
// import 'codemirror/theme/xq-dark.css';
// import 'codemirror/theme/xq-light.css';
// import 'codemirror/theme/yeti.css';
// import 'codemirror/theme/yonce.css';
// import 'codemirror/theme/zenburn.css';
// import 'codemirror/mode/xml/xml.js';
import 'codemirror/theme/3024-day.css';
import 'codemirror/theme/3024-night.css';

import { gistDetails } from 'Client/queries';
import { allFileDetailsStates, fileDetailsState, roomAwareness } from 'Client/room/types';
import { theme } from 'Client/settings/types';
import { getKeysForMap } from 'Client/ydocUtils';
import CodeMirror from 'codemirror';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { ConnectableObservable } from 'rxjs/internal/observable/ConnectableObservable';
import { publish } from 'rxjs/internal/operators/publish';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { Subject } from 'rxjs/internal/Subject';
import { Subscription } from 'rxjs/internal/Subscription';
import { YJS_ROOM, YJS_WEBSOCKET_URL_WS } from 'Shared/environment';
import { CodeMirrorBinding, CodemirrorBinding } from 'y-codemirror';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

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
  awareness$: Observable<roomAwareness>;

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
      dark: '3024-night',
      // dark: 'pastel-on-dark',
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
    }).pipe(publish());
    this.fileDetailsSubscription = (this.fileDetails$ as ConnectableObservable<allFileDetailsStates>).connect();

    this.awareness$ = new Observable((s) => {
      // const state = this.provider.awareness.getStates();
      // s.next();
    });
  }

  async provisionTab(tabId: string, editorContainer: HTMLElement) {
    await this.providerSynced;
    this.provisionedTab$$.next({ tabId, editorContainer });
  }

  setAwarenessUserDetails(username: string) {
    console.log('setting awareness');
    this.provider.awareness.setLocalStateField('user', { name: username, color: '#008833' });
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

    for (const binding of this.bindings.values()) {
      binding.destroy();
    }
  }
}
