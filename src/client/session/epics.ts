import { Epic } from 'redux-observable';
import { Observable } from 'rxjs';
import { rootState } from 'Client/store';
import { GITHUB_0AUTH_URL, GITHUB_CLIENT_ID } from 'Shared/environment';
import { filter, map, tap } from 'rxjs/operators';
import { loginWithGithub } from './slice';

export const loginWithGithubEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(loginWithGithub.match),
    map(() => {
      const url = new URL(GITHUB_0AUTH_URL);
      url.searchParams.set('client_id', GITHUB_CLIENT_ID);
      url.searchParams.set('redirect_url', 'http://localhost:1236');
      url.searchParams.set('scope', 'gist,read:user');
      console.log(url);
      window.location.href = url.toString();
      return;
    }),
  );
