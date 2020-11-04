import fs from 'fs';
import detect from 'language-detect';
import path from 'path';
import { SERVER_ROOT } from 'Server/paths';

const mappingPromise = new Promise<string>((resolve) => {
  fs.readFile(path.join(SERVER_ROOT, 'generated', 'codemirrorFiletypeMappings.json'), 'utf8', (_, data) =>
    resolve(data),
  );
}).then((d) => JSON.parse(d) as { [filetype: string]: string });

function normalizeDetectedFiletype(filetype: string) {
  return filetype.toLowerCase().split(' ').join('');
}

export async function detectLanguageMode(filename: string) {
  const mapping = await mappingPromise;
  const detectedType = detect.filename(filename);
  if (!detectedType || !mapping[normalizeDetectedFiletype(detectedType)]) {
    return undefined;
  }
  return mapping[normalizeDetectedFiletype(detectedType)];
}
