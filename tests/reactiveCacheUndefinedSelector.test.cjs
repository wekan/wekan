'use strict';
// The client ReactiveCache keys every query by EJSON.stringify(selector) and
// runs the query on the PARSED key (imports/reactiveCache.js, DataCache). A
// value that is undefined disappears in that round trip, so
// `_id: { $ne: undefined }` - "every board" - is queried as `_id: {}`, which
// matches no document. The card More popup and the multi-selection
// destination picker filtered out `getTemplatesBoardId()`, which is undefined
// for a user without a templates board, and listed no board at all.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the round trip ReactiveCache makes really turns $ne: undefined into {}', () => {
  // EJSON.stringify drops undefined exactly as JSON.stringify does.
  const key = JSON.stringify({ selector: { archived: false, _id: { $ne: undefined } } });
  assert.deepEqual(JSON.parse(key).selector, { archived: false, _id: {} });
});

test('the two board lists exclude the templates board only when there is one', () => {
  for (const file of ['client/components/cards/cardDetails.js', 'client/components/sidebar/sidebarFilters.js']) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(text, /const templatesBoardId = ReactiveCache\.getCurrentUser\(\)\?\.getTemplatesBoardId\(\);/, file);
    assert.match(text, /\.\.\.\(templatesBoardId \? \{ _id: \{ \$ne: templatesBoardId \} \} : \{\}\)/, file);
  }
});

function clientFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) clientFiles(full, out);
    else if (/\.js$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('negative: no ReactiveCache query puts a call that may return undefined under $ne', () => {
  // getTemplatesBoardId() and friends read an optional profile field. Inside a
  // ReactiveCache selector, compute the value first and leave the clause out
  // when it is missing.
  const bad = [];
  for (const file of [...clientFiles(path.join(root, 'client')), path.join(root, 'imports/reactiveCache.js')]) {
    const text = fs.readFileSync(file, 'utf8');
    for (const call of text.matchAll(/ReactiveCache\.get\w+\(\s*\{[\s\S]*?\}\s*[,)]/g)) {
      if (/\$ne:\s*[\w.]*\([^)]*\)\??\.?\w*\(\)/.test(call[0]) || /\$ne:\s*ReactiveCache\.getCurrentUser\(\)/.test(call[0])) {
        bad.push(path.relative(root, file) + ': ' + call[0].replace(/\s+/g, ' ').slice(0, 120));
      }
    }
  }
  assert.deepEqual(bad, []);
});

test('negative: the guard above does catch the shape that broke', () => {
  const broken = "ReactiveCache.getBoards({ archived: false, _id: { $ne: ReactiveCache.getCurrentUser().getTemplatesBoardId() }, }, {})";
  assert.ok(/\$ne:\s*ReactiveCache\.getCurrentUser\(\)/.test(broken));
});

console.log(`\nreactiveCacheUndefinedSelector: all ${passed} tests passed`);
