'use strict';

// imports/lib/defaultTitle.js: how a swimlane/list titled 'Default', or holding
// the old "key 'default ... returned an object" text, is shown (#4742, #4763).
// One function now; five templates and the move/copy dialog each had a copy.
// Run: node tests/defaultTitle.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { displayDefaultTitle } = require('../imports/lib/defaultTitle');

const ROOT = path.join(__dirname, '..');
const BROKEN = "key 'default (en)' returned an object instead of string.";
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test("'Default' shows as the translated name", () => {
  assert.equal(displayDefaultTitle('Default', () => 'Oletus'), 'Oletus');
});

test('the broken i18n text shows as the translation, or as Default when that is broken too', () => {
  assert.equal(displayDefaultTitle(BROKEN, () => 'Oletus'), 'Oletus');
  assert.equal(displayDefaultTitle(BROKEN, () => BROKEN), 'Default');
});

test('negative: any other title is shown as it is, and is not translated', () => {
  let asked = false;
  for (const title of ['Backlog', 'default', 'Default lane', "key 'default", '']) {
    assert.equal(displayDefaultTitle(title, () => { asked = true; return 'X'; }), title);
  }
  assert.equal(asked, false);
  assert.equal(displayDefaultTitle(undefined, () => 'X'), undefined);
});

test('negative: no client file carries its own copy of the rule', () => {
  const files = execFileSync('git', ['ls-files', '--', 'client/*.js'], { cwd: ROOT }).toString().split('\n')
    .filter(f => f && fs.existsSync(path.join(ROOT, f)));
  const copies = files.filter(f => /returned an object instead of string/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  assert.deepEqual(copies, []);
  for (const f of ['client/components/lists/listBody.js', 'client/components/swimlanes/swimlaneHeader.js',
    'client/components/sidebar/sidebarFilters.js', 'client/lib/dialogWithBoardSwimlaneList.js']) {
    assert.match(fs.readFileSync(path.join(ROOT, f), 'utf8'), /return displayDefaultTitle\(title, key => TAPi18n\.__\(key\)\);/, f);
  }
});

console.log(`\ndefaultTitle: ${passed} tests passed`);
