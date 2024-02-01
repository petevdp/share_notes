export const ROOM_COLLECTION = 'room-collection';
export const GITHUB_0AUTH_URL = 'https://github.com/login/oauth/authorize';
export const GITHUB_0AUTH_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
export const GITHUB_GRAPHQL_API_URL = 'https://api.github.com/graphql';

export const DEV_SERVER_PORT = 1234;
export const PORT = process.env.NODE_ENV === 'development' ? 1234 : 1236;
export const API_PORT = 1236;
export const DOMAIN = ``;
export const AUTH_REDIRECT_URL = `/api/auth`;

export const getYjsDocNameForRoom = (roomHashId: string) => `yjs-room/${roomHashId}`;
export const GRAPHQL_URL = `/api/graphql`;
export const GITHUB_CLIENT_ID = 'f95d66e4ad46b486f7a0';
export const SESSION_TOKEN_COOKIE_KEY = 'session-token';
