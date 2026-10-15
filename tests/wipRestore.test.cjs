'use strict';

// #6772: "Restore from Archive silently does nothing when the list's hard WIP
// limit is reached." The Restore handlers checked canBeRestored() and, when it
// said no, did nothing - no message, no method call. Restore all skipped such
// cards just as quietly.
// Run: node tests/wipRestore.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { wipLimitBlocksRestore } = require('../models/lib/wipRestore');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

test('a hard limit blocks once the list is full', () => {
  assert.equal(wipLimitBlocksRestore({ enabled: true, soft: false, value: 3 }, 3), true);
  assert.equal(wipLimitBlocksRestore({ enabled: true, soft: false, value: 3 }, 2), false);
});

test('negative: a list over its limit blocks too (the old === let a card in)', () => {
  assert.equal(wipLimitBlocksRestore({ enabled: true, soft: false, value: 3 }, 5), true);
});

test('negative: a soft limit, a disabled one, or none never blocks', () => {
  assert.equal(wipLimitBlocksRestore({ enabled: true, soft: true, value: 1 }, 9), false);
  assert.equal(wipLimitBlocksRestore({ enabled: false, soft: false, value: 1 }, 9), false);
  assert.equal(wipLimitBlocksRestore(undefined, 9), false);
  assert.equal(wipLimitBlocksRestore({ enabled: true, soft: false, value: 'x' }, 9), false);
});

test('canBeRestored() counts every card of the list with the shared rule', () => {
  const cards = read('models/cards.js');
  const body = cards.slice(cards.indexOf('  canBeRestored() {'), cards.indexOf('\n  },', cards.indexOf('  canBeRestored() {')));
  assert.match(body, /if \(!list\) return false;/, 'a missing list cannot hold it');
  assert.match(body, /return !wipLimitBlocksRestore\(\{[\s\S]*\}, list\.cardsUnfiltered\(\)\.length\);/);
  assert.doesNotMatch(body, /===/, 'no exact-equality check left');
});

test('a blocked Restore asks for another list, in the sidebar and in the open card', () => {
  const sidebar = read('client/components/sidebar/sidebarArchives.js');
  const fn = sidebar.slice(sidebar.indexOf('export async function restoreArchivedCard'));
  const shared = fn.slice(0, fn.indexOf('\n}\n'));
  assert.match(shared, /if \(!currentList \|\| !card\.canBeRestored\(\)\) \{\s*Popup\.open\('restoreArchivedCardToList'\)/);
  assert.match(shared, /wipLimitReached: !!currentList/, 'the popup says why');
  assert.match(sidebar, /'click \.js-restore-card'[\s\S]{0,600}await restoreArchivedCard\(evt, card\);/);
  assert.match(read('client/components/cards/cardDetails.js'), /if \(await restoreArchivedCard\(event, card\)\) Popup\.back\(\);/);
  // Only lists with room are offered, and none left is said, not hidden.
  assert.match(sidebar, /return listsWithRoom\(card\);/);
  const jade = read('client/components/sidebar/sidebarArchives.jade');
  assert.match(jade, /if wipLimitReached\n\s+p\.js-restore-wip-reached \{\{_ 'restore-card-wip-limit-reached' list=currentListTitle\}\}/);
  assert.match(jade, /else\n\s+p\.js-restore-no-list-with-room \{\{_ 'restore-card-no-list-with-room'\}\}/);
});

test('Restore all says how many it left out', () => {
  const sidebar = read('client/components/sidebar/sidebarArchives.js');
  const body = sidebar.slice(sidebar.indexOf("'click .js-restore-all-cards'"), sidebar.indexOf('\n  },', sidebar.indexOf("'click .js-restore-all-cards'")));
  assert.match(body, /skipped \+= 1;/);
  // Opened against the link kept BEFORE the awaits: by then the browser has
  // cleared evt.currentTarget (found by the browser test).
  assert.match(body, /const opener = evt\.currentTarget;\s*let skipped = 0;/);
  assert.match(body, /Popup\.open\('restoreAllSkipped'\)\(openFrom, \{ dataContextIfCurrentDataIsUndefined: \{ count: skipped \} \}\)/);
  assert.doesNotMatch(body, /Popup\.open\('restoreAllSkipped'\)\(evt/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['restoreAllSkippedPopup-title', 'restore-card-wip-limit-reached', 'restore-card-no-list-with-room', 'restore-all-skipped-wip-limit']) assert.ok(en[key], key);
  assert.match(en['restore-card-wip-limit-reached'], /__list__/);
  assert.match(en['restore-all-skipped-wip-limit'], /__count__/);
});

test('negative: no client code skips a blocked restore without a word', () => {
  // The shape of the bug: `if (...canBeRestored()) { ... restore() }` with no
  // else. Every caller left either opens the popup or counts what it skipped.
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (/\.js$/.test(e.name)) {
        const src = read(rel);
        for (const m of src.matchAll(/if \([^)]*canBeRestored\(\)\)\s*\{[^}]*restore\(\)[^}]*\}(?!\s*else)/g)) offenders.push(`${rel}: ${m[0].slice(0, 60)}`);
      }
    }
  };
  walk('client');
  assert.deepEqual(offenders, []);
});

console.log(`# ${passed} passed`);
