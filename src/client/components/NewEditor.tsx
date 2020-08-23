import React, { useEffect, useRef } from 'react';
import { useStyletron } from 'baseui';
import { useYjsEditor } from 'Client/editor/useYjsEditor';

export const Editor: React.FC = () => {
  const [css] = useStyletron();
  const editorContainerRef = useYjsEditor();
  return <div className={css({ height: '500px' })} id="monaco-editor-container" ref={editorContainerRef} />;
};
