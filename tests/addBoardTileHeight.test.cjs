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

// The RENDERED height of a tile, from its rule. With `box-sizing: border-box`
// the declared min-height IS that height; without it, padding and border are
// added outside it - which is the whole bug this guards.
function outerHeight(blk, extraBorderPx = 0) {
  const minH = parseInt(prop(blk, 'min-height'), 10);
  const borderBox = /box-sizing:\s*border-box/.test(blk);
  if (borderBox) return minH;
  const padding = prop(blk, 'padding');
  const p = padding ? padding.split(/\s+/).map(v => parseInt(v, 10)) : [0];
  const vpad = p[0] + (p[2] === undefined ? p[0] : p[2]);
  return minH + vpad + extraBorderPx * 2;
}

test('every All Boards tile renders the same height, bordered ones included', () => {
  // A board tile, the grey "+ Add Board" tile, a BOOKMARK in Starred and the
  // Template Container tile all sit in the same grid, and two of those four
  // carry `border: 4px solid #fff`. On a content-box element that border is
  // added OUTSIDE the height, so a starred page stood 8px taller than the board
  // next to it and than "+ Add Board", and dragged its whole row taller.
  const tile = block('.board-list .board-list-item');
  const add = block('.board-list .js-add-board .label');

  assert.ok(/box-sizing:\s*border-box/.test(tile),
    'the board tile folds its padding and border into its height');
  assert.ok(/box-sizing:\s*border-box/.test(add),
    'and so does the add-board tile, or a border would push it out again');

  const height = outerHeight(tile);
  assert.strictEqual(height, 114, 'the height an ordinary tile already rendered at');
  assert.strictEqual(outerHeight(add), height, '"+ Add Board" matches a board tile');

  // The two bordered variants add only a border - which now costs nothing,
  // because the base rule is border-box. If either ever set its own min-height
  // or box-sizing, it would be a second answer to "how tall is a tile".
  for (const selector of [
    '.board-list .board-list-item.template-container',
    '.board-list .board-list-item-bookmark .board-list-item',
  ]) {
    const variant = block(selector);
    assert.ok(/border:\s*4px solid/.test(variant), `${selector} is the bordered kind`);
    assert.strictEqual(prop(variant, 'min-height'), null,
      `${selector} must not restate the height`);
    assert.strictEqual(prop(variant, 'box-sizing'), null,
      `${selector} must not opt out of border-box`);
  }

  // NEGATIVE guard: the old oversized values must be gone.
  assert.ok(!/min-height:\s*100px/.test(add), 'no leftover 100px min-height');
  assert.ok(!/line-height:\s*56px/.test(add), 'no leftover 56px line-height');
  assert.ok(!/padding:\s*36px/.test(add), 'no leftover 36px padding');
});

test('no tile rule opts back into content-box (negative)', () => {
  // content-box is what made the border grow the tile. A rule that sets it on a
  // tile would put the 8px back without changing a single height value.
  const tileRules = css.split('}').filter(rule =>
    /\.board-list[^{]*\.(board-list-item|label)[^{]*\{/.test(rule));
  for (const rule of tileRules) {
    assert.ok(!/box-sizing:\s*content-box/.test(rule),
      `a tile rule sets content-box: ${rule.slice(0, 60).trim()}`);
  }
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
  // it already had. docs/Features/Page/All-Boards.md
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
  // hamburger opened. docs/Features/Page/All-Boards.md
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

test('the "+ Add Board" tile stretches to the row, not just to the floor', () => {
  // `min-height: 114px` is a FLOOR. A board whose title wraps to three lines
  // grows past it, and the grid stretches every other tile in that row to match
  // - but the grey comes from the `.label` INSIDE the li, which kept its own
  // 114px while the li grew. The row was 146px of board and 114px of grey.
  const li = block('.board-list .js-add-board');
  assert.ok(/display:\s*flex/.test(li),
    'the add-board li must be a flex box, so its label can fill the row height');
  const label = block('.board-list .js-add-board > .label');
  assert.ok(/flex:\s*1 1 auto/.test(label),
    'and the label must grow into it');
});

test('the Home placeholder is a board tile\'s height too', () => {
  // "Drag a board here to open it after login" stands where a board tile will
  // be, so it is the size of one. It was padding around a line of text, about
  // 85px, on a page whose entire content is that box.
  const empty = block('.board-list-item-empty');
  assert.ok(/box-sizing:\s*border-box/.test(empty),
    'the dashed border must be folded into the height, not added outside it');
  assert.strictEqual(parseInt(prop(empty, 'min-height'), 10), 114,
    'the same 114px as a board tile and as "+ Add Board"');
});

test('one list renders every view, so no page can have its own tile height', () => {
  // Starred, Remaining, Home, Templates, Archive and the workspaces are the
  // SAME `ul.board-list` with a different set of boards in it - which is why
  // "do the workspace tiles match the others" has one answer and not six. A
  // second list would be a second set of tile rules to keep in step.
  const jade = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/components/boards/boardsList.jade'), 'utf8');
  const lists = [...jade.matchAll(/^\s*ul\.board-list[\w.-]*/gm)];
  assert.strictEqual(lists.length, 1,
    `board tiles must come from ONE list; found ${lists.length}`);
  assert.ok([...jade.matchAll(/board-list-item/g)].length > 3,
    'and every tile variant is inside it');
});

test('every tile variant shares the 114px floor, bordered or not', () => {
  // Named one by one, because each is a different page and they are compared by
  // eye across pages rather than side by side: an ordinary board, a template
  // container (4px white border), the two grey add tiles and Home's dashed
  // placeholder.
  for (const [sel, what] of [
    ['.board-list .board-list-item', 'a board'],
    ['.board-list .js-add-board .label', '"+ Add Board"'],
    ['.board-list-item-empty', "Home's placeholder"],
  ]) {
    const blk = block(sel);
    assert.ok(blk, `${sel} must exist`);
    assert.strictEqual(parseInt(prop(blk, 'min-height'), 10), 114, `${what} is 114px`);
    assert.ok(/box-sizing:\s*border-box/.test(blk),
      `${what} folds its border into that height`);
  }
  // The template container adds only a border, on top of the base rule - it
  // must NOT restate a height of its own, or the two would drift.
  const tpl = block('.board-list .board-list-item.template-container');
  assert.ok(!/min-height/.test(tpl),
    'the template container inherits the height rather than setting one');
});

console.log(`\nAll ${passed} add-board tile-height tests passed`);
