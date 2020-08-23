import * as YJS from 'yjs';
import { YJS_WEBSOCKET_URL_WS, API_URL } from 'Shared/environment';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';
import { WebsocketProvider } from 'y-websocket';
import { useEffect, useRef } from 'react';

export function useYjsEditor() {
  const containerEltRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ydoc = new YJS.Doc();
    const provider = new WebsocketProvider('ws:localhost:1236/yjsSocket', `editorSocket`, ydoc);
    const type = ydoc.getText('monaco');
    const editor = monaco.editor.create(containerEltRef.current, {
      language: 'markdown',
    });

    new MonacoBinding(type, editor.getModel(), new Set([editor]), provider.awareness);
    provider.connect();
  }, []);
  return containerEltRef;
}
