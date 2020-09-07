import React, { useEffect, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import { YJS_WEBSOCKET_URL_WS, YJS_ROOM } from 'Shared/environment';
import { CodemirrorBinding } from 'y-codemirror';
import { Doc as YDoc } from 'yjs';
import { useStyletron } from 'styletron-react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import { Button } from 'baseui/button';

export const EditorSwap: React.FC = () => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [doc] = useState(() => new YDoc());
  const [editor, setEditor] = useState<CodeMirror.Editor | undefined>();
  const [binding, setBinding] = useState<CodemirrorBinding | undefined>();
  const [bindingCount, setBindingCount] = useState(1);
  const [provider, setProvider] = useState<WebsocketProvider | undefined>();
  const [switchBindingNum, setSwitchBindingNum] = useState('');
  const [css] = useStyletron();
  useEffect(() => {
    const typeName = `type_${bindingCount}`;
    const type = doc.getText(typeName);
    type.insert(0, typeName);
    const editor = CodeMirror(editorContainerRef.current, { theme: 'ambiance', mode: 'markdown', readOnly: false });
    const provider = new WebsocketProvider(YJS_WEBSOCKET_URL_WS, YJS_ROOM, doc as any);
    const binding = new CodemirrorBinding(type, editor, provider.awareness);
    setBinding(binding);
    setEditor(editor);
    setProvider(provider);
    return () => {
      binding?.destroy();
    };
  }, []);

  const addBinding = () => {
    if (!provider) {
      throw 'provider not defined';
    }
    const typeName = `type_${bindingCount}`;
    const type = doc.getText(typeName);
    type.insert(0, typeName);
    binding.destroy();
    const newBinding = new CodemirrorBinding(type, editor, provider.awareness);
    setBinding(newBinding);
    setBindingCount(bindingCount + 1);
  };

  const switchBinding = () => {
    const typeName = `type_${switchBindingNum}`;
    const type = doc.getText(typeName);
    binding.destroy();
    const newBinding = new CodemirrorBinding(type, editor, provider.awareness);
    setBinding(newBinding);
    setBindingCount(Number(switchBindingNum));
    setSwitchBindingNum('');
  };

  return (
    <>
      <div>
        <Button onClick={addBinding}>Add</Button>
        <Button onClick={switchBinding}>Switch</Button>
        <input value={switchBindingNum} onChange={(e) => setSwitchBindingNum(e.target.value)} />
      </div>
      <span>binding</span> {bindingCount}
      <div className={css({ height: '500px', width: '1000px' })} ref={editorContainerRef} />
    </>
  );
};
