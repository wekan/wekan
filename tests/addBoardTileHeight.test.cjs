'use strict';

// The "+ Add Board" / "+ Add Template Container" grey tile on the All Boards page
// must be the same height as a board icon. Both share `.js-add-board .label`, which
// used to override min-height/padding larger than the #6465-thinned board tiles.
// This guards that its box model matches `.board-list-item` (same min-height +
// vertical padding), so it can't drift taller again. CSS-coupled, so a value match.
//
// Run: node tests/addBoardTileHeight.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(
  path.join(path.resolve(__dirname, '..'), 'client/components/boards/boardsList.css'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function block(selector) {
  const i = css.indexOf(selector + ' {');
  assert.ok(i !== -1, `missing rule: ${selector}`);
  return css.slice(i, css.indexOf('}', i));
}

function prop(blk, name) {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(blk);
  return m ? m[1].trim() : null;
}

test('the add-board grey tile matches the board tile box model (same height)', () => {
  const tile = block('.board-list .board-list-item');
  const add = block('.board-list .js-add-board .label');

  const tileMinH = prop(tile, 'min-height');
  const tilePad = prop(tile, 'padding');

  assert.strictEqual(tileMinH, '72px', 'board tile min-height (sanity)');
  assert.strictEqual(prop(add, 'min-height'), tileMinH, 'add-board min-height matches board tile');
  assert.strictEqual(prop(add, 'padding'), tilePad, 'add-board vertical padding matches board tile');

  // NEGATIVE guard: the old oversized values must be gone.
  assert.ok(!/min-height:\s*100px/.test(add), 'no leftover 100px min-height');
  assert.ok(!/line-height:\s*56px/.test(add), 'no leftover 56px line-height');
  assert.ok(!/padding:\s*36px/.test(add), 'no leftover 36px padding');
});

test('the empty .board-list-header dead-space band is gone', () => {
  // It rendered nothing (leftover zoom-controls container) but reserved vertical
  // grey space above the layout on the All Boards page.
  const jade = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/boards/boardsList.jade'), 'utf8');
  assert.ok(!/board-list-header/.test(jade), 'empty header removed from the template');
  assert.ok(!/\.board-list-header\s*{/.test(css), 'its dead CSS rule removed too');
});

console.log(`\nAll ${passed} add-board tile-height tests passed`);
