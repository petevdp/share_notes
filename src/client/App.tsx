import React, { ReactElement } from 'react';

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { GlobalHeader } from './components/GlobalHeader';
import { Home } from './components/Home';
import { Room } from './components/Room';
import { useStyletron } from 'styletron-react';

export function App(): ReactElement {
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
