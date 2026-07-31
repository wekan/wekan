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

test('the controls wrap so none of them is cut off on a narrow window', () => {
  // Without flex-wrap the controls overflow (hide) on a narrow window instead
  // of dropping to a second row.
  //
  // This used to read `.boards-path-header .path-right`, the page's own row of
  // controls, and then `.boards-path-header` itself. Neither exists: every
  // control - Sort, Search, Multi-Selection, the view menu, and the archive /
  // duplicate / star / home actions on a selection - is in the second top
  // header bar now, and the bar that was left carried only the current
  // section's icon, which the left menu already highlights. So the group that
  // has to wrap is the header bar's, styled by the board header's own
  // stylesheet rather than by this page's.
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/\.boards-path-header/.test(bare), 'the page has no bar above the boards');
  assert.ok(!/\.path-right/.test(bare), 'and no controls group of its own');

  const headerCss = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/main/header.css'), 'utf8');
  const i = headerCss.indexOf('#header #header-main-bar .board-header-btns {');
  assert.ok(i !== -1, 'the header bar button group must be styled');
  assert.ok(/flex-wrap:\s*wrap/.test(headerCss.slice(i, headerCss.indexOf('}', i))),
    'the header bar button group wraps');
});

test('the empty .board-list-header dead-space band is gone', () => {
  // It rendered nothing (leftover zoom-controls container) but reserved vertical
  // grey space above the layout on the All Boards page.
  const jade = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/boards/boardsList.jade'), 'utf8');
  assert.ok(!/board-list-header/.test(jade), 'empty header removed from the template');
  assert.ok(!/\.board-list-header\s*{/.test(css), 'its dead CSS rule removed too');
});

test('All Boards has no header bar left to hold controls', () => {
  // This has followed the controls three times: their order inside
  // `.path-right` (the page's own row above the board icons), then their order
  // in the second header bar, and now nowhere - the bar is gone. Sort and the
  // view menu are rows of the right sidebar; Search and Multi-Selection are rows
  // it already had. docs/Design/Page/All-Boards.md
  const jade = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/boards/boardsList.jade'), 'utf8');
  assert.ok(!/template\(name="boardListHeaderBar"\)/.test(jade), 'the bar is gone');
  const router = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'config/router.js'), 'utf8');
  assert.ok(!/boardListHeaderBar/.test(router), 'and no route names it');

  // The page BODY holds no controls - that was the first move. The scope is the
  // board-list markup, not the whole file: the four controls are in this file
  // now, in `allBoardsHeaderButtons`, which the first top header bar draws.
  const body = jade.slice(0, jade.indexOf('template(name="allBoardsHeaderButtons")'));
  for (const moved of ['js-open-boards-sort', 'js-board-search-input',
    'js-multiselection-activate', 'path-right']) {
    assert.ok(!body.includes(moved), `${moved} must not be in the page body`);
  }

  // They are in the FIRST top header bar, as icons, left of the bell - one
  // click, and nothing covering the boards. They were rows of the sidebar's
  // home view before that, and that home view was the only thing All Boards'
  // hamburger opened. docs/Design/Page/All-Boards.md
  const buttons = jade.slice(jade.indexOf('template(name="allBoardsHeaderButtons")'));
  for (const control of ['js-open-boards-sort', 'js-all-boards-sidebar-search',
    'js-all-boards-sidebar-multiselection']) {
    assert.ok(buttons.includes(control), `${control} must be a header button`);
  }
  // Boards in Archive is NOT one of them any more. Those three act on the
  // boards in front of you; Boards in Archive is a PLACE you go instead, so it
  // is in the left menu with the other places. tests/archivePage.test.cjs
  // checks it there.
  assert.ok(!buttons.includes('js-open-archived-board'),
    'Boards in Archive is a place, not a control of this page');
  // Icons only, named by a tooltip, like every other button of that bar.
  assert.ok(!/\n\s+span \{\{_/.test(buttons.slice(0, buttons.indexOf('\ntemplate('))),
    'the buttons carry no visible label');
  const topBar = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/main/header.jade'), 'utf8');
  const at = topBar.indexOf('+allBoardsHeaderButtons');
  assert.notStrictEqual(at, -1, 'the first header bar draws them');
  assert.ok(at < topBar.indexOf('+notifications'), 'to the LEFT of the bell');
  // The view menu is the exception: it is in the FIRST top header bar, beside
  // the page's name, because a view menu says what you are looking at.
  const header = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/main/header.jade'), 'utf8');
  assert.ok(/\+allBoardsViewMenu/.test(header), 'the view menu is in the first bar');
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
