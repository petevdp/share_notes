import ReactDOM from 'react-dom';
import React, { forwardRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider, LightTheme } from 'baseui';

import { App } from './App';
import { store } from './store';
import { ApolloProvider, ApolloClient, InMemoryCache, ApolloLink, HttpLink, from } from '@apollo/client';
import Cookies from 'js-cookie';
import { getMainDefinition } from 'apollo-utilities';
import { GRAPHQL_URL, GITHUB_GRAPHQL_API_URL, SESSION_TOKEN_COOKIE_KEY } from 'Shared/environment';

declare global {
  interface Window {
    MonacoEnvironment: any;
  }
}

window.MonacoEnvironment = {
  getWorkerUrl: function (_: unknown, label: string) {
    if (label === 'json') {
      return '/json.worker.js';
    }
    if (label === 'css') {
      return '/css.worker.js';
    }
    if (label === 'html') {
      return '/html.worker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return '/ts.worker.js';
    }
    return '/editor.worker.js';
  },
};

// link setting github authorization header
const githubAuthLink = new ApolloLink((operation, forward) => {
  const token = Cookies.get(SESSION_TOKEN_COOKIE_KEY);
  console.log('pls');
  operation.setContext(({ headers }: any) => ({
    headers: {
      Authorization: `bearer ${token}`,
      ...headers,
    },
  }));

  operation.query;

  return forward(operation);
});

// graqhql setup allowing requests to multiple servers defined by linkByDirective
const allowedQueryPrefixes = ['github', 'default'] as const;
type QueryPrefix = typeof allowedQueryPrefixes[number];
const linkByPrefix: Record<QueryPrefix | 'default', ApolloLink> = {
  default: new HttpLink({ uri: GRAPHQL_URL }),
  github: from([
    githubAuthLink,
    new HttpLink({
      uri: GITHUB_GRAPHQL_API_URL,
      headers: { Authorization: `bearer ${Cookies.get(SESSION_TOKEN_COOKIE_KEY)}` },
    }),
  ]),
};

const link = new ApolloLink((operation) => {
  const { query } = operation;

  const definition = getMainDefinition(query);
  const name = allowedQueryPrefixes.find((v) => definition.name.value.includes(v + '__')) || 'default';

  return linkByPrefix[name].request(operation);
});

const engine = new Styletron();
export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <ApolloProvider client={apolloClient}>
    <ReduxProvider store={store}>
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <App />
        </BaseProvider>
      </StyletronProvider>
    </ReduxProvider>
  </ApolloProvider>,
  document.getElementById('root'),
);
