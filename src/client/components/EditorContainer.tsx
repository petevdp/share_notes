import React, { useEffect, useState } from "react";
import MonacoEditor from "react-monaco-editor";
import * as collab from "@convergencelabs/monaco-collab-ext/umd/monaco-collab-ext";

const w = window as any;
w.collab = collab;

interface state {
  code: string;
}

interface props {}

export class EditorContainer extends React.Component<props, state> {
  constructor(props) {
    super(props);
    this.state = {
      code: "// type your code...",
    };
  }
  editorDidMount = (editor, monaco) => {
    editor.focus();
  };
  onChange = (newValue, e) => {
    console.log("onChange", newValue, e);
  };
  render() {
    const { code } = this.state;

    const options = {
      selectOnLineNumbers: true,
    };
    return (
      <div className="bx--grid">
        <div className="">
          <div className="bx--row">
            <MonacoEditor
              width="800"
              height="600"
              language="markdown"
              theme="vs-light"
              value={code}
              options={options}
              onChange={this.onChange}
              editorDidMount={this.editorDidMount}
            />
          </div>
        </div>
      </div>
    );
  }
}
