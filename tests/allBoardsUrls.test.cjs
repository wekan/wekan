'use strict';

// Every All Boards left-menu entry has a URL, the workspaces tree included.
//
// The page was three addresses - `/` (Starred), `/templates` and `/remaining` -
// and the workspaces tree had none at all. Which workspace you had open was a
// ReactiveVar, so a workspace could not be linked to a colleague, bookmarked,
// opened in a second tab or reached with the back button.
//
// A workspace is addressed by the SLUGS OF ITS NAMES down the tree, not by its
// id: the id is a random string and a URL should say where you are.
//
// Run: node tests/allBoardsUrls.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const {
  ALL_BOARDS_SECTIONS, DEFAULT_SECTION, SECTION_WORKSPACES,
  normalizeSection, resolveSection, workspaceSlug, workspaceSlugPath,
  workspaceIdForSlugPath, splitWorkspacePath, allBoardsPath, allBoardsPathForMenu,
} = require('../models/lib/allBoardsUrls');

// A stub slugifier for the pure tests, and the REAL one for the tests that are
// about the real one. limax is a dependency of the app, not of this test, so
// load it defensively: a missing node_modules must not fail the suite for a
// reason that has nothing to do with what it checks.
const slug = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let getSlug = null;
try {
  getSlug = require('limax');
  if (getSlug && getSlug.default) getSlug = getSlug.default;
} catch (e) { /* not installed here */ }

const TREE = [
  { id: 'w1', name: 'Engineering', children: [
    { id: 'w11', name: 'Backend', children: [] },
    { id: 'w12', name: 'Front End', children: [
      { id: 'w121', name: 'Design System', children: [] },
    ] },
  ] },
  { id: 'w2', name: 'Sales', children: [] },
];

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('allBoardsUrls:');

test('the four sections, and Starred is the default', () => {
  assert.deepStrictEqual(ALL_BOARDS_SECTIONS,
    ['starred', 'templates', 'remaining', 'workspaces']);
  assert.strictEqual(DEFAULT_SECTION, 'starred');
  for (const section of ALL_BOARDS_SECTIONS) {
    assert.strictEqual(allBoardsPath(section, []), `/allboards/${section}`);
  }
  // The examples xet7 asked for, verbatim.
  assert.strictEqual(allBoardsPath('starred', []), '/allboards/starred');
  assert.strictEqual(allBoardsPath('templates', []), '/allboards/templates');
  assert.strictEqual(allBoardsPath('remaining', []), '/allboards/remaining');
  assert.strictEqual(allBoardsPath('workspaces', []), '/allboards/workspaces');
});

test('a section that is not one falls back rather than 404ing', () => {
  // A URL is typed.
  for (const junk of [null, undefined, '', 'nonsense', 7, 'Starred']) {
    assert.strictEqual(normalizeSection(junk), null, `${JSON.stringify(junk)} is not a section`);
    assert.strictEqual(resolveSection(junk), DEFAULT_SECTION);
    assert.strictEqual(allBoardsPath(junk, []), '/allboards/starred');
  }
});

test('a workspace is the slugs of its names, as deep as it nests', () => {
  assert.deepStrictEqual(workspaceSlugPath(TREE, 'w1', slug), ['engineering']);
  assert.deepStrictEqual(workspaceSlugPath(TREE, 'w11', slug), ['engineering', 'backend']);
  assert.deepStrictEqual(workspaceSlugPath(TREE, 'w121', slug),
    ['engineering', 'front-end', 'design-system']);
  assert.strictEqual(
    allBoardsPath(SECTION_WORKSPACES, workspaceSlugPath(TREE, 'w121', slug)),
    '/allboards/workspaces/engineering/front-end/design-system');
  // Not in the tree: null, not a wrong path.
  assert.strictEqual(workspaceSlugPath(TREE, 'nope', slug), null);
  assert.strictEqual(workspaceSlugPath(TREE, '', slug), null);
  assert.strictEqual(workspaceSlugPath(null, 'w1', slug), null);
});

test('and reads back to the same workspace', () => {
  for (const id of ['w1', 'w11', 'w12', 'w121', 'w2']) {
    const p = workspaceSlugPath(TREE, id, slug);
    assert.strictEqual(workspaceIdForSlugPath(TREE, p, slug), id,
      `${p.join('/')} must resolve back to ${id}`);
  }
});

