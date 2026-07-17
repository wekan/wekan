'use strict';

// Plain-Node unit test (no Meteor) for issue #1853:
// "Bug: Subtask board id missing: cannot read property _id of undefined".
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/subtaskViewNavigation.test.cjs
//
// Clicking "View it" on a subtask in card details ran
//   const board = subtask.board();
//   FlowRouter.go('card', { boardId: board._id, ... })
// and threw `Cannot read property '_id' of undefined` whenever the subtask's
// board — often a DIFFERENT deposit/target board — was not in minimongo.
// The #4762-era guard removed the TypeError but turned the click into a
// silent no-op: the user still could not view the subtask.
//
// The fix (client/components/cards/subtaskViewHelpers.js): subtaskNavTarget()
// falls back to the subtask's own boardId (with the model's default 'board'
// slug — the card route action in config/router.js only consumes
// :boardId/:cardId) so navigation proceeds and the route's subscriptions load
// the board. Only a truly broken subtask (no card id AND/OR no board
// reference) yields undefined, and the click handler warns instead of
// throwing.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const helpersPath = path.join(
  repoRoot,
  'client',
  'components',
  'cards',
  'subtaskViewHelpers.js',
);
const handlersPath = path.join(
  repoRoot,
  'client',
  'components',
  'cards',
  'subtasks.js',
);

const helpersSrc = fs.readFileSync(helpersPath, 'utf8');
const handlersSrc = fs.readFileSync(handlersPath, 'utf8');

// The helper module is dependency-free ES module code; strip the `export`
// keywords and evaluate it in a bare context.
const context = { console };
vm.createContext(context);
vm.runInContext(helpersSrc.replace(/^export /gm, ''), context);
const { canNavigateToSubtaskBoard, subtaskNavTarget, subtaskBoardNavTarget } =
  context;
assert.strictEqual(typeof canNavigateToSubtaskBoard, 'function');
assert.strictEqual(typeof subtaskNavTarget, 'function');
assert.strictEqual(typeof subtaskBoardNavTarget, 'function');

let passed = 0;
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// A subtask stub mimicking the Card model surface the helpers use. `board()`
// returns the board doc when it is "in minimongo", undefined otherwise.
function makeSubtask({ boardLoaded = true, withRealId = true } = {}) {
  const boardDoc = { _id: 'depositBoardId', slug: 'deposit-board' };
  return {
    _id: 'subtaskCardId',
    boardId: 'depositBoardId',
    swimlaneId: 'subSwimlaneId',
    listId: 'subListId',
    board() {
      return boardLoaded ? boardDoc : undefined;
    },
    getRealId() {
      return withRealId ? 'subtaskRealId' : undefined;
    },
  };
}

// Mimics the js-view-subtask click handler contract: navigate when a target
// exists, warn (never throw) otherwise. Kept in lockstep with the handler by
// the source-level pins further below.
function simulateViewClick(subtask) {
  const gone = [];
  const warned = [];
  const target = subtaskNavTarget(subtask);
  if (target) {
    gone.push(['card', target]);
  } else {
    warned.push(subtask && subtask._id);
  }
  return { gone, warned };
}

// --- POSITIVE: board present in minimongo -----------------------------------

test('board loaded: navigates to the subtask card on its own board', () => {
  const { gone, warned } = simulateViewClick(makeSubtask());
  assert.strictEqual(warned.length, 0);
  assert.strictEqual(gone.length, 1);
  const [route, params] = gone[0];
  assert.strictEqual(route, 'card');
  assert.strictEqual(params.boardId, 'depositBoardId');
  assert.strictEqual(params.slug, 'deposit-board');
  assert.strictEqual(params.cardId, 'subtaskRealId');
  assert.strictEqual(params.swimlaneId, 'subSwimlaneId');
  assert.strictEqual(params.listId, 'subListId');
});

test('board loaded, no getRealId result: falls back to the plain _id', () => {
  const target = subtaskNavTarget(makeSubtask({ withRealId: false }));
  assert.strictEqual(target.cardId, 'subtaskCardId');
});

test('canNavigateToSubtaskBoard accepts only a board doc with an _id', () => {
  assert.strictEqual(canNavigateToSubtaskBoard({ _id: 'b1', slug: 's' }), true);
  assert.strictEqual(canNavigateToSubtaskBoard(undefined), false);
  assert.strictEqual(canNavigateToSubtaskBoard(null), false);
  assert.strictEqual(canNavigateToSubtaskBoard({ slug: 'only' }), false);
});

// --- NEGATIVE→FALLBACK: board doc missing from minimongo (#1853) -------------

