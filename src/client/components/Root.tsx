import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { Layer } from 'baseui/layer';
import { isLoggedInWithGithubSelector } from 'Client/session/slice';
import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { CreateRoomModal } from './CreateRoomModal';
import { GlobalHeader } from './GlobalHeader';
import { Home } from './Home';
import { Room } from './Room';

export function Root(): ReactElement {
  const [] = useStyletron();
  const isLoggedIn = useSelector(isLoggedInWithGithubSelector);
  return (
    <Router>
      <Layer index={1}>
        <Block
          backgroundColor="backgroundPrimary"
          color="contentPrimary"
          display="flex"
          justifyContent="start"
          alignContent="center"
          alignItems="center"
          flexDirection="column"
          width="100vw"
          minHeight="100vh"
        >
          <GlobalHeader />
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route exact path="/rooms"></Route>
            <Route exact path="/rooms/create"></Route>
            <Route path="/rooms/:roomHashId">
              <Room />
            </Route>
          </Switch>
          {isLoggedIn && <CreateRoomModal />}
        </Block>
      </Layer>
    </Router>
  );
}
