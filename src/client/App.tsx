import React, { useEffect, ReactElement } from 'react';

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { GlobalHeader } from './components/GlobalHeader';
import { SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';
import { Home } from './components/Home';
import { Room } from './components/Room';
import { useDispatch, useSelector } from 'react-redux';
import { useStyletron } from 'styletron-react';
import { rootState } from './store';
import { getCookie } from './utils';
import { setSessionToken } from './session/slice';

export function App(): ReactElement {
  const dispatch = useDispatch();
  const sessionToken = useSelector<rootState>((state) => state.session.token);
  useEffect(() => {
    const tokenCookie = getCookie(SESSION_TOKEN_COOKIE_KEY);
    if (!sessionToken && tokenCookie) {
      dispatch(setSessionToken(tokenCookie));
    }
  });
  const [css] = useStyletron();

  return (
    <Router>
      <div className="container">
        <GlobalHeader />
        <div className={css({ marginTop: '72px' })}>
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route exact path="/rooms"></Route>
            <Route path="/rooms/:roomHashId">
              <Room />
            </Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
}
