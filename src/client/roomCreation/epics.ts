import {
  GET_CURRENT_USER_GISTS,
  GET_CURRENT_USER_GISTS_COUNT,
  getCurrentUserGistsCountResponse,
  getCurrentUserGistsResponse,
  getCurrentUserGistsVariables,
  gistDetails,
} from 'Client/queries';
import { setCurrentUserData } from 'Client/session/types';
import { getGithubGraphqlClient } from 'Client/utils/utils';
import { Epic } from 'redux-observable';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';

import { roomCreationActions } from './types';

export const initializeRoomCreationEpic: Epic = (action$) =>
  action$.pipe(
    filter(setCurrentUserData.match),
    map(({ payload: data }) => roomCreationActions.initialize(data.githubLogin)),
  );

function getCurrentUsersGists() {
  const client = getGithubGraphqlClient();
  return (
    client
      // get the total number of gists
      .request<getCurrentUserGistsCountResponse, any>(GET_CURRENT_USER_GISTS_COUNT)
      .then((countRes) =>
        // pass the count to a second request to get the right number of gists(might need to add an upper bound here/do multiple requests, but no indication of an upper bound in the docs)
        client.request<getCurrentUserGistsResponse, getCurrentUserGistsVariables>(GET_CURRENT_USER_GISTS, {
          gistCount: countRes.viewer.gists.totalCount,
        }),
      )
      .then((nodesRes) => nodesRes.viewer.gists.nodes)
      .then((gists) => {
        console.log('gists: ', gists);
        return gists.map(
          (g): gistDetails => ({
            ...g,
            files: g.files.reduce(
              (files, file) => ({
                ...files,
                [file.name]: {
                  filename: file.name,
                  content: file.content,
                },
              }),
              {},
            ),
          }),
        );
      })
  );
}

export const openRoomCreationEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(roomCreationActions.roomCreationOpened.match),
    concatMap(async () => {
      // other initialization takss
      const ownedGists = await getCurrentUsersGists();
      return roomCreationActions.setOwnedGists(ownedGists);
    }),
  );