test('a path that names nothing resolves to nothing, not to the wrong one', () => {
  for (const bad of [
    [], ['nope'], ['engineering', 'nope'], ['backend'],            // not a root
    ['engineering', 'backend', 'deeper'],                          // too deep
    ['design-system'],                                             // not at this level
  ]) {
    assert.strictEqual(workspaceIdForSlugPath(TREE, bad, slug), null,
      `${bad.join('/') || '(empty)'} must not resolve`);
  }
  assert.strictEqual(workspaceIdForSlugPath(TREE, null, slug), null);
  assert.strictEqual(workspaceIdForSlugPath(null, ['engineering'], slug), null);
});

test('a name that slugifies to nothing still gets an address', () => {
  // An emoji-only workspace name: the slug is empty, so the id stands in - a
  // workspace with no address at all could not be opened from a link.
  const tree = [{ id: 'w9', name: '🎉', children: [] }];
  assert.strictEqual(workspaceSlug(tree[0], () => ''), 'w9');
  assert.deepStrictEqual(workspaceSlugPath(tree, 'w9', () => ''), ['w9']);
  assert.strictEqual(workspaceIdForSlugPath(tree, ['w9'], () => ''), 'w9');
});

test('the wildcard part splits without producing empty segments', () => {
  // A trailing slash, a double slash or an empty tail must not become a segment
  // that matches nothing.
  assert.deepStrictEqual(splitWorkspacePath('engineering/backend'), ['engineering', 'backend']);
  assert.deepStrictEqual(splitWorkspacePath('engineering/backend/'), ['engineering', 'backend']);
  assert.deepStrictEqual(splitWorkspacePath('engineering//backend'), ['engineering', 'backend']);
  for (const empty of ['', '/', null, undefined, 7]) {
    assert.deepStrictEqual(splitWorkspacePath(empty), []);
  }
});

test('one menu value, either a section or a workspace id', () => {
  // The left menu stores both in one variable, so the path builder has to work
  // out which it is.
  assert.strictEqual(allBoardsPathForMenu('templates', TREE, slug), '/allboards/templates');
  assert.strictEqual(allBoardsPathForMenu('w11', TREE, slug),
    '/allboards/workspaces/engineering/backend');
  // A workspace that has gone (deleted in another tab) falls back to the
  // default section rather than to a URL naming nothing.
  assert.strictEqual(allBoardsPathForMenu('gone', TREE, slug), '/allboards/starred');
});

test('the real slugifier is the one board URLs use', () => {
  if (!getSlug) {
    console.log('    (limax not installed here - skipped)');
    return;
  }
  // Same function as models/boards.js gives a board its slug, so a workspace
  // and a board turn a name into a URL the same way.
  assert.strictEqual(getSlug('Renkaan Vaihto'), 'renkaan-vaihto');
  assert.strictEqual(getSlug('Front End'), 'front-end');
  const tree = [{ id: 'w1', name: 'Renkaan Vaihto', children: [] }];
  assert.deepStrictEqual(workspaceSlugPath(tree, 'w1', getSlug), ['renkaan-vaihto']);
  assert.ok(read('models/boards.js').includes("import getSlug from 'limax'"),
    'which is what models/boards.js imports');
  assert.ok(read('client/components/boards/boardsList.js').includes("import getSlug from 'limax'"),
    'and what the page passes in');
});

// ── the wiring ──────────────────────────────────────────────────────────────

