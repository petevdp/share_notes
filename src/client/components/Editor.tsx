import React, { useEffect, useState, useRef } from "react";
import {
  CONVERGENCE_SERVICE_URL,
  EDITOR_COLLECTION,
} from "../../shared/environment";

import * as monaco from "monaco-editor";
import {
  RemoteCursorManager,
  RemoteSelectionManager,
  EditorContentManager,
} from "@convergencelabs/monaco-collab-ext";

import {
  Convergence,
  ModelService,
  RealTimeString,
} from "@convergence/convergence";
import { MonacoConvergenceAdapter } from "../editor/monacoConvergenceAdapter";

interface state {
  code: string;
}

interface props {}

window.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === "json") {
      return "./json.worker.js";
    }
    if (label === "css") {
      return "./css.worker.js";
    }
    if (label === "html") {
      return "./html.worker.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.js";
    }
    return "./editor.worker.js";
  },
};

// const defaultEditorContents = "some text";

export function Editor() {
  const containerEltRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const editor = monaco.editor.create(containerEltRef.current, {
      language: "markdown",
    });

    // const displayName = "user-" + Math.ceil(Math.random() * 1000);
    const user = {
      username: "user1",
      password: "password",
    };
    Convergence.connect(CONVERGENCE_SERVICE_URL, user.username, user.password)
      .then((domain) => {
        return domain.models().open("test-editor");
      })
      .then((m) => {
        const stringElement = m.elementAt("contents") as RealTimeString;
        console.log("element id: ", stringElement.id());

        const adapter = new MonacoConvergenceAdapter(editor, stringElement);
        adapter.bind();
      });
  }, []);

  return <div id="monaco-editor-container" ref={containerEltRef} />;
}
