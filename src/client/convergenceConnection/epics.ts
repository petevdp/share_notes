import { Epic } from 'redux-observable';
import { filter, concatMap, map } from 'rxjs/operators';
import { attemptConnection, connectionEstablished } from './slice';
import Convergence from '@convergence/convergence';
import { CONVERGENCE_SERVICE_URL } from 'Shared/environment';

export const attemptConnectionEpic: Epic = (actions$) => {
  return actions$.pipe(
    filter(attemptConnection.match),
    concatMap(({ payload }) => {
      const { username, password } = payload.userCredentials;
      return Convergence.connect(CONVERGENCE_SERVICE_URL, username, password);
    }),
    map((domain) => connectionEstablished(domain)),
  );
};
