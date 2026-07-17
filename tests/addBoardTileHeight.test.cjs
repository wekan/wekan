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
  // Total vertical padding (top+bottom) drives tile height; the add-board tile may
  // split it differently (to nudge the text) as long as the SUM matches.
  const vpad = blk => {
    const p = prop(blk, 'padding').split(/\s+/).map(v => parseInt(v, 10));
    return p[0] + (p[2] === undefined ? p[0] : p[2]); // top + bottom
  };

  assert.strictEqual(tileMinH, '72px', 'board tile min-height (sanity)');
  assert.strictEqual(prop(add, 'min-height'), tileMinH, 'add-board min-height matches board tile');
  assert.strictEqual(vpad(add), vpad(tile), 'add-board total vertical padding matches board tile (same height)');

  // NEGATIVE guard: the old oversized values must be gone.
  assert.ok(!/min-height:\s*100px/.test(add), 'no leftover 100px min-height');
  assert.ok(!/line-height:\s*56px/.test(add), 'no leftover 56px line-height');
  assert.ok(!/padding:\s*36px/.test(add), 'no leftover 36px padding');
});

test('the My Boards bar wraps so Sort/Multi-Selection/Clear stay visible when narrow', () => {
  // Without flex-wrap the search box + Sort / Multi-Selection / Clear buttons
  // overflow (hide) on a narrow window instead of dropping to a second row.
  const header = block('.boards-path-header');
  assert.strictEqual(prop(header, 'flex-wrap'), 'wrap', 'the bar wraps');
  const right = block('.boards-path-header .path-right');
  assert.strictEqual(prop(right, 'flex-wrap'), 'wrap', 'the button group wraps too');
});

test('the empty .board-list-header dead-space band is gone', () => {
  // It rendered nothing (leftover zoom-controls container) but reserved vertical
  // grey space above the layout on the All Boards page.
  const jade = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/boards/boardsList.jade'), 'utf8');
  assert.ok(!/board-list-header/.test(jade), 'empty header removed from the template');
  assert.ok(!/\.board-list-header\s*{/.test(css), 'its dead CSS rule removed too');
});

test('All Boards path-right order: Multi-Selection, then Sort, then Search boards', () => {
  const jade = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/boards/boardsList.jade'), 'utf8');
  const seg = jade.slice(jade.indexOf('.path-right'), jade.indexOf('.path-right') + 1600);
  const ms = seg.indexOf('js-multiselection-activate');
  const sort = seg.indexOf('js-open-boards-sort');
  const search = seg.indexOf('js-board-search-input');
  assert.ok(ms !== -1 && sort !== -1 && search !== -1, 'all three present');
  assert.ok(ms < sort, 'Multi-Selection is left of Sort');
  assert.ok(sort < search, 'Search boards is to the right (after Multi-Selection and Sort)');
});

test('All Boards board tile drag handle is at the right middle', () => {
  const c = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/boards/boardsList.css'), 'utf8');
  const i = c.indexOf('.board-list .board-handle {');
  const blk = c.slice(i, c.indexOf('}', i));
  assert.ok(/top:\s*50%/.test(blk) && /transform:\s*translateY\(-50%\)/.test(blk) && /inset-inline-end/.test(blk),
    'handle vertically centered on the right edge');
  assert.ok(!/left:\s*50%/.test(blk) && !/translateX/.test(blk), 'no longer top-centered');
  assert.ok(/background:\s*transparent/.test(blk), 'transparent background — only the drag icon shows');
});

console.log(`\nAll ${passed} add-board tile-height tests passed`);
