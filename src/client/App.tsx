import React from "react";
import "./app.scss";

import { EditorContainer } from "./components/EditorContainer";
import { GlobalHeader } from "./components/GlobalHeader";

export function App() {
  return (
    <div className="container">
      <GlobalHeader />
      <div className="main-page">
        <EditorContainer />
      </div>
    </div>
  );
}
