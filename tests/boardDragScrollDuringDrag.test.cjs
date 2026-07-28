'use strict';

// Guard for #6558 "Moving cards behaves weirdly": on a board with scrollbars in
// both directions, dragging a card sometimes moved the card, sometimes scrolled
// the list, sometimes scrolled the whole board, and often several at once.
//
// A board has THREE independent implementations of drag-to-scroll running over
// the same pointer:
//
//   1. the dragscroll library, bound separately to `.board-canvas`, to every
//      `.swimlane` and to every `.js-lists` lane;
//   2. the `mousedown .board-canvas` lane pan in swimlanes.js;
//   3. jQuery UI sortable, which is what actually moves the card.
//
// This file pins the three things that keep them out of each other's way:
//
//   * every sortable start SUSPENDS drag-scrolling and every stop resumes it;
//   * suspending removes the class BEFORE calling dragscroll.reset() (the old
//     inline attempt in swimlanes.js did it the other way round, which does
//     nothing at all - reset() re-binds to whatever carries the class at that
//     moment), and restores exactly the elements it took it from;
//   * the lane pan and the dragscroll library both refuse to start on a drag
//     source: the `nodragscroll` marker and the `.handle` elements.
//
// Run: node tests/boardDragScrollDuringDrag.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

// Comments describe the fix; they are not the fix. Everything below is asserted
// against code only.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const helper = read('client/lib/boardDragscroll.js');
const helperCode = stripComments(helper);
const listJs = stripComments(read('client/components/lists/list.js'));
const swimlanesJs = stripComments(read('client/components/swimlanes/swimlanes.js'));
const boardBodyJs = stripComments(read('client/components/boards/boardBody.js'));

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// The body of a named function in the helper.
function helperFn(name) {
  const at = helperCode.indexOf(`function ${name}(`);
  assert.notStrictEqual(at, -1, `client/lib/boardDragscroll.js must export ${name}`);
  const end = helperCode.indexOf('\n}', at);
  return helperCode.slice(at, end);
}

console.log('boardDragScrollDuringDrag:');

test('the class is removed BEFORE dragscroll.reset(), or nothing is unbound', () => {
  const fn = helperFn('suspendBoardDragscroll');
  const iRemove = fn.indexOf("classList.remove('dragscroll')");
  const iReset = fn.indexOf('dragscroll.reset()');
  assert.ok(iRemove > 0, 'suspending takes the dragscroll class away');
  assert.ok(iReset > 0, 'and re-scans, which is what unbinds the listeners');
  assert.ok(
    iRemove < iReset,
    'reset() binds to whatever carries the class AT THAT MOMENT - resetting first '
    + 'and removing afterwards leaves every listener in place, which is exactly the '
    + 'bug this fixes',
  );
});

