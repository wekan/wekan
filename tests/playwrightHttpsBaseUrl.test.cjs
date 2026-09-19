'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const setup = fs.readFileSync(
  path.join(__dirname, 'playwright', 'global-setup.js'),
  'utf8',
);

test('Playwright server readiness supports the HTTPS comparison target', () => {
  assert.match(setup, /require\('https'\)/);
  assert.match(setup, /new URL\(BASE_URL\)\.protocol === 'https:' \? https : http/);
  assert.match(setup, /transport\.get\(BASE_URL/);
  assert.doesNotMatch(setup, /http\.get\(BASE_URL/);
});

function readiness(baseUrl, outcome) {
  let usedProtocol;
  let resumed = false;
  let destroyed = false;
  const transport = protocol => ({ get(_url, callback) {
    usedProtocol = protocol;
    const request = {
      on(_event, onError) {
        queueMicrotask(() => {
          if (outcome === 'error') onError(new Error('refused'));
          else if (outcome !== 'timeout') callback({ statusCode: outcome, resume() { resumed = true; } });
        });
        return request;
      },
      setTimeout(ms, onTimeout) {
        assert.equal(ms, 10_000);
        if (outcome === 'timeout') queueMicrotask(onTimeout);
      },
      destroy() { destroyed = true; },
    };
    return request;
  } });
  const module = { exports: {} };
  vm.runInNewContext(setup, {
    module, URL, process: { env: { WEKAN_BASE_URL: baseUrl } },
    require: protocol => transport(protocol),
  });
  return { run: module.exports, protocol: () => usedProtocol, resumed: () => resumed, destroyed: () => destroyed };
}

test('HTTP and HTTPS readiness drains a successful response', async () => {
  for (const protocol of ['http', 'https']) {
    const check = readiness(`${protocol}://localhost:3000`, 200);
    await check.run();
    assert.equal(check.protocol(), protocol);
    assert.equal(check.resumed(), true);
  }
});

test('unreachable, unhealthy and unresponsive servers fail instead of skipping the matrix', async () => {
  for (const outcome of ['error', 'timeout', 404, 503]) {
    const check = readiness('http://localhost:3000', outcome);
    await assert.rejects(check.run(), /not ready.*no browser tests were run/);
    if (outcome === 'timeout') assert.equal(check.destroyed(), true);
  }
});
