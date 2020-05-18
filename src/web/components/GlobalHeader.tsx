import React from "react";

import AppSwitcher20 from "@carbon/icons-react/lib/app-switcher/20";
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from "carbon-components-react/lib/components/UIShell";

export function GlobalHeader() {
  return (
    <Header aria-label="App Name">
      <HeaderName href="@" prefix="share_notes">
        Share Notes
      </HeaderName>
      <HeaderGlobalBar>
        <HeaderGlobalAction aria-label="App switcher" onClick={() => {}}>
          <AppSwitcher20></AppSwitcher20>
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
}
