#!/usr/bin/env node

require('module-alias/register');
const path = require('path');
const { SERVER_ROOT } = require('Server/paths');
const detect = require('language-detect');
const { readdirSync, writeFileSync } = require('fs');

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const modes = new Set(getDirectories('./node_modules/codemirror/mode'));

const directlyMappedModes = [...new Set(Object.values(detect.extensions))]
  .map(normalizeFiletypeMap)
  .filter((ext) => modes.has(ext))
  .reduce((acc, filetype) => ({ ...acc, [filetype]: filetype }), {});

const customMappings = {
  // for html we input some custom settings into codemirror on the client side
  html: 'html',
};

function normalizeFiletypeMap(extMap) {
  return extMap.toLowerCase().split(' ').join('');
}

writeFileSync(
  './src/server/generated/codemirrorFiletypeMappings.json',
  JSON.stringify({ ...directlyMappedModes, ...customMappings }, undefined, 2),
);
