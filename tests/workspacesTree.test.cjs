'use strict';

// The workspaces tree: what a drag does to it, and what it refuses to do.
//
// xet7: "when dragging workspace icon and name, there should be empty place
// holder where it can be dropped. if workspace icon and name is dropped between
// workspaces, workspace should be moved there. but dragging workspace to top of
// other workspace should actually make it sub workspace of workspace it was
// dropped to ... there can be unlimited tree hierarchy of workspaces."
//
// Design: docs/Features/Page/Workspaces.md
// Run: node tests/workspacesTree.test.cjs

const assert = require('assert');
const {
  BEFORE, AFTER, INSIDE, EDGE_FRACTION,
  dropPosition, findNode, isSelfOrDescendant, collectIds, hasChildren,
  moveWorkspace, isNoOpMove,
} = require('../models/lib/workspacesTree');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('workspacesTree:');

// A tree with two roots and a child, deep enough to nest into and to nest out of.
const tree = () => [
  { id: 'a', name: 'Alpha', children: [{ id: 'a1', name: 'Alpha one' }] },
  { id: 'b', name: 'Beta' },
];
const ids = t => JSON.stringify(t.map(function shape(n) {
  return n.children && n.children.length
    ? { [n.id]: n.children.map(shape) }
    : n.id;
}));

// ── which third of a row the pointer is in ──────────────────────────────────

test('the top and bottom edges mean between the rows, the middle means inside', () => {
  const h = 40; // a row
  assert.strictEqual(dropPosition(0, h), BEFORE, 'the very top');
  assert.strictEqual(dropPosition(h * EDGE_FRACTION - 0.01, h), BEFORE);
  assert.strictEqual(dropPosition(h / 2, h), INSIDE, 'the middle nests');
  assert.strictEqual(dropPosition(h - h * EDGE_FRACTION + 0.01, h), AFTER);
  assert.strictEqual(dropPosition(h, h), AFTER, 'the very bottom');
});

test('the middle is the BIGGEST target, because nesting has only that one', () => {
  // Reordering can also be done by aiming at the neighbouring row's far edge;
  // nesting cannot be done any other way, so it gets the half.
  assert.ok(EDGE_FRACTION * 2 <= 0.5, 'the two edges together take no more than half');
  const h = 100;
  const inside = [];
  for (let y = 0; y <= h; y += 1) if (dropPosition(y, h) === INSIDE) inside.push(y);
  assert.ok(inside.length > 45, `expected about half the row to nest, got ${inside.length}`);
});

test('a row with no height yet nests rather than dividing by zero (negative)', () => {
  for (const h of [0, -1, NaN, undefined, null, 'tall']) {
    assert.strictEqual(dropPosition(10, h), INSIDE, `height ${JSON.stringify(h)}`);
  }
  for (const y of [NaN, undefined, null, 'high']) {
    assert.strictEqual(dropPosition(y, 40), INSIDE, `offset ${JSON.stringify(y)}`);
  }
});

// ── finding, and the guard that keeps the tree whole ────────────────────────

test('a node is found at any depth, and a missing one is null', () => {
  assert.strictEqual(findNode(tree(), 'a1').name, 'Alpha one');
  assert.strictEqual(findNode(tree(), 'b').name, 'Beta');
  assert.strictEqual(findNode(tree(), 'nope'), null);
  assert.strictEqual(findNode(tree(), ''), null);
  assert.strictEqual(findNode(null, 'a'), null);
});

test('a node is its own descendant, and so is everything under it', () => {
  const a = findNode(tree(), 'a');
  assert.strictEqual(isSelfOrDescendant(a, 'a'), true, 'itself');
  assert.strictEqual(isSelfOrDescendant(a, 'a1'), true, 'its child');
  assert.strictEqual(isSelfOrDescendant(a, 'b'), false, 'a sibling is not');
  assert.strictEqual(isSelfOrDescendant(null, 'a'), false);
});

