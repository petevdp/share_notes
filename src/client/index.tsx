import ReactDOM from 'react-dom';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider, LightTheme } from 'baseui';

import { App } from './App';
import { store } from './store';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { GRAPHQL_URL } from 'Shared/environment';

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

const engine = new Styletron();
export const apolloClient = new ApolloClient({
  uri: GRAPHQL_URL,
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
