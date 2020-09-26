import React from 'react';
import ReactDOM from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { App } from './App';
import { persistor, store } from './store';

declare global {
  interface Window {
    MonacoEnvironment: any;
    ResizeObserver: any;
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

ReactDOM.render(
  <ReduxProvider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </ReduxProvider>,
  document.getElementById('root'),
);
