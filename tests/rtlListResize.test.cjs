'use strict';

// #6801: in a right-to-left language, dragging a list's resize handle moved
// the list's edge the wrong way. The handle sits on the list's inline END
// (list.css: inset-inline-end), which is its LEFT edge right-to-left, but the
// width was startWidth + (pointer - start): dragging the handle left, out of
// the list, NARROWED it. The pointer's movement is now counted with the list's
// own direction.
//
// And nowhere else: every drag-to-resize of a width - lists, the board
// sidebar, the left menus - has its edge on a logical side, so each of them
// must flip the movement right-to-left.
// Run: node tests/rtlListResize.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('rtlListResize:');

const listJs = read('client/components/lists/list.js');
const listCss = read('client/components/lists/list.css');

test('the list resize handle is on the logical inline end', () => {
  const rule = listCss.match(/\.list-resize-handle\s*\{[^}]*\}/)[0];
  assert.match(rule, /inset-inline-end\s*:/);
  assert.doesNotMatch(rule, /(^|[^-])\b(left|right)\s*:/, 'a physical side would not flip with the handle');
});

test('the drag counts the pointer with the list\'s own direction', () => {
  assert.match(listJs,
    /inlineDirection\s*=\s*\n?\s*window\.getComputedStyle\(\$list\[0\]\)\.direction === 'rtl' \? -1 : 1/);
  const deltas = listJs.match(/const deltaX = [^;]*;/g) || [];
  assert.strictEqual(deltas.length, 2, 'doResize and stopResize');
  for (const d of deltas) {
    assert.strictEqual(d, 'const deltaX = (currentX - startX) * inlineDirection;');
  }
});

test('negative: the width is never the raw pointer movement', () => {
  assert.doesNotMatch(listJs, /const deltaX = currentX - startX;/);
});

// Every client file that resizes a WIDTH from the pointer's movement.
function walk(dir, out) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.js$/.test(entry.name)) out.push(rel);
  }
  return out;
}

test('negative: every width resizer flips its drag right-to-left', () => {
  const resizers = walk('client', []).filter((f) => /startWidth \+ delta/.test(read(f)));
  assert.deepStrictEqual(resizers.sort(), [
    'client/components/lists/list.js',
    'client/components/settings/leftMenu.js',
    'client/components/sidebar/sidebar.js',
  ], 'a new width resizer must be checked for right-to-left too');
  for (const f of resizers) {
    assert.match(read(f), /rtl/i, `${f} resizes a width without a right-to-left direction`);
  }
});

console.log(`rtlListResize: ${passed} passed`);
