import { Epic } from 'redux-observable';
import { filter, map, concatMap, withLatestFrom } from 'rxjs/operators';
import { fetchSessionGithubDetails, setSessionGithubDetails, logOut, clearSessionData } from './types';
import { Observable } from 'rxjs';
import { GET_VIEWER_GITHUB_DETAILS, getCurrentUserGithubDetailsResponse } from 'Client/queries';
import { getCookie } from 'Client/utils';
import { rootState } from 'Client/store';

export const fetchCurrentUserDetailsEpic: Epic = (action$) => {
  return action$.pipe(
    filter(fetchSessionGithubDetails.match),
    concatMap(async ({ payload: apolloClient }) => {
      console.log('getting details');
      const { data } = await apolloClient.query<getCurrentUserGithubDetailsResponse>({
        query: GET_VIEWER_GITHUB_DETAILS,
      });
      console.log('details: ', data);

      return setSessionGithubDetails(data.viewer);
    }),
  );
};

export const logOutEpic: Epic = (action$) =>
  action$.pipe(
    filter(logOut.match),
    concatMap(async () => {
      await fetch('/auth/logout');
      return clearSessionData();
    }),
  );
