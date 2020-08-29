import path from 'path';
// non-sensitive environment configuration
export const CONVERGENCE_SERVICE_URL = `http://localhost:8000/api/realtime/convergence/default`;
export const EDITOR_COLLECTION = 'editor-collection';
export const ROOM_COLLECTION = 'room-collection';
export const GITHUB_0AUTH_URL = 'https://github.com/login/oauth/authorize';
export const GITHUB_0AUTH_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
export const GITHUB_GRAPHQL_API_URL = 'https://api.github.com/graphql';

export const DEV_SERVER_PORT = 1234;
export const API_PORT = 1236;

export const API_URL = `http://localhost:${API_PORT}`;
export const AUTH_REDIRECT_URL = `http://localhost:${API_PORT}/auth`;

// export const YJS_WEBSOCKET_URL_WS = `ws://localhost:1237`;
export const YJS_WEBSOCKET_URL_WS = `ws://localhost:1236/socket`;

export const YJS_ROOM = 'yjs-room';
export const GRAPHQL_URL = `${API_URL}/graphql`;
export const GITHUB_CLIENT_ID = 'f95d66e4ad46b486f7a0';
export const SESSION_TOKEN_COOKIE_KEY = 'session-token';
