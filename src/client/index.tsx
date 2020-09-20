import ReactDOM from 'react-dom';
import React from 'react';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { App } from './App';
import { store, persistor } from './store';

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

ReactDOM.render(
  <ReduxProvider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </ReduxProvider>,
  document.getElementById('root'),
);
