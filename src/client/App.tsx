import { BaseProvider, DarkTheme, LightTheme } from 'baseui';
import { Theme } from 'baseui/theme';
import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';

import { Root } from './components/Root';
import { settingsSelector } from './settings/slice';

const engine = new Styletron();

export function App(): ReactElement {
  const settings = useSelector(settingsSelector);

  let theme: Theme;
  switch (settings.theme) {
    case 'light':
      theme = LightTheme;
      break;
    case 'dark':
      theme = DarkTheme;
      break;
    default:
      theme = LightTheme;
      break;
  }

  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={theme}>
        <Root />
      </BaseProvider>
    </StyletronProvider>
  );
}
