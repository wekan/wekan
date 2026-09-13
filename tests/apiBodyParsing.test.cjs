'use strict';

// Rspack 2's dev server stopped installing Express/body-parser transitively.
// Exercise the real middleware with Meteor's existing Express implementation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const http = require('node:http');
const { gzipSync } = require('node:zlib');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'server/apiMiddleware.js'), 'utf8');

function install(WebApp) {
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, console, process: { env: { WITH_API: 'true' } },
    require(name) {
      if (name === 'meteor/webapp') return { WebApp };
      if (name === 'meteor/meteor') return { Meteor: { users: { async findOneAsync() { return null; } } } };
      if (name === 'meteor/accounts-base') return { Accounts: { _hashLoginToken: token => token } };
      if (name === '/server/lib/apiResponseHelpers') return { safeJsonStringify: JSON.stringify };
      if (name === '/server/lib/apiUsageLog') return { apiUsageMiddleware: (_req, _res, next) => next() };
      throw Object.assign(new Error(`Undeclared dependency: ${name}`), { code: 'MODULE_NOT_FOUND' });
    },
  }, { filename: 'server/apiMiddleware.js' });
}

let express;
try { express = require('express'); } catch (_) {
  const version = fs.readFileSync(path.join(root, '.meteor/versions'), 'utf8').match(/^webapp@(.+)$/m)?.[1];
  const warehouses = [process.env.METEOR_WAREHOUSE_DIR, path.join(root, '.tools/.meteor'), path.join(os.homedir(), '.meteor')].filter(Boolean);
  for (const warehouse of warehouses) {
    try { express = require(path.join(warehouse, 'packages/webapp', version, 'npm/node_modules/express')); break; } catch (_) { /* Try the next installed Meteor warehouse. */ }
  }
}

test('API parsers load without any app-level body-parser dependency', () => {
  const calls = [];
  install({
    express: {
      urlencoded(options) { calls.push(['urlencoded', JSON.parse(JSON.stringify(options))]); return 'urlencoded'; },
      json(options) { calls.push(['json', JSON.parse(JSON.stringify(options))]); return 'json'; },
    },
    handlers: { use() {} },
  });
  assert.deepEqual(calls, [['urlencoded', { limit: '50mb', extended: false }], ['json', { limit: '50mb' }]]);
  assert.doesNotMatch(source, /require\(['"]body-parser['"]\)/);
});

async function withServer(run) {
  const app = express();
  let calls = 0;
  install({ express, handlers: app });
  app.post('/_parser-test', (req, res) => { calls++; res.json({ body: req.body ?? null, token: req.authToken ?? null }); });
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.type }));
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}/_parser-test`, () => calls); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
const integration = { skip: !express && 'Install the selected Meteor webapp package to run real HTTP parser checks.' };

test('JSON bodies retain Unicode, nested values, bearer tokens and the 50MB allowance', integration, async () => {
  await withServer(async url => {
    const body = { title: 'Päivmär', nested: { list: ['one', 'two'], text: 'x'.repeat(1024 * 1024) } };
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer TOKEN' }, body: JSON.stringify(body) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { body, token: 'TOKEN' });
  });
});

test('URL-encoded bodies keep simple parsing and percent-encoded characters', integration, async () => {
  await withServer(async url => {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'title=P%C3%A4ivm%C3%A4r&value=A%26B&value=C&nested%5Bkey%5D=plain' });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).body, { title: 'Päivmär', value: ['A&B', 'C'], 'nested[key]': 'plain' });
  });
});

test('malformed JSON is refused before the route executes', integration, async () => {
  await withServer(async (url, calls) => {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"broken":' });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'entity.parse.failed');
    assert.equal(calls(), 0);
  });
});

test('JSON larger than the existing 50MB limit is refused', integration, async () => {
  await withServer(async (url, calls) => {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x'.repeat(50 * 1024 * 1024) }) });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error, 'entity.too.large');
    assert.equal(calls(), 0);
  });
});

test('compressed JSON is parsed and unrelated content types are untouched', integration, async () => {
  await withServer(async url => {
    const zipped = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body: gzipSync('{"title":"offline"}') });
    assert.equal(zipped.status, 200);
    assert.deepEqual((await zipped.json()).body, { title: 'offline' });
    const other = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: 'unparsed' });
    assert.equal(other.status, 200);
    assert.equal((await other.json()).body, null);
  });
});

test('the API middleware compiles with the installed Rspack without body-parser', async () => {
  const { rspack } = require('@rspack/core');
  const output = path.join(root, '.tools/tmp/api-body-parsing-build');
  const compiler = rspack({
    mode: 'development', target: 'node', entry: path.join(root, 'server/apiMiddleware.js'),
    output: { path: output, filename: 'middleware.cjs' },
    externals: [({ request }, callback) => callback(null, request?.startsWith('meteor/') || request?.startsWith('/server/') ? `commonjs ${request}` : undefined)],
  });
  try {
    const stats = await new Promise((resolve, reject) => compiler.run((error, result) => error ? reject(error) : resolve(result)));
    assert.equal(stats.hasErrors(), false, stats.toString({ all: false, errors: true }));
    assert.doesNotMatch(fs.readFileSync(path.join(output, 'middleware.cjs'), 'utf8'), /Cannot find module ['"]body-parser/);
  } finally {
    await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()));
    fs.rmSync(output, { recursive: true, force: true });
  }
});
