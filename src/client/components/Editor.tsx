import { Doc } from 'yjs';
import React, { useEffect, useRef } from 'react';
import { useStyletron } from 'baseui';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';
import { WebsocketProvider } from 'y-websocket';
import { useQuery, gql, useLazyQuery } from '@apollo/client';
import { text } from 'body-parser';
import { getCookie } from 'Client/utils';
import { YJS_WEBSOCKET_URL_WS, YJS_ROOM, SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';
import { getRoomResponse } from 'Client/queries';

const GET_GIST = gql`
  query github__getGist {
    viewer {
      id
      name
      gist(name: "23f7f252797a55b887d50cf768d68102") {
        id
        files {
          name
          text
        }
      }
    }
  }
`;

interface getGistResponse {
  viewer: {
    id: string;
    name: string;
    gist: {
      id: string;
      files: {
        name: string;
        text: string;
      }[];
    };
  };
}

export const Editor: React.FC<{ hashId: string; getRoomResponse: getRoomResponse }> = ({ hashId, getRoomResponse }) => {
  const [css] = useStyletron();
  const monacoContainerRef = useRef<HTMLDivElement>(null);
  // const  { loading, error, data } = useQuery<getGistResponse>(GET_GIST);

  // console.log('data: ', data);
  useEffect(() => {
    const ydoc = new Doc();
    const provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, YJS_ROOM, ydoc as any);
    const textCRDT = ydoc.getText(hashId);
    // if (data) {
    //   textCRDT.insert(0, data.viewer.gist.files[0].text);
    // }
    const editor = monaco.editor.create(monacoContainerRef.current, {
      language: 'markdown',
    });

    new MonacoBinding(textCRDT, editor.getModel(), new Set([editor]), provider.awareness);
    provider.connect();

    return () => provider.disconnect();
  }, [hashId]);

  return <div className={css({ height: '500px' })} id="monaco-editor-container" ref={monacoContainerRef} />;
};
