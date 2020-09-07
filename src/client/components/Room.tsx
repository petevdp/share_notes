import { useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useLazyQuery, useApolloClient } from '@apollo/client';
import { CodeMirrorBinding, CodemirrorBinding } from 'y-codemirror';
import { GET_ROOM, getRoomResponse, getGistResponse, GET_GIST } from 'Client/queries';
import { useSelector, useDispatch } from 'react-redux';
import { rootState } from 'Client/store';
import { useStyletron } from 'styletron-react';
import { WebsocketProvider } from 'y-websocket';
import { Button } from 'baseui/button';
import { Heading } from 'baseui/heading';
import { YJS_WEBSOCKET_URL_WS, YJS_ROOM } from 'Shared/environment';
import { completeCreatingRoom } from 'Client/room/slice';
import { iteratorOfArray, getKeysForMap } from 'Client/ydocUtils';
import { createIterator } from 'lib0/iterator';
import * as monaco from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import { equalFlat } from 'lib0/array';
import CodeMirror from 'codemirror';
import * as Y from 'yjs';

import 'codemirror/lib/codemirror.css';
import { listenerCount } from 'process';
type allowedYjsValues =
  | String
  | Number
  | Boolean
  | Object
  | Array<any>
  | Uint8Array
  | Y.AbstractType<Y.YEvent>
  | undefined;

export const Room: React.FC = () => {
  const [css] = useStyletron();
  const { roomHashId } = useParams();
  const roomDocPath = `room/${roomHashId}`;
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isCreatingRoom = useSelector<rootState, boolean>((s) => s.room.isCreatingRoom);
  const dispatch = useDispatch();

  const [ydoc] = useState(() => new Y.Doc());
  const [editor, setEditor] = useState<undefined | CodeMirror.Editor>();
  const [provider, setProvider] = useState<undefined | WebsocketProvider>();
  const [binding, setBinding] = useState<any>(undefined);
  const [filenames, setFilenames] = useState<string[]>([]);
  const [documents] = useState(() => ydoc.getMap(`${roomDocPath}/documents`));
  // const [filenamesType] = useState(() => ydoc.getArray(`${roomDocPath}/filenames`));
  const [isSynced, setIsSynced] = useState(false);
  const [currentFilename, setCurrentFilename] = useState<undefined | string>();

  useEffect(() => {
    const provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, YJS_ROOM, ydoc);
    documents.observe((e) => {
      console.log('filenames in observer: ');
      const filenames = getKeysForMap(documents);
      setFilenames(filenames);
    });
    provider.connect();
    provider.on('sync', () => {
      setIsSynced(true);
    });
    setEditor(CodeMirror(editorContainerRef.current));
    setProvider(provider);
  }, []);

  useEffect(() => {
    if (editor && provider && isSynced) {
      const keys = getKeysForMap(documents);
      if (keys.length > 0) {
        switchCurrentFile(keys[0] as string);
      } else {
        addNewFile();
      }
    }
  }, [editor, provider, isSynced]);

  const { data: getRoomData } = useQuery<getRoomResponse>(GET_ROOM, {
    variables: { data: { hashId: roomHashId } },
  });

  const [getGist, { data: gistData, loading: gistLoading }] = useLazyQuery<getGistResponse>(GET_GIST);

  const switchCurrentFile = (filename: string, currProvider = provider) => {
    binding?.destroy();
    const keys = getKeysForMap(documents);
    if (!keys.includes(filename)) {
      documents.set(filename, new Y.Text());
    }
    const type = documents.get(filename);
    const newBinding = new CodemirrorBinding(type, editor, currProvider.awareness);
    setBinding(newBinding);
    setCurrentFilename(filename);
  };

  const addNewFile = (currentProvider = provider) => {
    const newFilename = `new-file${filenames.length}`;
    switchCurrentFile(newFilename, currentProvider);
  };

  const filenameElements = filenames.map((n) => (
    <Button key={n} onClick={() => switchCurrentFile(n)}>
      {n}
    </Button>
  ));

  return (
    <span>
      <h4>{getRoomData && getRoomData.room.name}</h4>
      <div>current: {currentFilename}</div>
      <div>
        {filenameElements}
        <Button kind={'secondary'} onClick={() => addNewFile()}>
          Add
        </Button>
      </div>
      <div className={css({ height: '500px' })} id="monaco-editor-container" ref={editorContainerRef} />;
    </span>
  );
};
