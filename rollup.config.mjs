import path from 'node:path';
import fs from 'node:fs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import license from 'rollup-plugin-license';

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
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript(),
      license({
        sourcemap: true,
        banner: {
          commentStyle: 'regular',
          content: [
            'Third-party licenses:',
            '<% _.forEach(dependencies, (dep) => { %>',
            '  <%= dep.name %>@<%= dep.version %> (<%= dep.license %>)',
            '  <% if (dep.author) { %> Author: <%= typeof dep.author === "string" ? dep.author : dep.author.name %><% } %>',
            '  <% if (dep.licenseText) { %><%= dep.licenseText %><% } %>',
            '<% }) %>',
          ].join('\n'),
        },
        thirdParty: {
          includePrivate: true,
          multipleVersions: true,
        },
      }),
    ],
    external: ['ps88web'],
  };
});

export default configs;
