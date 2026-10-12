'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../sandstorm-src/migration-bridge.js'), 'utf8');
let handler;
vm.runInNewContext(source, {
  require: name => {
    assert.equal(name, 'http');
    return { createServer(fn) { handler = fn; return { listen() { return this; } }; } };
  },
  process: { env: {}, on() {} },
});
let html;
handler({ url: '/' }, { writeHead(status) { assert.equal(status, 503); }, end(body) { html = body; } });
// Tag patterns are case-insensitive and allow attributes and `</script >`:
// HTML does, so a case-sensitive pattern can miss the tag it is looking for
// (CodeQL alert #566, js/bad-tag-filter).
assert.match(html, /<noscript\b[^>]*>\s*<meta http-equiv="refresh"/i);
assert.doesNotMatch(html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, ''), /http-equiv="refresh"/i);
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
assert.equal(scripts.length, 1, 'the page has exactly one script');
const script = scripts[0][1];

async function check(result, shouldReload) {
  let respond;
  let fail;
  let reloads = 0;
  const timers = [];
  vm.runInNewContext(script, {
    fetch(url, options) {
      assert.equal(url, '/.sandstorm-startup-ready');
      assert.equal(options.cache, 'no-store');
      return new Promise((resolve, reject) => { respond = resolve; fail = reject; });
    },
    location: { reload() { reloads++; } },
    setTimeout(fn, delay) { timers.push({ fn, delay }); },
  });
  await Promise.resolve();
  assert.equal(reloads, 0, 'never navigates while the request is pending');
  assert.equal(timers.length, 0, 'no polling timer while the request is held');
  if (result instanceof Error) fail(result); else respond({ status: result });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(reloads, shouldReload ? 1 : 0);
  if (shouldReload) assert.equal(timers.length, 0);
  else {
    assert.equal(timers.length, 1);
    assert.equal(timers[0].delay, 250, 'only retry failures or not-ready responses');
  }
}
(async () => {
  await check(204, true);
  await check(503, false);
  await check(200, false); // e.g. migration dashboard: not proof of readiness
  await check(new Error('handoff connection closed'), false);
  console.log('ok - held request, readiness-only navigation, reconnects and noscript fallback');
})().catch(error => { console.error(error); process.exitCode = 1; });
