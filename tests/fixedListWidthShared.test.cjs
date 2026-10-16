'use strict';

// #5729 The fixed (same) width for all lists is read by the list
// (client/components/lists/list.js) and set from the list header menu
// (listHeader.js). Each file carried its own copy of the five storage helpers,
// word for word; they are one module now, client/lib/fixedListWidth.js.
//
// Run: node tests/fixedListWidthShared.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const HELPERS = ['readAnonFixedListWidthEnabled', 'readAnonFixedListWidth', 'isFixedListWidth',
  'fixedListWidthValue', 'setAnonFixedListWidthEnabled', 'setAnonFixedListWidth'];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('fixedListWidthShared:');

test('the shared module exports every helper and keeps the storage keys', () => {
  const lib = read('client/lib/fixedListWidth.js');
  for (const name of HELPERS) assert.match(lib, new RegExp(`export function ${name}\\(`));
  assert.ok(lib.includes("'wekan-fixed-list-width-enabled'") && lib.includes("'wekan-fixed-list-width'"),
    'the localStorage keys anonymous viewers already have stay the same');
});

test('the list and its header import it', () => {
  for (const file of ['client/components/lists/list.js', 'client/components/lists/listHeader.js']) {
    assert.match(read(file), /from '\/client\/lib\/fixedListWidth';/, `${file} imports the helpers`);
  }
});

test('no other client file defines its own copy (negative)', () => {
  const copies = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (rel.endsWith('.js') && rel !== path.join('client', 'lib', 'fixedListWidth.js')) {
        const src = read(rel);
        for (const name of HELPERS) {
          if (new RegExp(`function ${name}\\(`).test(src)) copies.push(`${rel}: ${name}`);
        }
      }
    }
  };
  walk('client');
  assert.deepStrictEqual(copies, []);
});

console.log(`\nfixedListWidthShared: ${passed} tests passed`);
