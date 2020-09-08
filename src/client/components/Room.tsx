import { useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { CodemirrorBinding } from 'y-codemirror';
import { GET_ROOM, getRoomResponse, getGistResponse, GET_VIEWER_GIST } from 'Client/queries';
import { useSelector } from 'react-redux';
import { rootState } from 'Client/store';
import { useStyletron } from 'styletron-react';
import { WebsocketProvider } from 'y-websocket';
import { Button } from 'baseui/button';
import { YJS_WEBSOCKET_URL_WS, YJS_ROOM } from 'Shared/environment';
import { getKeysForMap } from 'Client/ydocUtils';
import CodeMirror from 'codemirror';
import * as Y from 'yjs';

import 'codemirror/lib/codemirror.css';

export const Room: React.FC = () => {
  const [css] = useStyletron();
  const { roomHashId } = useParams();
  const roomDocPath = `room/${roomHashId}`;
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isCreatingRoom = useSelector<rootState, boolean>((s) => s.room.isCreatingRoom);
  const [getGist, { data: getGistData }] = useLazyQuery<getGistResponse>(GET_VIEWER_GIST);
  const { data: getRoomData } = useQuery<getRoomResponse>(GET_ROOM, {
    variables: { data: { hashId: roomHashId } },
  });

  const [ydoc] = useState(() => new Y.Doc());
  const [editor, setEditor] = useState<undefined | CodeMirror.Editor>();
  const [provider, setProvider] = useState<undefined | WebsocketProvider>();
  const [binding, setBinding] = useState<CodemirrorBinding | undefined>(undefined);
  const [filenames, setFilenames] = useState<string[]>([]);
  const [documents] = useState(() => ydoc.getMap(`${roomDocPath}/documents`));
  // const [filenamesType] = useState(() => ydoc.getArray(`${roomDocPath}/filenames`));
  const [isSynced, setIsSynced] = useState(false);
  const [currentFilename, setCurrentFilename] = useState<undefined | string>();

  // const isRoomOwner = useMemo(() => {
  //   getGistData
  // })

  useEffect(() => {
    const provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, YJS_ROOM, ydoc);
    documents.observe(() => {
      const filenames = getKeysForMap(documents);
      setFilenames(filenames);
    });
    provider.connect();
    provider.on('sync', () => {
      setIsSynced(true);
    });

    setEditor(CodeMirror(editorContainerRef.current, { readOnly: true }));
    setProvider(provider);
    return () => {
      provider?.destroy();
      binding?.destroy();
    };
  }, []);

  useEffect(() => {
    if (getRoomData) {
      getGist({ variables: { name: getRoomData.room.gistName } });
    }
  }, [getRoomData, isCreatingRoom]);

  useEffect(() => {
    if (editor && provider && isSynced && !currentFilename) {
      const keys = getKeysForMap(documents);
      if (keys.length > 0) {
        switchCurrentFile(keys[0] as string);
      } else if (!isCreatingRoom) {
        addNewFile();
      }
    }
  }, [editor, provider, isSynced]);

  useEffect(() => {
    if (isCreatingRoom && editor && provider && getGistData && isSynced && getKeysForMap(documents).length === 0) {
      const { files } = getGistData.viewer.gist;
      for (let file of files) {
        documents.set(file.name, new Y.Text(file.text));
      }
      files.length > 0 && switchCurrentFile(files[0].name);
    }
  }, [isCreatingRoom, editor, provider, getGistData, isSynced]);

  const switchCurrentFile = (filename: string, currProvider = provider) => {
    if (filename === currentFilename) {
      return;
    }
    const keys = getKeysForMap(documents);
    if (!keys.includes(filename)) {
      documents.set(filename, new Y.Text());
    }
    const type = documents.get(filename) as Y.Text;
    binding?.destroy();
    const newBinding = new CodemirrorBinding(type, editor, currProvider.awareness);
    if (editor.getOption('readOnly')) {
      editor.setOption('readOnly', false);
    }
    setBinding(newBinding);
    setCurrentFilename(filename);
  };

  const addNewFile = () => {
    const newFilename = `new-file${filenames.length}`;
    switchCurrentFile(newFilename);
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
        <Button>Save back to Gist</Button>
      </div>
      <div className={css({ height: '500px' })} id="monaco-editor-container" ref={editorContainerRef} />;
    </span>
  );
};
