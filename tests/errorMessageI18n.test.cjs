'use strict';

// A failed call is reported in the reader's language. client/lib/errorMessage.js
// translates a Meteor.Error whose code is a translation key, and otherwise shows
// the translated "Something went wrong" with the server's reason after it.
// Before it, 25 alert() calls fell back to their own English sentence, the Map
// view showed the raw "upload-failed", and the Table view's add-card form an
// English "Could not add the card.".
//
// The negative sweep fails on any alert() under client/ that falls back to an
// English literal again.
//
// Run: node tests/errorMessageI18n.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function loadErrorMessage(translations) {
  const src = read('client/lib/errorMessage.js')
    .replace(/^import \{ TAPi18n \} from '\/imports\/i18n';$/m, '')
    .replace(/^export function/m, 'function');
  const context = { TAPi18n: { __: key => translations[key] || key } };
  vm.runInNewContext(`${src}\nthis.errorMessage = errorMessage;`, context);
  return context.errorMessage;
}

const errorMessage = loadErrorMessage({
  'error-undefined': 'Jokin meni vikaan',
  'error-notAllowed': 'Roolisi ei salli tätä',
});

console.log('errorMessageI18n:');

test('an error code that is a translation key is shown translated', () => {
  assert.strictEqual(errorMessage({ error: 'error-notAllowed', reason: 'Not allowed' }), 'Roolisi ei salli tätä');
});

test('anything else is the translated generic message, with the reason for the admin', () => {
  assert.strictEqual(errorMessage({ error: 'not-found', reason: 'List not found' }), 'Jokin meni vikaan (List not found)');
  assert.strictEqual(errorMessage(new Error('boom')), 'Jokin meni vikaan (boom)');
  assert.strictEqual(errorMessage(undefined), 'Jokin meni vikaan');
});

test('the Map, Table and Timeline views report failures translated', () => {
  const mapJs = read('client/components/boards/mapView.js');
  assert.ok(!/err\.reason \|\| err\.message \|\| 'upload-failed'/.test(mapJs), 'no raw reason or key in the map upload');
  assert.match(read('client/components/boards/mapView.jade'), /p\.warning \{\{_ error\}\}/);
  const tableJs = read('client/components/boards/tableView.js');
  assert.ok(!tableJs.includes('Could not add the card.'));
  assert.match(tableJs, /alert\(TAPi18n\.__\(key\)\)/);
  const timelineJs = read('client/components/boards/timelineView.js');
  assert.match(timelineJs, /restoreCardFromTimeline\(cardContext\.cardId, cardContext\.fields\)\.catch\(/,
    'a refused restore is reported, not dropped');
  assert.match(timelineJs, /canRestoreCard\(cardId\) \{[\s\S]*?Utils\.canModifyCard\(card\)/);
  assert.match(read('client/components/boards/timelineView.jade'), /if canRestoreCard this\.cardId\s*\n\s*button\.timeline-card-restore/,
    'only somebody who may change the card is offered the restore');
});

test('a Table swimlane header row spans the columns the table has', () => {
  assert.match(read('client/components/boards/tableView.jade'), /th\(colspan=columnCount scope="rowgroup"\)/);
  const js = read('client/components/boards/tableView.js');
  assert.match(js, /columnCount\(\) \{[\s\S]*?if \(Utils\.isMiniScreen\(\)\) return 4;[\s\S]*?return 7 \+ dates;/);
});

test('no alert() under client/ falls back to an English sentence (negative)', () => {
  const found = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (rel.endsWith('.js')) {
        read(rel).split('\n').forEach((line, i) => {
          if (/alert\([^)]*\|\|\s*['"][A-Z][a-z]/.test(line)) found.push(`${rel}:${i + 1}`);
        });
      }
    }
  };
  walk('client');
  assert.deepStrictEqual(found, [], 'use errorMessage(error) from client/lib/errorMessage.js');
});

console.log(`\nerrorMessageI18n: ${passed} tests passed`);
