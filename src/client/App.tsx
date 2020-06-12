import React, { useEffect } from "react";
import "./app.scss";
import { RecoilRoot } from "recoil";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Editor } from "./components/Editor";
import { GlobalHeader } from "./components/GlobalHeader";
import { Home } from "./components/Home";
import { Room } from "./components/Room";
9;

export function App() {
  return (
    <RecoilRoot>
      <Router>
        <div className="container">
          <GlobalHeader />
          <div className="main-page">
            <Switch>
              <Route exact path="/">
                <Home />
              </Route>
              <Route path="/rooms">
                <Room />
              </Route>
            </Switch>
          </div>
        </div>
      </Router>
    </RecoilRoot>
  );
}