test('the ids come back in drawing order, parents before their children', () => {
  assert.deepStrictEqual(collectIds(tree()), ['a', 'a1', 'b']);
  assert.deepStrictEqual(collectIds([]), []);
  assert.deepStrictEqual(collectIds(null), []);
  // Junk in the array is skipped rather than throwing.
  assert.deepStrictEqual(collectIds([null, { name: 'no id' }, { id: 'x' }]), ['x']);
});

test('hasChildren is what decides whether a row gets a caret', () => {
  assert.strictEqual(hasChildren(findNode(tree(), 'a')), true);
  assert.strictEqual(hasChildren(findNode(tree(), 'b')), false);
  assert.strictEqual(hasChildren({ id: 'c', children: [] }), false, 'an empty list is not children');
  assert.strictEqual(hasChildren(null), false);
});

// ── the three moves ─────────────────────────────────────────────────────────

test('dropped on the MIDDLE of a workspace, it becomes its last child', () => {
  const next = moveWorkspace(tree(), 'b', 'a', INSIDE);
  assert.strictEqual(ids(next), ids([{ id: 'a', children: [{ id: 'a1' }, { id: 'b' }] }]),
    'Beta is now the second child of Alpha');
});

test('...and a workspace with no children at all becomes a parent', () => {
  const next = moveWorkspace(tree(), 'a1', 'b', INSIDE);
  assert.strictEqual(findNode(next, 'b').children.length, 1,
    'Beta had no children array and has one now');
  assert.strictEqual(findNode(next, 'b').children[0].id, 'a1');
  assert.ok(!findNode(next, 'a').children.length, 'and Alpha has lost it');
});

test('dropped on an EDGE, it becomes a sibling on that side', () => {
  assert.strictEqual(ids(moveWorkspace(tree(), 'b', 'a', BEFORE)),
    ids([{ id: 'b' }, { id: 'a', children: [{ id: 'a1' }] }]), 'before');
  assert.strictEqual(ids(moveWorkspace(tree(), 'a', 'b', AFTER)),
    ids([{ id: 'b' }, { id: 'a', children: [{ id: 'a1' }] }]), 'after');
});

test('a child dragged to a root edge comes OUT of its parent', () => {
  // The way back up the tree: nesting has to be undoable, or a workspace put
  // one level too deep is stuck there.
  const next = moveWorkspace(tree(), 'a1', 'b', AFTER);
  assert.strictEqual(ids(next), ids([{ id: 'a' }, { id: 'b' }, { id: 'a1' }]));
  assert.deepStrictEqual(findNode(next, 'a').children, [], 'and its parent keeps an empty list');
});

test('there is no depth limit: a workspace nests as deep as it is dragged', () => {
  let t = [{ id: 'l0' }, { id: 'l1' }, { id: 'l2' }, { id: 'l3' }, { id: 'l4' }];
  for (const [child, parent] of [['l1', 'l0'], ['l2', 'l1'], ['l3', 'l2'], ['l4', 'l3']]) {
    t = moveWorkspace(t, child, parent, INSIDE);
    assert.ok(t, `${child} into ${parent}`);
  }
  assert.strictEqual(t.length, 1, 'one root left');
  // ...and every level is still reachable from the root.
  assert.deepStrictEqual(collectIds(t), ['l0', 'l1', 'l2', 'l3', 'l4']);
  let depth = 0;
  for (let n = t[0]; n; n = (n.children || [])[0]) depth += 1;
  assert.strictEqual(depth, 5, 'five levels deep');
});

// ── what it refuses ─────────────────────────────────────────────────────────

test('a workspace cannot be dropped into itself or into its own descendant', () => {
  // This is the one that would CORRUPT the tree: the subtree would be cut off
  // from the root and every workspace under it would go with it.
  assert.strictEqual(moveWorkspace(tree(), 'a', 'a', INSIDE), null, 'itself');
  assert.strictEqual(moveWorkspace(tree(), 'a', 'a1', INSIDE), null, 'its own child');
  assert.strictEqual(moveWorkspace(tree(), 'a', 'a1', BEFORE), null, 'or beside its own child');
  // Deeper: a grandchild is a descendant too.
  const deep = moveWorkspace(moveWorkspace(tree(), 'b', 'a1', INSIDE), 'a', 'b', INSIDE);
  assert.strictEqual(deep, null, 'a grandchild is still a descendant');
});

