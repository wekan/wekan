'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const support = process.env.WEKAN_SOURCE_MAP_SUPPORT || require.resolve('source-map-support');

function fixture(t, map) {
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(root, '.tools/tmp'), 'server-maps-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const server = path.join(tmp, 'programs/server');
  fs.mkdirSync(path.join(server, 'app'), { recursive: true });
  fs.writeFileSync(path.join(server, 'program.json'), JSON.stringify({ load: [{ path: 'app/test.js' }] }));
  const file = path.join(server, 'app/test.js');
  fs.writeFileSync(file, '(function () {\nthrow new Error("mapped");\n})\n//# sourceURL=meteor://app/app/test.js\n//# sourceMappingURL=data:application/json;charset=utf8;base64,' + Buffer.from(JSON.stringify(map)).toString('base64') + '\n');
  return { tmp, server, file };
}

function trace(server) {
  const script = `
    const fs = require('fs'); const vm = require('vm');
    const original = fs.readFileSync; let mapReads = 0;
    fs.readFileSync = function(file, ...args) {
      if (String(file).endsWith('.runtime-source-map.json')) mapReads++;
      return original.call(this, file, ...args);
    };
    require(${JSON.stringify(support)}).install({ handleUncaughtExceptions: false });
    const fn = vm.runInThisContext(fs.readFileSync('app/test.js', 'utf8'), { filename: 'app/test.js' });
    if (mapReads) throw Error('eager map read');
    let stack;
    try { fn(); } catch (e) { stack = e.stack; }
    console.log(JSON.stringify({ stack, mapReads }));
  `;
  const result = spawnSync(process.execPath, ['-e', script], { cwd: server, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('external map preserves mapped stack, loads lazily, and survives repeated trimming', async t => {
  const { externalizeServerSourceMaps } = await import('../releases/externalize-server-source-maps.mjs');
  // Generated line 2 maps to source line 42; first line has no mapping.
  const map = { version: 3, sources: ['original.ts'], names: [], mappings: ';AAyCA', sourcesContent: ['source text'] };
  const { tmp, server, file } = fixture(t, map);
  const before = trace(server);
  assert.match(before.stack, /original\.ts:42:1/);
  fs.chmodSync(file, 0o444);
  assert.equal(externalizeServerSourceMaps(tmp).count, 1);
  assert.equal(fs.statSync(file).mode & 0o777, 0o444);
  const after = trace(server);
  assert.equal(after.stack, before.stack);
  assert.equal(after.mapReads, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(file + '.runtime-source-map.json')), map);
  assert.equal(externalizeServerSourceMaps(tmp).count, 0);
  const result = spawnSync(process.execPath, [path.join(root, 'releases/bundle-trim.mjs'), tmp], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(trace(server).stack, before.stack);
});

test('invalid maps fail before changing the script', async t => {
  const { externalizeServerSourceMaps } = await import('../releases/externalize-server-source-maps.mjs');
  const { tmp, file } = fixture(t, { version: 2 });
  const before = fs.readFileSync(file);
  assert.throws(() => externalizeServerSourceMaps(tmp), /Invalid inline source map/);
  assert.deepEqual(fs.readFileSync(file), before);
  assert.equal(fs.existsSync(file + '.runtime-source-map.json'), false);
});

test('scripts without inline maps and client files remain untouched', async t => {
  const { externalizeServerSourceMaps } = await import('../releases/externalize-server-source-maps.mjs');
  const { tmp, file } = fixture(t, { version: 3, mappings: '', sources: [], names: [] });
  const client = path.join(tmp, 'programs/client.js');
  const inline = fs.readFileSync(file);
  fs.writeFileSync(client, inline);
  fs.writeFileSync(file, 'console.log("plain");\n//# sourceMappingURL=existing.map\n');
  const before = fs.readFileSync(file);
  assert.equal(externalizeServerSourceMaps(tmp).count, 0);
  assert.deepEqual(fs.readFileSync(file), before);
  assert.deepEqual(fs.readFileSync(client), inline);
});
