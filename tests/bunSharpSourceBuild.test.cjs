'use strict';
// Exercise the Android Sharp build with offline npm packages and a compiler
// fixture. Actual Bionic compilation remains the Android workflow's job.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(root, '.tools/tmp/bun-sharp-test-'));
const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
};
try {
  const server = path.join(tmp, 'server');
  const sharp = path.join(server, 'npm/node_modules/sharp');
  const api = path.join(tmp, 'addon-api');
  const gyp = path.join(tmp, 'gyp');
  write(path.join(api, 'package.json'), { name: 'node-addon-api', version: '8.9.2' });
  write(path.join(gyp, 'package.json'), { name: 'node-gyp', version: '12.4.0' });
  write(path.join(gyp, 'bin/node-gyp.js'), `const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
assert.equal(process.env.SHARP_FORCE_GLOBAL_LIBVIPS, '1');
assert(process.argv.includes('rebuild'));
assert(process.argv.includes('--arch=' + process.arch));
const dir = process.argv.find(x => x.startsWith('--directory=')).slice(12);
assert.equal(path.basename(dir), 'src');
assert(!fs.existsSync(path.join(dir, 'build/stale-linux.node')));
assert(fs.existsSync('node_modules/node-addon-api/package.json'));
if (process.env.TEST_BUILD_FAIL) process.exit(7);
fs.writeFileSync(path.join(dir, 'built'), 'target build');
`);
  write(path.join(server, 'package.json'), { name: 'bundle', version: '1.0.0', dependencies: { 'node-gyp': `file:${gyp}` } });
  write(path.join(sharp, 'package.json'), { name: 'sharp', version: '0.35.5', devDependencies: { 'node-addon-api': `file:${api}` } });
  write(path.join(sharp, 'src/build/stale-linux.node'), 'wrong platform');
  const test = path.join(tmp, 'build.mjs');
  write(test, `import { buildSharpFromSource } from ${JSON.stringify(pathToFileURL(path.join(root, 'releases/bun/rebuild.mjs')).href)};
buildSharpFromSource(${JSON.stringify(sharp)}, ${JSON.stringify(server)}, process.platform === 'win32' ? 'npm.cmd' : 'npm');
`);
  const env = { ...process.env, npm_config_offline: 'true', npm_config_audit: 'false',
    npm_config_fund: 'false', npm_config_cache: path.join(tmp, 'cache'),
    PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH };
  const build = extra => spawnSync(process.execPath, [test], { cwd: root, env: { ...env, ...extra }, encoding: 'utf8', timeout: 20000 });
  const ok = build({});
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert(fs.existsSync(path.join(sharp, 'src/built')));
  fs.unlinkSync(path.join(sharp, 'src/built'));
  const failed = build({ TEST_BUILD_FAIL: '1' });
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /failed: 7/);
  assert(!fs.existsSync(path.join(sharp, 'src/built')));
  write(path.join(sharp, 'package.json'), { name: 'sharp', version: '0.35.5' });
  assert.match(build({}).stderr, /does not declare node-addon-api/);
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/bun.yml'), 'utf8');
  assert.match(workflow, /apt-get install -y .*libvips/);
  const rebuild = fs.readFileSync(path.join(root, 'releases/bun/rebuild.mjs'), 'utf8');
  assert.match(rebuild, /name === 'sharp' && process.platform === 'android'/);
  console.log('Sharp source build installs declared headers, clears stale output and preserves compiler failures.');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
