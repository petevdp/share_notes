import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import React, { ReactElement } from 'react';
import { Block } from 'baseui/block';
import { useStyletron, styled } from 'baseui';
import { GlobalHeader } from './GlobalHeader';
import { Home } from './Home';
import { Room } from './Room';
import { CreateRoomModal } from './CreateRoomModal';
import { useSelector } from 'react-redux';
import { isLoggedInSelector } from 'Client/session/slice';

export function Root(): ReactElement {
  const [css, theme] = useStyletron();
  const isLoggedIn = useSelector(isLoggedInSelector);
  return (
    <Router>
      <div>
        <GlobalHeader />
        <Block backgroundColor="backgroundPrimary" color="contentPrimary" display="flex" justifyContent="center">
          <div
            className={css({
              marginTop: '72px',
              backgroundColor: theme.colors.backgroundPrimary,
              color: theme.colors.contentPrimary,
            })}
          >
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
          </div>
          {isLoggedIn && <CreateRoomModal />}
        </Block>
      </div>
    </Router>
  );
}
