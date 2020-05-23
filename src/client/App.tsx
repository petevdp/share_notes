import React from "react";
import "./app.scss";

import { Editor } from "./components/Editor";
import { GlobalHeader } from "./components/GlobalHeader";

export function App() {
  return (
    <div className="container">
      <GlobalHeader />
      <div className="main-page">
        <Editor />
      </div>
    </div>
  );
}