test('#1853: board NOT loaded does not throw and still navigates via boardId', () => {
  let result;
  assert.doesNotThrow(() => {
    result = simulateViewClick(makeSubtask({ boardLoaded: false }));
  });
  assert.strictEqual(result.warned.length, 0, 'must not degrade to a warning');
  assert.strictEqual(result.gone.length, 1, 'must navigate, not no-op');
  const [route, params] = result.gone[0];
  assert.strictEqual(route, 'card');
  assert.strictEqual(
    params.boardId,
    'depositBoardId',
    'falls back to the subtask own boardId',
  );
  assert.strictEqual(
    params.slug,
    'board',
    "uses the model's default slug; the card route only consumes ids",
  );
  assert.strictEqual(params.cardId, 'subtaskRealId');
});

test('#1853: subtask.board absent entirely (plain doc) still navigates', () => {
  const bare = { _id: 'c1', boardId: 'b1' };
  const target = subtaskNavTarget(bare);
  assert.ok(target);
  assert.strictEqual(target.boardId, 'b1');
  assert.strictEqual(target.cardId, 'c1');
});

test('#1853: js-go-to-subtask-board fallback mirrors the view fallback', () => {
  // Loaded board: real id + slug. (Field-level asserts: the helper runs in a
  // vm realm, so deepStrictEqual would trip on cross-realm prototypes.)
  const loaded = subtaskBoardNavTarget(makeSubtask());
  assert.strictEqual(loaded.id, 'depositBoardId');
  assert.strictEqual(loaded.slug, 'deposit-board');
  // Missing board doc: boardId + default slug, matching the 'board' route
  // params ({ id, slug }).
  const fallback = subtaskBoardNavTarget(makeSubtask({ boardLoaded: false }));
  assert.strictEqual(fallback.id, 'depositBoardId');
  assert.strictEqual(fallback.slug, 'board');
});

// --- NEGATIVE: malformed subtask must warn, never crash ----------------------

test('malformed subtask without any board reference warns instead of navigating', () => {
  const broken = makeSubtask({ boardLoaded: false });
  broken.boardId = undefined;
  let result;
  assert.doesNotThrow(() => {
    result = simulateViewClick(broken);
  });
  assert.strictEqual(result.gone.length, 0);
  assert.deepStrictEqual(result.warned, ['subtaskCardId']);
});

test('subtask without a card id yields no target (never routes to /undefined)', () => {
  assert.strictEqual(subtaskNavTarget({ boardId: 'b1' }), undefined);
});

test('missing/null subtask yields no target and no throw', () => {
  assert.strictEqual(subtaskNavTarget(undefined), undefined);
  assert.strictEqual(subtaskNavTarget(null), undefined);
  assert.strictEqual(subtaskBoardNavTarget(undefined), undefined);
  const { gone, warned } = simulateViewClick(undefined);
  assert.strictEqual(gone.length, 0);
  assert.strictEqual(warned.length, 1);
});

// --- Source-level pins: the handler must keep using the guarded helper -------

test('js-view-subtask handler routes through subtaskNavTarget and guards it', () => {
  const m = handlersSrc.match(
    /'click \.js-view-subtask'\(event\) \{([\s\S]*?)\n  \},/,
  );
  assert.ok(m, 'js-view-subtask handler found in subtasks.js');
  const body = m[1];
  assert.ok(
    /subtaskNavTarget\(/.test(body),
    'handler derives the target via subtaskNavTarget',
  );
  assert.ok(/if \(target\)/.test(body), 'handler guards a missing target');
  assert.ok(
    /console\.warn/.test(body),
    'handler warns (not throws) on a broken subtask',
  );
  // The original #1853 crash pattern must not come back.
  assert.ok(
    !/board\(\)\s*[\s\S]{0,80}board\._id/.test(body),
    'handler must not dereference board._id from subtask.board() directly',
  );
});

test('js-go-to-subtask-board handler routes through subtaskBoardNavTarget', () => {
  const m = handlersSrc.match(
    /'click \.js-go-to-subtask-board'\(\) \{([\s\S]*?)\n  \},/,
  );
  assert.ok(m, 'js-go-to-subtask-board handler found in subtasks.js');
  const body = m[1];
  assert.ok(/subtaskBoardNavTarget\(/.test(body));
  assert.ok(/if \(target\)/.test(body));
  assert.ok(
    !/board\._id/.test(body),
    'handler must not dereference board._id directly',
  );
});

// --- Runner ------------------------------------------------------------------

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\n${passed}/${tests.length} subtaskViewNavigation tests passed`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
