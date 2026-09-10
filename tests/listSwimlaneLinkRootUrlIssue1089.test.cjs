// Issue #1089 ("Missing: Link to this list") described the same fault #6459
// later named exactly: the list-more popup's link box read `{{ rootUrl }}`, a
// template helper that has never existed in WeKan, so the box was always
// empty - there was no working "Link to this list" (and no "Link to this
// swimlane" at all). Commit e755b60b3 ("Link to a swimlane or a list, the way
// you can link to a card.") replaced that with `list.absoluteUrl()` /
// `swimlane.absoluteUrl()`, built from models/lib/boardItemUrl.js's relative
// path through `Meteor.absoluteUrl()` - see tests/boardItemLinks.test.cjs for
// the broader link/route/reveal coverage that commit added.
//
// This suite pins the #1089 fix specifically: the copy-link features for a
// list and a swimlane use the correct absolute-URL builder today, and no
// code path re-introduces the bare/broken `rootUrl` template reference the
// issue and #6459 both describe.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

// --- Positive: list and swimlane "copy link" use the correct URL builder ---

test('listHeader.jade\'s list-more popup reads absoluteUrl, not rootUrl', () => {
  const jade = read('client/components/lists/listHeader.jade');
  assert.ok(/value="\{\{ absoluteUrl \}\}"/.test(jade),
    'the link input value is bound to absoluteUrl');
  assert.ok(/#6459/.test(jade) && /rootUrl/.test(jade),
    'the historical rootUrl bug is documented in a comment, not live in the template');
});

test('listHeader.js builds the copied link from list.absoluteUrl()', () => {
  const js = read('client/components/lists/listHeader.js');
  assert.ok(/list\.absoluteUrl\(\)/.test(js),
    'the copy-link handler calls list.absoluteUrl()');
});

test('swimlaneHeader.js builds the copied link from swimlane.absoluteUrl()', () => {
  const js = read('client/components/swimlanes/swimlaneHeader.js');
  assert.ok(/swimlane\.absoluteUrl\(\)/.test(js),
    'the copy-link handler calls swimlane.absoluteUrl()');
});

test('models/lists.js#absoluteUrl is built via Meteor.absoluteUrl(), not a rootUrl helper', () => {
  const js = read('models/lists.js');
  const m = js.match(/absoluteUrl\(board\)\s*\{[\s\S]*?\n\s*\}/);
  assert.ok(m, 'List#absoluteUrl exists');
  assert.ok(/Meteor\.absoluteUrl\(/.test(m[0]),
    'List#absoluteUrl calls Meteor.absoluteUrl(), the real API');
  assert.ok(!/\{\{\s*rootUrl\s*\}\}/.test(m[0]), 'no bare {{ rootUrl }} reference');
});

test('models/swimlanes.js#absoluteUrl is built via Meteor.absoluteUrl(), not a rootUrl helper', () => {
  const js = read('models/swimlanes.js');
  const m = js.match(/absoluteUrl\(board\)\s*\{[\s\S]*?\n\s*\}/);
  assert.ok(m, 'Swimlane#absoluteUrl exists');
  assert.ok(/Meteor\.absoluteUrl\(/.test(m[0]),
    'Swimlane#absoluteUrl calls Meteor.absoluteUrl(), the real API');
  assert.ok(!/\{\{\s*rootUrl\s*\}\}/.test(m[0]), 'no bare {{ rootUrl }} reference');
});

test('models/lib/boardItemUrl.js builds relative paths, never a rootUrl template token', () => {
  const src = read('models/lib/boardItemUrl.js');
  assert.ok(/buildListRelativeUrl/.test(src) && /buildSwimlaneRelativeUrl/.test(src),
    'both builders exist');
  assert.ok(!/rootUrl/.test(src), 'the builder never references rootUrl');
});

// --- Negative: the broken {{ rootUrl }} template helper is gone from the tree ---

test('no .jade template anywhere references the nonexistent {{ rootUrl }} helper live', () => {
  const offenders = [];
  const CLIENT_DIR = path.join(ROOT, 'client');
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.jade')) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const line of text.split('\n')) {
        if (/\{\{\s*rootUrl\s*\}\}/.test(line) && !/^\s*\/\//.test(line.trim())) {
          offenders.push(path.relative(ROOT, full) + ': ' + line.trim());
        }
      }
    }
  })(CLIENT_DIR);
  assert.deepStrictEqual(offenders, [],
    'a live {{ rootUrl }} reference would reproduce #1089/#6459 (empty link box)');
});

test('no client .js file builds a link by string-templating a bare rootUrl variable', () => {
  const offenders = [];
  const CLIENT_DIR = path.join(ROOT, 'client');
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.js')) continue;
      const text = fs.readFileSync(full, 'utf8');
      // The broken pattern was a template reading a `rootUrl` name that is not
      // Meteor's real `Meteor.absoluteUrl` API - e.g. `Session.get('rootUrl')`,
      // `this.rootUrl`, or a bare `rootUrl` template helper registration.
      if (/helpers\(\s*\{\s*[\s\S]{0,200}\brootUrl\b/.test(text)) {
        offenders.push(path.relative(ROOT, full));
      }
    }
  })(CLIENT_DIR);
  assert.deepStrictEqual(offenders, [],
    'no template helper named rootUrl should exist - it never did, which was the bug');
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(`FAIL: ${name}\n  ${e.message}`);
  }
}
console.log(`listSwimlaneLinkRootUrlIssue1089: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
