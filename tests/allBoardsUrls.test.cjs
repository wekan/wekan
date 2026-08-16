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
  workspaceNamePath,
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

test('the six sections, and Starred is the default', () => {
  assert.deepStrictEqual(ALL_BOARDS_SECTIONS,
    ['starred', 'templates', 'remaining', 'workspaces', 'archive', 'home']);
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
  const doc = read('docs/Features/Page/All-Boards-URLs.md');
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

test('a workspace nests as deep as its tree does - sub, sub-sub, and further', () => {
  // Nothing here counts levels, and nothing may start: the URL, the lookup back
  // to an id, and the title in the header bar all walk the tree until it ends.
  // A cap would be invisible until somebody made a workspace one level deeper
  // than whoever wrote the cap imagined.
  const DEPTH = 6;
  let leaf = { id: 'w6', name: 'Level Six', children: [] };
  let node = leaf;
  for (let level = DEPTH - 1; level >= 1; level--) {
    node = { id: `w${level}`, name: `Level ${level}`, children: [node] };
  }
  const deepTree = [node];

  // Clicking the deepest one builds the whole trail...
  const url = allBoardsPathForMenu(leaf.id, deepTree, slug);
  const expected = '/allboards/workspaces/'
    + ['level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-six'].join('/');
  assert.strictEqual(url, expected, 'every level is in the address');

  // ...the route splits it back into that many segments...
  const segments = splitWorkspacePath(url.replace('/allboards/workspaces/', ''));
  assert.strictEqual(segments.length, DEPTH);

  // ...it resolves to the leaf, not to an ancestor...
  assert.strictEqual(workspaceIdForSlugPath(deepTree, segments, slug), leaf.id);

  // ...and the header names every one of them, in order.
  assert.deepStrictEqual(workspaceNamePath(deepTree, segments, slug),
    ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level Six']);

  // The route pattern is what allows it: `:path*` captures the whole rest of
  // the address, slashes included. `:path?` would take one segment and a
  // sub-sub-workspace would silently resolve to its parent.
  const router = read('config/router.js');
  assert.ok(router.includes("FlowRouter.route('/allboards/:section?/:path*'"),
    'the trail is captured whole, not one segment of it');

  // ...and the same on the real slugifier, which is what actually runs.
  if (getSlug) {
    assert.strictEqual(allBoardsPathForMenu(leaf.id, deepTree, getSlug), expected);
    assert.deepStrictEqual(
      workspaceNamePath(deepTree, splitWorkspacePath(
        allBoardsPathForMenu(leaf.id, deepTree, getSlug)
          .replace('/allboards/workspaces/', '')), getSlug),
      ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level Six']);
  }
});

test('and the fixture tree round-trips at every level it has', () => {
  // Every node of TREE, not only the leaves: an ancestor is a workspace you can
  // open too, and its URL must not be the trail of one of its children.
  const walk = (nodes, trail = []) => nodes.flatMap(n => {
    const here = [...trail, n];
    return [here, ...walk(n.children || [], here)];
  });
  for (const chain of walk(TREE)) {
    const target = chain[chain.length - 1];
    const url = allBoardsPathForMenu(target.id, TREE, slug);
    const segments = splitWorkspacePath(url.replace('/allboards/workspaces/', ''));
    assert.strictEqual(segments.length, chain.length,
      `${target.name}: one segment per level, ${chain.length} deep`);
    assert.strictEqual(workspaceIdForSlugPath(TREE, segments, slug), target.id,
      `${target.name}: the URL resolves back to it`);
    assert.deepStrictEqual(workspaceNamePath(TREE, segments, slug),
      chain.map(n => n.name), `${target.name}: the header names its whole path`);
  }
});

test('the section the page opens on depends on whether anything is starred', () => {
  const { defaultSection, menuSectionOrder } = require('../models/lib/allBoardsUrls');

  // Starred was ALWAYS the landing section. On an account with nothing starred
  // that is an empty page with a full one behind it, which reads as WeKan
  // having lost the boards. So: Starred when there is something in it,
  // Remaining otherwise - and the menu puts whichever one that is on top, so
  // the highlighted row is the first row.
  assert.strictEqual(defaultSection(true), 'starred');
  assert.strictEqual(defaultSection(false), 'remaining');
  assert.deepStrictEqual(menuSectionOrder(true),
    ['starred', 'remaining', 'home', 'templates', 'archive']);
  assert.deepStrictEqual(menuSectionOrder(false),
    ['remaining', 'starred', 'home', 'templates', 'archive']);
  // The TOP row is the one the page opens on, in both cases. Home sits under
  // the two board lists and does not take the top: after login you are already
  // IN the Home board. docs/Features/Board/Home.md
  for (const starred of [true, false]) {
    assert.strictEqual(menuSectionOrder(starred)[0], defaultSection(starred),
      'the row you land on is the row at the top');
  }

  // Both answers are sections the URL layer knows, or the page would open on a
  // name nothing draws.
  const { ALL_BOARDS_SECTIONS } = require('../models/lib/allBoardsUrls');
  for (const starred of [true, false]) {
    assert.ok(ALL_BOARDS_SECTIONS.includes(defaultSection(starred)));
    for (const section of menuSectionOrder(starred)) {
      assert.ok(ALL_BOARDS_SECTIONS.includes(section), `${section} is a real section`);
    }
  }
  // Only the first two move. Templates and the Archive are the same rows in
  // the same places whichever way round the top two are.
  assert.deepStrictEqual(menuSectionOrder(true).slice(2), menuSectionOrder(false).slice(2));
  assert.deepStrictEqual([...menuSectionOrder(true)].sort(),
    [...menuSectionOrder(false)].sort(), 'and the same five rows either way');
});

test('and `/` lets the page decide, rather than the router deciding for it', () => {
  // `/` names no section. The router used to answer 'starred' for it, which no
  // per-user default could then override - it runs before the user document
  // has necessarily loaded and cannot know whether anything is starred. So it
  // writes null and the page picks.
  const router = read('config/router.js');
  assert.ok(!/renderBoardList\(this, 'starred'\)/.test(router),
    'the home route does not hard-code a section');
  assert.strictEqual((router.match(/renderBoardList\(this, null\)/g) || []).length, 2,
    'both of its paths - Sandstorm and not - leave it open');
  assert.ok(/Session\.set\('boardListMenu', menu \|\| null\)/.test(router),
    'and a missing section is stored as null, not as undefined-in-a-string');

  // The page reads it, and falls back to the rule. An AUTORUN, because on a
  // cold load the user document lands after the template is created: a single
  // read would answer "nothing is starred" for everybody.
  const js = read('client/components/boards/boardsList.js');
  assert.ok(/defaultSection\(hasStarredBoards\(\)\)/.test(js), 'the page applies the rule');
  const at = js.indexOf('defaultSection(hasStarredBoards())');
  const before = js.slice(Math.max(0, at - 400), at);
  assert.ok(/this\.autorun\(\(\) => \{/.test(before),
    'inside an autorun, so it settles when the user document arrives');
  assert.ok(/Session\.get\('boardListMenu'\)/.test(js),
    'and an address that DOES name a section still wins');

  // The question is asked of the USER DOCUMENT, not of the boards. Asking
  // `user.starredBoards()` runs a Boards query whose answer depends on the
  // subscription, so it says "none" early in a cold load and "some" a moment
  // later - drawing Remaining and then jumping to Starred under the reader.
  // Comments stripped first: the function's own comment SAYS
  // `user.starredBoards()` to explain why it does not call it, and a guard that
  // reads prose is checking the explanation rather than the code.
  const fn = js.slice(js.indexOf('function hasStarredBoards()'),
    js.indexOf('function menuItemCountOf(')).replace(/\/\/[^\n]*/g, '');
  assert.ok(/profile\.starredBoards/.test(fn), 'it reads the profile field');
  assert.ok(!/user\.starredBoards\(\)/.test(fn), 'not the subscription-dependent query');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nallBoardsUrls: ${passed} tests passed`);
