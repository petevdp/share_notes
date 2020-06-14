import React, { useEffect } from "react";
import "./app.scss";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { GlobalHeader } from "./components/GlobalHeader";
import { Home } from "./components/Home";
import { Room } from "./components/Room";
import { store, attemptConnection } from "./store";
import { useDispatch } from "react-redux";

export function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      attemptConnection({
        username: "user",
        password: "password",
      })
    );
  });
  return (
    <Router>
      <div className="container">
        <GlobalHeader />
        <div className="main-page">
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route exact path="/rooms"></Route>
            <Route path="/rooms/:roomId">
              <Room />
            </Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
}
