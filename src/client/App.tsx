import React, { ReactElement } from 'react';
import { BaseProvider, LightTheme, DarkTheme } from 'baseui';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { settingsSelector } from './settings/slice';
import { Theme } from 'baseui/theme';
import { useSelector } from 'react-redux';
import { Root } from './components/Root';

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
