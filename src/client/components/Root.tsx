import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { Layer } from 'baseui/layer';
import { isLoggedInWithGithubSelector } from 'Client/session/slice';
import { rootState } from 'Client/store';
import React, { ReactElement, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Switch, useHistory, useLocation } from 'react-router-dom';

import { CreateRoom } from './CreateRoom';
import { GlobalHeader } from './GlobalHeader';
import { Home } from './Home';
import { Room } from './Room';

export function Root(): ReactElement {
  const [] = useStyletron();
  // const isLoggedIn = useSelector(isLoggedInWithGithubSelector);
  const history = useHistory();
  useEffect(() => {
    console.log('history: ', history);
  }, [history]);
  return (
    <Router>
      <Layer index={1}>
        <Block
          backgroundColor="backgroundPrimary"
          color="contentPrimary"
          display="flex"
          // justifyContent="start"
          // alignContent="center"
          // alignItems="center"
          flexDirection="column"
          width="100%"
          minHeight="100vh"
        >
          <GlobalHeader />
          <Routes />
          {/* <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route exact path="/rooms"></Route>
            <Route exact path="/rooms/create">
              <CreateRoom />
            </Route>
            <Route path="/rooms/:roomHashId">
              <Room />
            </Route>
          </Switch> */}
        </Block>
      </Layer>
    </Router>
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
        <Home />
      </Route>
      <Route exact path="/rooms"></Route>
      <Route exact path="/rooms/new">
        <CreateRoom />
      </Route>
      <Route path="/rooms/:roomHashId">
        <Room />
      </Route>
    </Switch>
  );
}
