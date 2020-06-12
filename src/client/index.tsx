import ReactDOM from "react-dom";
import React from "react";

import { App } from "./App";
import "./index.scss";

window.MonacoEnvironment = {
  getWorkerUrl: function (_: unknown, label: string) {
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

ReactDOM.render(<App />, document.getElementById("root"));