test('the route captures the whole nested path', () => {
  const router = read('config/router.js');
  const at = router.indexOf("FlowRouter.route('/allboards/:section?/:path*'");
  assert.notStrictEqual(at, -1, 'the /allboards route must exist');
  const body = router.slice(at, router.indexOf('\n});', at));
  // `:path*` is zero-or-more SEGMENTS - `[^/]+` would stop at the first slash
  // and a two-level workspace would not resolve.
  assert.ok(/splitWorkspacePath\(params && params\.path\)/.test(body),
    'the wildcard is split into slugs');
  assert.ok(/resolveSection\(params && params\.section\)/.test(body),
    'and the section is resolved, so a typo falls back');
  assert.ok(/Session\.set\(\s*'boardListWorkspacePath'/.test(body),
    'the slugs are handed to the page');
  assert.ok(/renderBoardList\(this, section\)/.test(body), 'which renders All Boards');
});

test('the page is the one that resolves a workspace, once its tree has loaded', () => {
  // The router cannot: the tree is on the user document, which it has no way to
  // read before the page has it.
  const js = read('client/components/boards/boardsList.js');
  assert.ok(/Session\.get\('boardListWorkspacePath'\)/.test(js), 'it reads the slugs');
  assert.ok(/workspaceIdForSlugPath\(tree, slugPath, getSlug\)/.test(js),
    'and resolves them against the tree with the real slugifier');
  // In an autorun, so it re-runs when the tree arrives - a one-shot read would
  // always run before the tree and never select anything.
  const at = js.indexOf("Session.get('boardListWorkspacePath')");
  const before = js.slice(Math.max(0, at - 400), at);
  assert.ok(/this\.autorun\(\(\) => \{/.test(before), 'inside an autorun');
});

test('and the new route counts as an All Boards route', () => {
  // The page filters boards by membership only on the All Boards routes; a
  // route left out of that list falls through to the PUBLIC-boards branch, so
  // the page would show public boards instead of the user's own.
  const js = read('client/components/boards/boardsList.js');
  const at = js.indexOf('const allBoardsRoutes = [');
  assert.notStrictEqual(at, -1);
  const list = js.slice(at, js.indexOf('];', at));
  for (const name of ['home', 'allboards', 'allboards-templates', 'allboards-remaining']) {
    assert.ok(list.includes(`'${name}'`), `${name} must be an All Boards route`);
  }
});

test('a click puts the entry in the address bar', () => {
  const js = read('client/components/boards/boardsList.js');
  assert.ok(/function goToAllBoards\(tpl, menuValue\)/.test(js), 'one function does it');
  assert.ok(/allBoardsPathForMenu\(menuValue, tpl\.workspacesTreeVar\.get\(\), getSlug\)/.test(js),
    'building the path from the tree');
  for (const handler of ["'click .js-select-menu'", "'click .js-select-workspace'"]) {
    const at = js.indexOf(handler);
    assert.notStrictEqual(at, -1, `${handler} must exist`);
    assert.ok(/goToAllBoards\(tpl,/.test(js.slice(at, at + 320)),
      `${handler} must update the URL`);
  }
  // go, not replace, so Back returns to the previous entry - and only when the
  // path would actually change.
  assert.ok(/FlowRouter\.current\(\)\.path !== path/.test(js));
  assert.ok(/FlowRouter\.go\(path\)/.test(js));
});

test('the old section URLs still work, as redirects', () => {
  const router = read('config/router.js');
  for (const [oldPath, section] of [['/templates', 'templates'], ['/remaining', 'remaining']]) {
    const at = router.indexOf(`FlowRouter.route('${oldPath}', {`);
    assert.notStrictEqual(at, -1, `${oldPath} must still resolve`);
    const body = router.slice(at, router.indexOf('\n});', at));
    assert.ok(new RegExp(`redirect\\(allBoardsPath\\('${section}', \\[\\]\\)\\)`).test(body),
      `${oldPath} redirects to /allboards/${section}`);
    // A go() from inside triggersEnter is swallowed - the page never changes.
    assert.ok(!/FlowRouter\.go\(/.test(body), `${oldPath}: must use the handed redirect`);
  }
});

test('the design doc says what the URLs are', () => {
  const doc = read('docs/Design/Page/All-Boards-URLs.md');
  for (const section of ALL_BOARDS_SECTIONS) {
    assert.ok(doc.includes(`/allboards/${section}`), `/allboards/${section} must be documented`);
  }
  assert.ok(/\/allboards\/workspaces\/[\w-]+\/[\w-]+/.test(doc),
    'including a nested workspace');
  for (const m of doc.matchAll(/`([\w.-]+\/[\w./-]+\.(?:jade|js|css|cjs))`/g)) {
    assert.ok(fs.existsSync(path.join(ROOT, m[1])),
      `the design doc names ${m[1]}, which does not exist`);
  }
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nallBoardsUrls: ${passed} tests passed`);
