'use strict';

// Internal helper boards (`^Subtasks^`) must not appear in ANY board list.
// Run: node tests/helperBoards.test.cjs
//
// WeKan creates boards of its own to hold machinery - a subtasks board, for one.
// They are real boards and the user "owns" them, but nobody chose to make one, so
// no list of boards shows them (#5582). They are recognised by their title being
// wrapped in carets.
//
// The selector for that was typed out at each list - five copies of
// `{ $not: { $regex: /^\^.*\^$/ } }` - and the sixth place forgot it: /public
// listed every public subtasks board on the instance beside the real ones. One
// helper now, and this fails if a list stops using it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const {
  notHelperBoardTitle,
  isHelperBoardTitle,
  HELPER_BOARD_TITLE_PATTERN,
} = require('../models/lib/helperBoards');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('helperBoards:');

test('a caret-wrapped title is a helper board, and nothing else is', () => {
  for (const title of ['^Subtasks^', '^^', '^Anything at all^']) {
    assert.strictEqual(isHelperBoardTitle(title), true, title);
  }
  for (const title of [
    'Subtasks',            // a board somebody really named that
    '^Subtasks',           // one caret is not the pattern
    'Subtasks^',
    'My ^Subtasks^ board', // the carets have to bound the WHOLE title
    '',
  ]) {
    assert.strictEqual(isHelperBoardTitle(title), false, JSON.stringify(title));
  }
  for (const junk of [null, undefined, 42, {}, []]) {
    assert.strictEqual(isHelperBoardTitle(junk), false, JSON.stringify(junk));
  }
});

test('the selector excludes exactly those titles', () => {
  const clause = notHelperBoardTitle();
  assert.deepStrictEqual(Object.keys(clause), ['$not']);
  assert.strictEqual(clause.$not.$regex.source, HELPER_BOARD_TITLE_PATTERN.source);
});

test('it is a FUNCTION, so two callers cannot share one object', () => {
  // Mongo selectors get merged and mutated by their callers; a shared constant
  // would carry one caller's edit into the next list.
  const a = notHelperBoardTitle();
  const b = notHelperBoardTitle();
  assert.notStrictEqual(a, b, 'each call must return its own object');
  a.$not.extra = true;
  assert.strictEqual(b.$not.extra, undefined, 'and mutating one must not touch the other');
});

test('every board list uses it — including /public, which did not', () => {
  const boardsList = read('client/components/boards/boardsList.js');
  const boards = read('models/boards.js');

  // No copies left anywhere: a copy is how the next one drifts.
  for (const [rel, src] of [['boardsList.js', boardsList], ['models/boards.js', boards]]) {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/\$regex:\s*\/\^\\\^\.\*\\\^\$\//.test(code),
      `${rel} still spells the pattern out instead of using the helper`);
  }

  // Every board query that lists boards must carry it.
  const uses = (boardsList.match(/notHelperBoardTitle\(\)/g) || []).length;
  assert.ok(uses >= 5, `expected every board list to exclude them, found ${uses}`);
  assert.ok(/notHelperBoardTitle\(\)/.test(boards), 'and userBoards too');

  // The one that was missing it: the /public query.
  const at = boardsList.indexOf("permission: 'public',");
  assert.notStrictEqual(at, -1, 'the /public query must exist');
  const query = boardsList.slice(boardsList.lastIndexOf('query = {', at), boardsList.indexOf('};', at));
  assert.ok(/notHelperBoardTitle\(\)/.test(query),
    '/public must exclude helper boards - it is the list that showed them');
});

console.log(`\nhelperBoards: ${passed} tests passed`);
