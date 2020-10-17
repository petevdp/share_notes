import { loggedInStatusSelector, LoginStatus } from 'Client/slices/session/types';
import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route, RouteComponentProps, RouteProps } from 'react-router-dom';

interface GuardedRouteProps extends RouteProps {
  Component: React.FC<RouteComponentProps>;
}

export function AuthGuardedRoute({ children, ...rest }: RouteProps) {
  const loginStatus = useSelector(loggedInStatusSelector);
  return <Route {...rest}>{loginStatus !== LoginStatus.NotLoggedIn ? children : <Redirect to="/" />}</Route>;
}
