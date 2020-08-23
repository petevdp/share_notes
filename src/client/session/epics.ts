import { Epic } from 'redux-observable';
import { GITHUB_0AUTH_URL, GITHUB_CLIENT_ID, AUTH_REDIRECT_URL } from 'Shared/environment';
import { filter, map, tap } from 'rxjs/operators';
import { loginWithGithub } from './slice';

export const loginWithGithubEpic: Epic = (action$, state$) =>
  action$.pipe(
    filter(loginWithGithub.match),
    map(() => {
      console.log('redirecting');
      const url = new URL(GITHUB_0AUTH_URL);
      url.searchParams.set('client_id', GITHUB_CLIENT_ID);
      url.searchParams.set('redirect_url', AUTH_REDIRECT_URL);
      url.searchParams.set('scope', 'gist,read:user');
      console.log(url);
      window.location.href = url.toString();
      return;
    }),
  );
