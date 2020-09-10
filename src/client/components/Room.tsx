import { useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
// import { CodemirrorBinding } from 'y-codemirror';
import { GET_ROOM, getRoomResponse, getGistResponse, GET_GIST, getCurrentUserResult } from 'Client/queries';
import { useSelector } from 'react-redux';
import { rootState } from 'Client/store';
import { useStyletron } from 'styletron-react';
import { WebsocketProvider } from 'y-websocket';
import { Button } from 'baseui/button';
import { YJS_WEBSOCKET_URL_WS, YJS_ROOM } from 'Shared/environment';
import { getKeysForMap, getEntriesForMap } from 'Client/ydocUtils';
import { request as octokitRequest } from '@octokit/request';
// import CodeMirror from 'codemirror';
import { editor as monacoEditor } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import * as Y from 'yjs';
import { sessionSliceState, currentUser } from 'Client/session/types';
import { userInfo } from 'os';

/**
 * yjs setup state and data fetching for the editor
 */
function useRealTimeEditor(
  editorContainerRef: React.MutableRefObject<HTMLElement>,
  roomHashId: string,
  roomData: getRoomResponse,
) {
  const roomDocPath = `room/${roomHashId}`;

  // selectors
  const isCreatingRoom = useSelector<rootState, boolean>((s) => s.room.isCreatingRoom);
  const session = useSelector<rootState, sessionSliceState>((s) => s.session);

  const [getGist, { data: getGistData }] = useLazyQuery<getGistResponse>(GET_GIST);

  const [ydoc] = useState(() => new Y.Doc());
  const [binding, setBinding] = useState<any>();
  const [filenames, setFilenames] = useState<string[]>([]);
  const [documents] = useState(() => ydoc.getMap(`${roomDocPath}/documents`) as Y.Map<Y.Text>);
  const [isSynced, setIsSynced] = useState(false);
  const [currentFilename, setCurrentFilename] = useState<undefined | string>();

  const provider = useMemo(() => new WebsocketProvider(YJS_WEBSOCKET_URL_WS, YJS_ROOM, ydoc), []);
  const editor = useMemo(() => {
    if (editorContainerRef.current) {
      return monacoEditor.create(editorContainerRef.current, { readOnly: true });
    }
  }, [editorContainerRef.current]);
  const isRoomOwner = useMemo(() => {
    if (session.user && roomData) {
      console.log('room data res: ', roomData);
      return session.user.githubLogin === roomData.room.owner.githubLogin ? 'yes' : 'no';
    } else {
      return 'loading';
    }
  }, [session, roomData]);

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

    return () => {
      provider?.destroy();
      binding?.destroy();
    };
  }, []);

  useEffect(() => {
    if (roomData) {
      getGist({ variables: { name: roomData.room.gistName, ownerLogin: roomData.room.owner.githubLogin } });
    }
  }, [roomData]);

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
    if (
      isCreatingRoom &&
      editor &&
      provider &&
      getGistData?.user?.gist &&
      isSynced &&
      getKeysForMap(documents).length === 0
    ) {
      const { files } = getGistData.user.gist;
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
    const newBinding = new MonacoBinding(type, editor.getModel(), new Set([editor]), currProvider.awareness);
    if (editor.getOption(monacoEditor.EditorOption.readOnly)) {
      editor.updateOptions({ readOnly: false });
    }
    setBinding(newBinding);
    setCurrentFilename(filename);
  };

  const addNewFile = () => {
    const newFilename = `new-file${filenames.length}`;
    switchCurrentFile(newFilename);
  };

  const saveBackToGist = async () => {
    if (isRoomOwner === 'yes' && getGistData.user.gist) {
      const params = new URLSearchParams({
        accept: 'application/vnd.github.v3+json',
        gist_id: getGistData.user.gist.id,
        files: documents.toJSON(),
      });

      const entriesForGithub = getEntriesForMap(documents).reduce((obj, [filename, ytext]) => {
        return {
          ...obj,
          filename: {
            filename,
            content: ytext.toString(),
          },
        };
      }, {});

      await octokitRequest('PATCH /gists/{id}', {
        id: roomData.room.gistName,
        files: entriesForGithub,
        headers: {
          Authorization: `bearer ${session.token}`,
        },
      });
    }
  };

  return { filenames, currentFilename, addNewFile, switchCurrentFile, saveBackToGist };
}

export function Room() {
  const [css] = useStyletron();
  const { roomHashId } = useParams();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { data: roomDataResult } = useQuery<getRoomResponse>(GET_ROOM, {
    variables: { data: { hashId: roomHashId } },
  });
  const realTimeEditor = useRealTimeEditor(editorContainerRef, roomHashId, roomDataResult);

  const filenameElements = realTimeEditor.filenames.map((n) => (
    <Button key={n} onClick={() => realTimeEditor.switchCurrentFile(n)}>
      {n}
    </Button>
  ));

  return (
    <span>
      <h4>{roomDataResult && roomDataResult.room.name}</h4>
      <div>current: {realTimeEditor.currentFilename}</div>
      <div>
        {filenameElements}
        <Button kind={'secondary'} onClick={() => realTimeEditor.addNewFile()}>
          Add
        </Button>
        <Button onClick={() => realTimeEditor.saveBackToGist()}>Save back to Gist</Button>
      </div>
      <div className={css({ height: '500px' })} id="monaco-editor-container" ref={editorContainerRef} />;
    </span>
  );
}
