import { createAction } from '@reduxjs/toolkit';
import { ConvergenceDomain } from '@convergence/convergence';
import { userCredentials } from './state';

// try to connect to the convergence server
export const attemptConnection = createAction('attemptConnection', (userCredentials: userCredentials) => {
  return {
    payload: {
      userCredentials,
    },
  };
});

// we connected to the convergence server
export const connectionEstablished = createAction('connectionEstablished', (domain: ConvergenceDomain) => ({
  payload: domain,
}));