test('exactly the suspended elements are restored, nothing else', () => {
  const fn = helperFn('restore');
  assert.ok(/classList\.add\('dragscroll'\)/.test(fn), 'the class comes back');
  assert.ok(
    /suspendedEls/.test(fn),
    'from the remembered set - a board route deliberately leaves <body>/#content '
    + 'untagged, so re-tagging a fixed selector would enable panning that was off',
  );
  assert.ok(/dragscroll\.reset\(\)/.test(fn), 'and the listeners are bound again');
  const suspend = helperFn('suspendBoardDragscroll');
  assert.ok(
    /if \(suspendedEls/.test(suspend),
    'suspending twice must not overwrite the remembered set (nested drags)',
  );
});

test('a drag that never reaches its stop handler still restores panning', () => {
  const fn = helperFn('suspendBoardDragscroll');
  for (const evt of ['mouseup', 'touchend', 'dragend']) {
    assert.ok(
      fn.includes(`'${evt}'`),
      `${evt} is a safety net: a re-render or sortable('destroy') mid-drag must not `
      + 'leave the board permanently unable to pan',
    );
  }
});

// Every sortable that drags something on the board.
const SORTABLES = [
  ['client/components/lists/list.js (cards)', listJs],
  ['client/components/swimlanes/swimlanes.js (lists)', swimlanesJs],
  ['client/components/boards/boardBody.js (swimlanes)', boardBodyJs],
];

for (const [what, src] of SORTABLES) {
  test(`${what} suspends drag-scrolling for the whole drag`, () => {
    assert.ok(
      /suspendBoardDragscroll\(\)/.test(src),
      'the drag start must stand the pan implementations down',
    );
    assert.ok(
      /resumeBoardDragscroll\(\)/.test(src),
      'and the drag stop must give panning back',
    );
    assert.ok(
      /from '\/client\/lib\/boardDragscroll'/.test(src),
      'through the shared helper, so all of them behave the same',
    );
  });
}

test('the card sortable suspends in start and resumes in stop', () => {
  const at = listJs.indexOf('$cards.sortable({');
  assert.notStrictEqual(at, -1, 'the card sortable is still initialized here');
  const start = listJs.indexOf('start(evt, ui)', at);
  const stop = listJs.indexOf('stop(evt, ui)', start);
  const sort = listJs.indexOf('sort(event, ui)', stop);
  const iSuspend = listJs.indexOf('suspendBoardDragscroll()', at);
  const iResume = listJs.indexOf('resumeBoardDragscroll()', at);
  assert.ok(start < iSuspend && iSuspend < stop, 'suspended in start()');
  assert.ok(stop < iResume && (sort === -1 || iResume < sort), 'resumed in stop()');
});

test('swimlanes.js no longer resets first and removes the class afterwards', () => {
  assert.ok(
    !/dragscroll\.reset\(\)[\s\S]{0,400}?removeClass\('dragscroll'\)/.test(swimlanesJs),
    'that order is a no-op and was the reason a list drag scrolled the board too',
  );
  assert.ok(
    !/addClass\('dragscroll'\)/.test(swimlanesJs),
    're-tagging by selector could enable panning on elements that never had it; '
    + 'resumeBoardDragscroll() restores the remembered set instead',
  );
});

test('the lane pan does not start on a drag source', () => {
  const at = swimlanesJs.indexOf("'mousedown .board-canvas'");
  assert.notStrictEqual(at, -1, 'the lane pan is still here');
  const handler = swimlanesJs.slice(at, swimlanesJs.indexOf('mouseup(evt, tpl)', at));
  assert.ok(
    /'\.nodragscroll'/.test(handler),
    'this second drag-scroll implementation must honour the same marker the '
    + 'dragscroll library does - a minicard carries it, and panning the lane while '
    + 'the card is being dragged is what makes the drop land somewhere else',
  );
  assert.ok(
    /'\.handle'/.test(handler),
    'and the drag handles, which are drag sources when handles are on',
  );
});

test('a pan in progress gives way to a drag', () => {
  const at = swimlanesJs.indexOf('mousemove(evt, tpl)');
  assert.notStrictEqual(at, -1, 'the lane pan still moves on mousemove');
  const handler = swimlanesJs.slice(at, at + 600);
  assert.ok(
    /isBoardDragscrollSuspended\(\)/.test(handler),
    'so a drag that starts after the press stops the pan instead of running with it',
  );
});

test('every drag handle is marked nodragscroll', () => {
  const files = [
    'client/components/cards/minicard.jade',
    'client/components/lists/listHeader.jade',
    'client/components/swimlanes/swimlaneHeader.jade',
  ];
  for (const file of files) {
    const lines = read(file)
      .split('\n')
      // `//-` is a jade comment: the comment above the minicard handle talks
      // about handles and would otherwise be read as markup.
      .filter(line => !/^\s*\/\//.test(line))
      .filter(line => /(^\s*|[.\w])\.handle(\.|\(|\s|$)/.test(line));
    assert.ok(lines.length > 0, `${file} still renders a drag handle`);
    for (const line of lines) {
      assert.ok(
        line.includes('.nodragscroll'),
        `${file}: a press on a drag handle must move the item, not pan the board\n`
        + `      ${line.trim()}`,
      );
    }
  }
});

console.log(`\n${passed} tests passed`);
