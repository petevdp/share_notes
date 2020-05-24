import ReactDOM from "react-dom";
import React from "react";
import * as monaco from "monaco-editor";

declare global {
  interface Window {
    MonacoEnvironment: any;
  }
}

import { App } from "./App";
import "./index.scss";
ReactDOM.render(<App />, document.getElementById("root"));
