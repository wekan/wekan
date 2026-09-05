'use strict';

// Guard: a file WeKan refuses to serve is not then served by Meteor-Files.
// Run: node tests/attachmentServeFailsClosed.test.cjs
//
// FOUND BY A PLAYWRIGHT SPEC, and it found more than it was asking about.
// "stored HTML is forced to a safe download on the original Meteor-Files route"
// expected application/octet-stream and got text/html, status 200 - a stored
// HTML attachment served inline, which is the stored XSS that
// models/lib/fileResponseSafety.js exists to prevent.
//
// The policy module was correct. It was never reached. Meteor-Files calls the
// storage strategy's interceptDownload, and a FALSE return means "not handled,
// serve it yourself" - so Meteor-Files served the file from its stored path,
// with its stored Content-Type, and none of WeKan's headers.
//
// What makes that a bypass rather than a harmless fallback is WHY the strategy
// declines: getReadStream() returns nothing when the file cannot be resolved
// INSIDE the storage root, which is the containment check of
// GHSA-4mxf-m8pq-xc9p. So `false` means "this is not a file WeKan may serve",
// and handing that same file to a server with no containment check answers the
// refusal with the file. The safest possible strategy and the most dangerous
// outcome, from one boolean.
//
// NOT logged to Admin Panel / Problems, deliberately: the same path is taken by
// an attachment that was simply deleted while a link to it survived, which is
// ordinary use. CLAUDE.md's rule is to log an attempt and never ordinary use,
// and interceptDownload cannot tell the two apart - getReadStream() reports
// only that it has nothing. Distinguishing "outside the root" from "not there"
// is what a key would need.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const STRATEGY = 'models/lib/fileStoreStrategy.js';
const src = read(STRATEGY);

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

/* Every interceptDownload body in the file, comments stripped. */
function interceptBodies(text) {
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const out = [];
  let i = 0;
  for (;;) {
    const at = code.indexOf('interceptDownload(', i);
    if (at === -1) break;
    const open = code.indexOf('{', at);
    let depth = 0;
    for (let j = open; j < code.length; j++) {
      if (code[j] === '{') depth++;
      else if (code[j] === '}') {
        depth--;
        if (depth === 0) { out.push(code.slice(open, j + 1)); i = j; break; }
      }
    }
    if (i <= at) break;
  }
  return out;
}

const bodies = interceptBodies(src);

test('every storage strategy implements interceptDownload', () => {
  // Four: the abstract base and the three concrete strategies. The base counts
  // because an empty body returns undefined, which Meteor-Files reads exactly
  // as it reads false - so a strategy that forgot to override it failed open
  // too, and the safe default has to live there as well.
  assert.equal(bodies.length, 4,
    'the base plus three strategies - a new one needs this treatment too');
});

// THE regression, and stated so it cannot come back in any of them.
test('no strategy hands an unservable file back to Meteor-Files', () => {
  bodies.forEach((body, n) => {
    assert.doesNotMatch(body, /return\s+false/,
      `interceptDownload #${n + 1} returns false: Meteor-Files then serves the `
      + 'file itself, with its stored Content-Type and none of WeKan\'s policy');
    assert.doesNotMatch(body, /let ret = false/,
      `interceptDownload #${n + 1} still has the ret-flag shape that returned false`);
  });
});

test('and each refuses with a 404 instead', () => {
  bodies.forEach((body, n) => {
    assert.match(body, /statusCode = 404/,
      `interceptDownload #${n + 1} must answer, not decline`);
    assert.match(body, /return true/,
      `interceptDownload #${n + 1} must claim the request so nothing else serves it`);
  });
});

// The policy is only applied by httpStreamOutput, so every served byte has to
// go through it. A strategy that writes to the response itself would bypass the
// headers just as returning false did.
test('a served file still goes through the one policy choke point', () => {
  // The base refuses everything and streams nothing, so it has no call to make;
  // every strategy that DOES serve must go through httpStreamOutput, because a
  // strategy writing to the response itself would skip the headers exactly as
  // returning false did.
  const serving = bodies.filter(b => /getReadStream\(\)/.test(b));
  assert.equal(serving.length, 3, 'the three concrete strategies');
  serving.forEach((body, n) => {
    assert.match(body, /httpStreamOutput\(/,
      `serving strategy #${n + 1} must stream through httpStreamOutput`);
  });
});

// And the policy that choke point applies is still the fail-closed one.
test('text/html is still forced to a download (the reported case)', () => {
  const { fileResponsePolicy, fileNameIsBrowserExecutable } =
    require('../models/lib/fileResponseSafety');

  const html = fileResponsePolicy('text/html');
  assert.equal(html.contentType, 'application/octet-stream');
  assert.equal(html.forceDownload, true);
  assert.match(html.headers['Content-Security-Policy'], /sandbox/);
  assert.equal(html.headers['X-Content-Type-Options'], 'nosniff');

  // By name as well as by type, so a mislabelled upload is caught too.
  assert.equal(fileNameIsBrowserExecutable('payload.html'), true);
  assert.equal(fileResponsePolicy('image/png', true).forceDownload, true);

  // ...and an ordinary image is still served as one (negative).
  const png = fileResponsePolicy('image/png');
  assert.equal(png.contentType, 'image/png');
  assert.equal(png.forceDownload, false);
});

// The spec that found this wrote its file where the SERVER reads, or it tests
// what WeKan does with a file it does not own - which is how the bypass showed
// up as a policy failure.
test('the test server and the specs agree on where files live', () => {
  const build = read('build.sh');
  assert.match(build, /export WEKAN_FILES_PATH="\$WRITABLE_ABS\/files"/,
    'a local playwright run had only WEKAN_FILES_PATH_HOST, which is the Docker '
    + 'path, so specs fell back to .build/bundle/files while the server read '
    + '.tools/test-writable/files');
});

console.log(`attachmentServeFailsClosed: ${passed} tests passed`);
