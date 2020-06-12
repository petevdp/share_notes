import React from "react";

import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from "carbon-components-react/lib/components/UIShell";
import { Link } from "react-router-dom";

export function GlobalHeader() {
  return (
    <Header aria-label="App Name">
      <HeaderName href="/" prefix="">
        Share Notes
      </HeaderName>
      <HeaderGlobalBar>
        <HeaderGlobalAction aria-label="App switcher" onClick={() => {}}>
          idk something
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
}
