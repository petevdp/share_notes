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
import { setSessionToken, sessionSliceState, setUserData } from './session/types';
import { useLazyQuery } from '@apollo/client';
import { GET_CURRENT_USER, getCurrentUserResult } from './queries';

export function App(): ReactElement {
  const dispatch = useDispatch();
  const session = useSelector<rootState, sessionSliceState>((state) => state.session);
  const [getCurrentUser, { data: currentUserData }] = useLazyQuery<getCurrentUserResult>(GET_CURRENT_USER);
  useEffect(() => {
    const tokenCookie = getCookie(SESSION_TOKEN_COOKIE_KEY);
    if (!session.token && tokenCookie) {
      dispatch(setSessionToken(tokenCookie));
    }
  }, []);

  useEffect(() => {
    if (session.token && !session.user) {
      if (!currentUserData) {
        getCurrentUser();
      } else {
        dispatch(setUserData(currentUserData.currentUser));
      }
    }
  }, [session, currentUserData]);
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
