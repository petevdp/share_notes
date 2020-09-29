import './styles.css';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { App } from './App';
import { persistor, store } from './store';

declare global {
  interface Window {
    ResizeObserver: any;
  }
}

process.env.NODE_ENV === 'development' && console.log('env: development');

ReactDOM.render(
  <ReduxProvider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </ReduxProvider>,
  document.getElementById('root'),
);
