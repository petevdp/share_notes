// import React, { useEffect, useState, useRef } from 'react';
// import { CONVERGENCE_SERVICE_URL, EDITOR_COLLECTION } from 'Shared/environment';

// import * as monaco from 'monaco-editor';
// import { RemoteCursorManager, RemoteSelectionManager, EditorContentManager } from '@convergencelabs/monaco-collab-ext';

// import { Convergence, ModelService, RealTimeString } from '@convergence/convergence';
// import { MonacoConvergenceAdapter } from '../editor/monacoConvergenceAdapter';
// import { useParams } from 'react-router-dom';
// import { domainState, roomEditorStatusesState, editorAdaptersState, roomModelState } from '../atoms';

// interface state {
//   code: string;
// }

// interface props {}

// // const defaultEditorContents = "some text";
// interface editorProps {
//   editorId: string;
// }

// export function Editor({ editorId }: editorProps) {
//   const containerEltRef = useRef<HTMLDivElement>(null);
//   const [domain] = useRecoilState(domainState);
//   const [roomModel] = useRecoilState(roomModelState);
//   const [editorStatuses] = useRecoilState(roomEditorStatusesState);

//   useEffect(() => {
//     const editor = monaco.editor.create(containerEltRef.current, {
//       language: 'markdown',
//     });
//     domain
//       .models()
//       .open(editorId)
//       .then((model) => {
//         const stringElement = model.elementAt('content') as RealTimeString;

//         const adapter = new MonacoConvergenceAdapter(editor, stringElement);
//         adapter.bind();
//       });
//   }, []);

//   return <div id="monaco-editor-container" ref={containerEltRef} />;
// }
