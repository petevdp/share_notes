const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const CLIENT_ROOT = path.join(SRC, 'client');
const SHARED_ROOT = path.join(SRC, 'shared');
const MONACO_ROOT = 'monaco-editor/esm/vs';
const CLIENT_BUILD_PATH = path.join(ROOT, './bundle');
const SERVER_BUILD_PATH = path.join(ROOT, './dist/server');

module.exports = {
  ROOT,
  SRC,
  CLIENT_ROOT,
  SHARED_ROOT,
  MONACO_ROOT,
  CLIENT_BUILD_PATH,
  SERVER_BUILD_PATH,
};

console.log(module.exports);
