import { BaseProvider, createTheme, DarkTheme, LightTheme, useStyletron } from 'baseui';
import { Layer } from 'baseui/layer';
import { PLACEMENT, SnackbarProvider } from 'baseui/snackbar';
import { Sizing, Theme } from 'baseui/theme';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { rootState } from 'Client/store';
import React, { ReactElement, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { DebugEngine, Provider as StyletronProvider } from 'styletron-react';

import { AuthGuardedRoute } from './components/AuthGuard';
import { RoomCreation } from './components/CreateRoom';
import { Home } from './components/Home';
import { LandingPage } from './components/LandingPage';
import { NavBar } from './components/NavBar';
import { Room } from './components/Room';
import { settingsSelector } from './slices/settings/types';
import { persistor, store } from './store';
import { styletronEngine } from './styletronEngine';

export function App(): ReactElement {
  return (
    <StoreProvider>
      <StylingProvider>
        <Router>
          <Background>
            <NavBar />
            <Routes />
          </Background>
        </Router>
      </StylingProvider>
    </StoreProvider>
  );
}

const debug = process.env.NODE_ENV === 'development' ? new DebugEngine() : void 0;
/**
 * Setup Redux store and persistor
 */
function StoreProvider({ children }: React.Props<unknown>) {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </ReduxProvider>
  );
}

/**
 * Setup Baseui and styletron
 */
function StylingProvider({ children }: React.Props<unknown>): ReactElement {
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
        <SnackbarProvider placement={PLACEMENT.bottomRight}>{children}</SnackbarProvider>
      </BaseProvider>
    </StyletronProvider>
  );
}

function Routes() {
  const history = useLocation();
  const currentRoomName = useSelector((rootState: rootState) => rootState.room.currentRoom?.roomDetails?.name);
  useEffect(() => {
    if (history.pathname === '/rooms/new') {
      document.title = 'Share Notes - New Room';
    } else if (/\/rooms\/.+/.test(history.pathname) && currentRoomName) {
      document.title = 'Share Notes - ' + currentRoomName;
    } else {
      document.title = 'Share Notes';
    }
  }, [history, currentRoomName]);

  return (
    <Switch>
      <Route exact path="/">
        <LandingPage />
      </Route>
      <AuthGuardedRoute exact path="/rooms">
        <Home />
      </AuthGuardedRoute>
      <AuthGuardedRoute exact path="/rooms/new">
        <RoomCreation />
      </AuthGuardedRoute>
      <Route path="/rooms/:roomHashId">
        <Room />
      </Route>
    </Switch>
  );
}

/**
 * Background styles and baseui layer for main app content.
 */
function Background({ children }: React.Props<unknown>) {
  const [css, theme] = useStyletron();
  return (
    <Layer index={1}>
      <div
        className={css({
          backgroundColor: theme.colors.backgroundPrimary,
          display: 'flex',
          flexDirection: 'column',
          width: '100vw',
          minHeight: '100vh',
        })}
      >
        {children}
      </div>
    </Layer>
  );
}
