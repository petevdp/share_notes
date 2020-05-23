import ReactDOM from "react-dom";
import React from "react";

import * as monaco from "monaco-editor";

declare global {
  interface Window {
    MonacoEnvironment: any;
  }
}

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

import { App } from "./App";
import "./index.scss";
ReactDOM.render(<App />, document.getElementById("root"));
