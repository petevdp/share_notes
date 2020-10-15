import { BaseProvider, createTheme, DarkTheme, LightTheme, lightThemePrimitives } from 'baseui';
import { SnackbarProvider } from 'baseui/snackbar';
import { Sizing, Theme } from 'baseui/theme';
import React, { ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { DebugEngine, Provider as StyletronProvider } from 'styletron-react';

import { Root } from './components/Root';
import { settingsSelector } from './settings/types';
import { styletronEngine } from './styletronEngine';

const debug = process.env.NODE_ENV === 'production' ? void 0 : new DebugEngine();
/**
 * Setup Baseui and styletron
 */
export function App(): ReactElement {
  const settings = useSelector(settingsSelector);

  const lightTheme = useMemo(() => {
    const sizing: Sizing = {
      ...LightTheme.sizing,
      scale2400: '1px',
    };
    return createTheme({}, { sizing });
  }, []);

  let theme: Theme;
  switch (settings.theme) {
    case 'light':
      theme = lightTheme;
      break;
    case 'dark':
      theme = DarkTheme;
      break;
    default:
      theme = LightTheme;
      break;
  }

  return (
    <StyletronProvider value={styletronEngine} debug={debug}>
      <BaseProvider theme={theme}>
        <SnackbarProvider>
          <Root />
        </SnackbarProvider>
      </BaseProvider>
    </StyletronProvider>
  );
}