test('junk is refused rather than throwing (negative)', () => {
  for (const [d, t, p] of [
    ['a', 'nope', INSIDE], ['nope', 'a', INSIDE], ['', 'a', INSIDE], ['a', '', INSIDE],
    [null, 'a', INSIDE], ['a', 'b', 'sideways'], ['a', 'b', ''], ['a', 'b', null],
  ]) {
    assert.strictEqual(moveWorkspace(tree(), d, t, p), null,
      `${JSON.stringify([d, t, p])} must be refused`);
  }
  assert.strictEqual(moveWorkspace(null, 'a', 'b', INSIDE), null, 'no tree at all');
});

test('the tree it was given is never modified', () => {
  const before = tree();
  const snapshot = JSON.stringify(before);
  moveWorkspace(before, 'b', 'a', INSIDE);
  moveWorkspace(before, 'a1', 'b', AFTER);
  assert.strictEqual(JSON.stringify(before), snapshot,
    'a move returns a new tree; what is on screen is untouched until the caller says so');
});

test('a move that changes nothing is reported as a no-op', () => {
  // Dropping a workspace back exactly where it already is would otherwise write
  // the same tree to the server and re-render for nothing.
  assert.strictEqual(isNoOpMove(tree(), 'a', 'b', BEFORE), true,
    'Alpha before Beta is where Alpha already is');
  assert.strictEqual(isNoOpMove(tree(), 'b', 'a', AFTER), true,
    'and Beta after Alpha is where Beta already is');
  assert.strictEqual(isNoOpMove(tree(), 'b', 'a', INSIDE), false, 'nesting is a change');
  assert.strictEqual(isNoOpMove(tree(), 'a', 'a', INSIDE), true, 'a refused move is a no-op');
});

// ── the wiring: the template, the handlers and where the fold is kept ───────
//
// The rules above are pure and proved. These pin that the app actually uses
// them, because a rule nothing calls is a rule that does not run.

const fs = require('fs');
const path = require('path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('the drag no longer reads its own anchor text as a dropped board', () => {
  // The bug: with the handles OFF the drag starts on an ANCHOR, and a browser
  // puts that anchor's text into `text/plain` by itself. The drop handler read
  // `text/plain` first and treated the workspace as a board, so nothing
  // happened and the row snapped back. Handles ON started from a span, which
  // carries no text - which is why the same drop worked there.
  const js = read('client/components/boards/boardsList.js');
  const start = js.slice(js.indexOf("'dragstart .workspace-node'"));
  const startBody = start.slice(0, start.indexOf('\n  },'));
  assert.ok(/clearData\(\)/.test(startBody),
    'the drag clears what the browser added before setting its own type');
  const clearAt = startBody.indexOf('clearData()');
  const setAt = startBody.indexOf("setData('application/x-workspace-id'");
  assert.ok(clearAt !== -1 && setAt !== -1 && clearAt < setAt,
    '...and clears it BEFORE, or it would clear its own id too');

  const drop = js.slice(js.indexOf("'drop .workspace-node'"));
  const dropBody = drop.slice(0, drop.indexOf('\n  },'));
  const idAt = dropBody.indexOf("getData(\n      'application/x-workspace-id',");
  const textAt = dropBody.indexOf("getData('text/plain')");
  assert.ok(idAt !== -1, 'the drop reads the workspace id');
  assert.ok(textAt === -1 || idAt < textAt,
    'and decides on it FIRST, before any text the browser may have added');
});

