import path from 'node:path';
import fs from 'node:fs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const entries = fs.readdirSync('./src').filter(filename => /\.ts$/.test(filename));
const configs = entries.map((filename) => {
  const basename = path.basename(filename, path.extname(filename)); // ex) src/foo.ts -> foo
  return {
    input: `src/${basename}.ts`,
    output: {
      file: `dist/${basename}.js`,
      format: 'esm',
      //sourcemap: 'inline',
    },
    plugins: [nodeResolve(), typescript()],
    external: ['ps88web'],
  };
});

export default configs;
