import findUp from 'find-up';
import path from 'path';

export const PROJECT_ROOT_NAME = 'share_notes';
export const ROOT = path.resolve(
  path.basename(process.cwd()) === PROJECT_ROOT_NAME ? '.' : (findUp.sync(PROJECT_ROOT_NAME) as string),
);
export const SRC = path.join(ROOT, 'src');
export const DIST = path.join(ROOT, 'dist');
export const SERVER_ROOT = path.join(SRC, 'server');
export const CLIENT_ROOT = path.join(SRC, 'client');
export const SHARED_ROOT = path.join(SRC, 'shared');
export const CLIENT_BUILD_PATH_DEV = path.join(ROOT, 'bundleDev');
export const CLIENT_BUILD_PATH_PROD = path.join(ROOT, 'bundleProd');
export const SERVER_BUILD_PATH = path.join(ROOT, './dist/src');
export const CREATED_GISTS_LOG = path.join(ROOT, './logs/createdGists.log');

export const ENV_FILE = path.join(ROOT, '.env');
