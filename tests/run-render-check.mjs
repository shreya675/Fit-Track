import { build } from 'esbuild';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const output = join(tmpdir(), 'fittrack-render-check.cjs');
await build({ entryPoints: ['tests/render-check.jsx'], outfile: output, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', define: { 'import.meta.env': '{}' }, logLevel: 'warning' });
await import(pathToFileURL(output).href);
