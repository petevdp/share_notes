import fs from 'fs';
import path from 'path';
import { ROOT } from 'Server/paths';

export function writeGeneratedConfig(config: any, name: string) {
  const generatedOutPath = path.join(ROOT, `webpack/generated/{name}.json`);

  fs.writeFile(generatedOutPath, JSON.stringify(config, undefined, 2), {}, () =>
    console.log(`generated config for ${name}: `, generatedOutPath),
  );
}
