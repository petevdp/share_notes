import React, { useEffect, useState, useRef } from "react";
import * as monaco from "monaco-editor";
import {
  RemoteCursorManager,
  RemoteSelectionManager,
  EditorContentManager,
} from "@convergencelabs/monaco-collab-ext";

interface state {
  code: string;
}

interface props {}

const sourceUser = {
  id: "source",
  label: "Source User",
  color: "orange",
};

const staticUser = {
  id: "static",
  label: "Static User",
  color: "blue",
};

export function Editor() {
  const containerEltRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const editor = monaco.editor.create(containerEltRef.current, {
      value: ["function x() {", '\tconsole.log("Hello world!");', "}"].join(
        "\n"
      ),
      language: "markdown",
    });

    const remoteCursorManager = new RemoteCursorManager({
      editor,
      tooltips: true,
      tooltipDuration: 2,
    });

    const sourceUserCursor = remoteCursorManager.addCursor(
      sourceUser.id,
      sourceUser.color,
      sourceUser.label
    );
    const staticUserCursor = remoteCursorManager.addCursor(
      staticUser.id,
      staticUser.color,
      staticUser.label
    );

    const remoteSelectionManager = new RemoteSelectionManager({ editor });
    remoteSelectionManager.addSelection(
      sourceUser.id,
      sourceUser.color,
      sourceUser.label
    );
    remoteSelectionManager.addSelection(
      staticUser.id,
      staticUser.color,
      staticUser.label
    );

    const targetContentManager = new EditorContentManager({
      editor,
    });

    //
    // Faked other user.
    //
    staticUserCursor.setOffset(50);
    remoteSelectionManager.setSelectionOffsets(staticUser.id, 40, 50);
  }, []);

  return <div id="monaco-editor-container" ref={containerEltRef} />;
}
