import { Doc } from 'yjs';
import React, { useEffect, useRef } from 'react';
import { useStyletron } from 'baseui';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';
import { WebsocketProvider } from 'y-websocket';

export const Editor: React.FC<{ hashId: string }> = ({ hashId }) => {
  const [css] = useStyletron();
  const monacoContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ydoc = new Doc();
    const provider = new WebsocketProvider('ws:localhost:1236/socket', 'yjs-room', ydoc);
    const textCRDT = ydoc.getText(hashId);
    const editor = monaco.editor.create(monacoContainerRef.current, {
      language: 'markdown',
    });

    new MonacoBinding(textCRDT, editor.getModel(), new Set([editor]), provider.awareness);
    provider.connect();

    return () => provider.disconnect();
  }, [hashId]);
  return <div className={css({ height: '500px' })} id="monaco-editor-container" ref={monacoContainerRef} />;
};
