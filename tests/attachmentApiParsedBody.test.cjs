'use strict';

// server/apiMiddleware.js runs express.json() on every path before any route,
// so a JSON body is already read when a route starts listening for it. The
// attachment API's copy and move (and its JSON uploads) waited for a request
// 'end' that had already happened, and answered only at their own 30-second
// timeout - list-lock-attachments.e2e.js timed out on the copy. The routes now
// hand the parsed body to their own listeners (replayParsedBody).
// Run: node tests/attachmentApiParsedBody.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const api = read('server/routes/attachmentApi.js');
const source = api.match(/function replayParsedBody\(req\) \{[\s\S]*?\n\}/);
assert.ok(source, 'replayParsedBody is defined in the attachment API');
// eslint-disable-next-line no-new-func
const replayParsedBody = new Function(`${source[0]}; return replayParsedBody;`)();

function listen(req) {
  return new Promise(resolve => {
    let text = '';
    req.on('data', chunk => { text += chunk.toString(); });
    req.on('end', () => resolve(text));
  });
}

test('express.json() runs first, for every path', () => {
  const imports = read('server/imports.js');
  assert.ok(imports.indexOf("'/server/apiMiddleware'") < imports.indexOf("'/server/routes/attachmentApi'"));
  assert.match(read('server/apiMiddleware.js'), /WebApp\.handlers\.use\(WebApp\.express\.json\(/);
});

test('every route of the attachment API that waits for the body replays a parsed one', () => {
  const ends = api.match(/req\.on\('end'/g) || [];
  const replayed = api.match(/replayParsedBody\(req\);\n\s*req\.on\('end'/g) || [];
  assert.ok(ends.length >= 4, `the JSON routes are found (${ends.length})`);
  assert.equal(replayed.length, ends.length, 'each end listener is preceded by the replay');
});

(async () => {
  // A body express.json() already read arrives at the listeners.
  const parsed = new EventEmitter();
  parsed._body = true;
  parsed.body = { attachmentId: 'a1', targetCardId: 'c1' };
  const got = listen(parsed);
  replayParsedBody(parsed);
  assert.deepEqual(JSON.parse(await got), parsed.body);
  passed += 1; console.log('  ok - a body express already parsed reaches the route');

  // Negative: a body nobody read yet is left to stream - nothing is invented.
  const raw = new EventEmitter();
  raw.readableEnded = false;
  let emitted = false;
  raw.on('data', () => { emitted = true; });
  raw.on('end', () => { emitted = true; });
  replayParsedBody(raw);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(emitted, false, 'an unread body streams as before');
  passed += 1; console.log('  ok - negative: an unread body is not replayed');

  // Negative, the whole tree: a server file that waits for a request's 'end'
  // either uses what a parser already read, or reads a type express.json()
  // leaves alone - said here with the reason.
  const NOT_JSON = {
    'server/activityPub.js': 'application/activity+json, which express.json() does not parse',
    'server/lib/importUpload.js': 'an uploaded file, not JSON',
  };
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        // Every rspack output (_build, _build-local-test, ...) holds a bundled copy.
        if (entry.name !== 'node_modules' && entry.name !== '.build' && !entry.name.startsWith('_build')) walk(rel);
        continue;
      }
      if (!rel.endsWith('.js')) continue;
      const text = read(rel);
      if (!/req\.on\(['"]end['"]/.test(text)) continue;
      if (NOT_JSON[rel] || /req\.body|replayParsedBody/.test(text)) continue;
      offenders.push(rel);
    }
  };
  walk('server');
  walk('models');
  assert.deepEqual(offenders, [], 'a route waiting for a body express.json() may already have read');
  passed += 1; console.log('  ok - negative: no other server file waits for an already-read JSON body');

  console.log(`\nattachmentApiParsedBody: ${passed} tests passed`);
})().catch(error => { console.error(error); process.exit(1); });