test('the three drops are wired to the pure rules, not re-derived', () => {
  const js = read('client/components/boards/boardsList.js');
  assert.ok(/require\('\/models\/lib\/workspacesTree'\)/.test(js),
    'the page uses the tree module');
  const over = js.slice(js.indexOf("'dragover .workspace-node'"));
  const overBody = over.slice(0, over.indexOf('\n  },'));
  assert.ok(/dropPosition\(evt\.originalEvent\.clientY - rect\.top, rect\.height\)/.test(overBody),
    'which third of the row the pointer is in comes from the pure rule');
  assert.ok(/getBoundingClientRect\(\)/.test(overBody),
    'measured against the ROW, not an offset that depends on what is under the pointer');
  // Refusing a drop is "do not preventDefault", and the self/descendant case
  // has to be refused BEFORE the row is marked.
  assert.ok(/targetEl === draggingEl \|\| draggingEl\.contains\(targetEl\)/.test(overBody),
    'a workspace refuses a drop into itself or its own descendant');
  const refuseAt = overBody.indexOf('draggingEl.contains(targetEl)');
  const preventAt = overBody.indexOf('evt.preventDefault()');
  assert.ok(refuseAt < preventAt, '...by returning before the drop is accepted');

  const move = js.slice(js.indexOf('this.moveWorkspaceInTree ='));
  const moveBody = move.slice(0, move.indexOf('\n  };'));
  assert.ok(/isNoOpMove\(/.test(moveBody), 'a drop that changes nothing saves nothing');
  assert.ok(/moveWorkspace\(tree, draggedId, targetId, position\)/.test(moveBody),
    'and the new tree is the pure rule\'s answer');
  assert.ok(/setWorkspacesTree/.test(moveBody), 'which is what gets saved');
  const setVarAt = moveBody.indexOf('this.workspacesTreeVar.set(next)');
  const callAt = moveBody.indexOf("Meteor.call('setWorkspacesTree'");
  assert.ok(setVarAt !== -1 && setVarAt < callAt,
    'on screen at once, saved behind it');
});

test('the placeholder is a slot the row opens, not a line to aim at', () => {
  const css = read('client/components/boards/boardsList.css');
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const at = code.indexOf('.workspace-node.drop-before::before,');
  assert.notStrictEqual(at, -1, 'the three positions share one slot rule');
  const rule = code.slice(at, code.indexOf('}', at));
  for (const position of ['drop-before::before', 'drop-after::after', 'drop-inside::after']) {
    assert.ok(rule.includes(position), `${position} opens a slot`);
  }
  assert.ok(/height: 30px;/.test(rule), 'the slot is a ROW high, so there is somewhere to drop');
  assert.ok(/border: 2px dashed/.test(rule), 'and it reads as empty rather than as content');
  // Into this one: indented, because that is where the workspace will be.
  // The rule whose selector is ONLY that - the shared slot rule above ends with
  // the same selector, and `indexOf` finds it first.
  const insideRule = [...code.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .find(r => r[1].trim() === '.workspace-node.drop-inside::after');
  assert.ok(insideRule, 'the inside slot has a rule of its own');
  assert.ok(/margin-inline-start: 16px;/.test(insideRule[2]),
    'the "inside" slot is indented one level, which is where the child will sit');
  // Logical, so a right-to-left tree indents from the right by itself.
  assert.ok(!/margin-left|margin-right/.test(insideRule[2]),
    'and by a logical property, so RTL mirrors without a second rule');
});

test('every workspace with children has a caret, and folding hides them', () => {
  const jade = read('client/components/boards/boardsList.jade');
  const tree = jade.slice(jade.indexOf('template(name="workspaceTree")'));
  assert.ok(/if workspaceHasChildren\n\s+a\.workspace-collapse-indicator\.js-collapse-workspace/.test(tree),
    'a workspace with children gets the caret');
  assert.ok(/else\n\s+span\.workspace-collapse-spacer/.test(tree),
    'and one without keeps the width, so rows do not shift as a tree grows');
  // The caret is the FIRST thing in the row - before the drag handle - so the
  // carets of a tree line up whatever the handles toggle says.
  const content = tree.slice(tree.indexOf('.workspace-node-content'));
  assert.ok(content.indexOf('workspace-collapse') < content.indexOf('workspace-drag-handle'),
    'the caret comes before the drag handle');
  // Down while open, right while folded - the same caret a list has.
  assert.ok(tree.indexOf('fa-caret-right') < tree.indexOf('fa-caret-down'),
    'collapsed is the right caret, open is the down one');
  // ONE condition for the children, not two nested blocks: `..` counts block
  // levels and the recursive inclusion reads `../selectedWorkspaceId`.
  assert.ok(/if workspaceShowsChildren\n\s+\+workspaceTree\(nodes=children selectedWorkspaceId=\.\.\/selectedWorkspaceId\)/
    .test(tree), 'children are drawn by one condition, and keep the selected id');

  const js = read('client/components/boards/boardsList.js');
  assert.ok(/workspaceShowsChildren\(\) \{[\s\S]{0,220}hasChildren\(node\)/.test(js),
    'which is "has children"...');
  assert.ok(/workspaceShowsChildren\(\) \{[\s\S]{0,260}getWorkspaceCollapseState/.test(js),
    '...and "not folded"');
  assert.ok(/'click \.js-collapse-workspace'/.test(js), 'the caret is clickable');
  assert.ok(/'keydown \.js-collapse-workspace'/.test(js), 'and reachable from the keyboard');
});

test('the fold is remembered per user, and in a cookie when there is none', () => {
  const utils = read('client/lib/utils.js');
  const get = utils.slice(utils.indexOf('  getWorkspaceCollapseState(workspaceId) {'),
    utils.indexOf('  setWorkspaceCollapseState(workspaceId, collapsed) {'));
  assert.ok(/Session\.get\(key\)/.test(get), 'a Session value first, so the caret answers at once');
  assert.ok(/user\.isWorkspaceCollapsed\(workspaceId\)/.test(get), "then the user's own profile");
  assert.ok(/Users\.getPublicCollapsedWorkspaces/.test(get), '...and a cookie when there is none');

  const models = read('models/users.js');
  assert.ok(/'profile\.collapsedWorkspaces': \{/.test(models), 'the profile field is declared');
  assert.ok(/readCookieMap\('wekan-collapsed-workspaces'\)/.test(models),
    'through the same cookie helpers the other folds use');
  // Only the FOLDED ones are stored: a missing key is an open workspace, which
  // is the right default for one nobody has touched.
  assert.ok(/map\[workspaceId\] === true/.test(models), 'a missing key means open');

  const server = read('server/models/users.js');
  const method = server.slice(server.indexOf('  async setWorkspaceCollapsed(workspaceId, collapsed) {'));
  const body = method.slice(0, method.indexOf('\n  },'));
  assert.ok(/check\(workspaceId, String\)/.test(body) && /check\(collapsed, Boolean\)/.test(body),
    'both arguments are checked');
  // The id becomes part of a DOTTED field path and the tree is written by the
  // client, so an id carrying a `.` or a `$` would address another field.
  assert.ok(/\^\[A-Za-z0-9_-\]\{1,64\}\$/.test(body),
    'and the id is a plain id, because it becomes a field path');
  assert.ok(/\$unset/.test(body), 'unfolding removes the key rather than storing false');
});

test('the design doc exists, and every file it lists does too', () => {
  const doc = read('docs/Features/Page/Workspaces.md');
  for (const section of [
    '## Folding a workspace',
    '## Dragging one workspace onto another',
    '## Unlimited depth',
  ]) {
    assert.ok(doc.includes(section), `${section} must be described`);
  }
  // The three meanings of a drop, in the table that states them.
  for (const meaning of ['previous sibling', 'next sibling', 'last child']) {
    assert.ok(doc.includes(meaning), `the doc says what a drop on each part means: ${meaning}`);
  }
  const paths = [...doc.matchAll(/\| `([a-z][\w./-]+\.(?:jade|css|js|cjs))` \|/g)].map(m => m[1]);
  assert.ok(paths.length >= 6, `expected the file list, found ${paths.length}`);
  for (const rel of paths) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', rel)), `related file missing: ${rel}`);
  }
  // ...and the page it belongs to links to it, or nobody finds it.
  assert.ok(/\(Workspaces\.md\)/.test(read('docs/Features/Page/All-Boards.md')),
    'All Boards links to it');
});

console.log(`\nworkspacesTree: ${passed} tests passed`);
