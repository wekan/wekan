'use strict';

// Bookmarks: the star, on a page that is not a board.
//
// A board could be starred and reached from the dropdown in the first header
// bar. Every other page - All Boards / Remaining, a workspace, Admin Panel /
// Settings / Version - could not, so the one control for "keep this where I can
// get at it" worked on one kind of destination and was absent on the rest, even
// though those pages have had their own addresses for some time.
//
// The group in the header reads caret, count, star, like a browser's bookmarks
// menu: how many places you keep, what they are, and whether this one is among
// them.
//
// Run: node tests/starredPages.test.cjs
// docs/Features/Board/Starred.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const stripComments = src => src.replace(/\/\/[^\n]*/g, '');

const tests = [];
let passed = 0;
const test = (name, fn) => tests.push([name, fn]);

const sp = require('../models/lib/starredPages');
const headerJs = read('client/components/main/header.js');
const headerJade = read('client/components/main/header.jade');
const listJs = read('client/components/boards/boardsList.js');
const listJade = read('client/components/boards/boardsList.jade');
const serverUsers = read('server/models/users.js');

test('only a relative page URL can be starred', () => {
  // What is stored goes into an `href` the reader clicks, so anything that
  // could leave the site is refused rather than cleaned up.
  for (const ok of ['/', '/allboards/remaining', '/admin/settings/version',
    '/allboards/workspaces/engineering/backend', '/b/abc/board?filter=x']) {
    assert.ok(sp.isStarrablePageUrl(ok), `${ok} is a page of this app`);
    assert.strictEqual(sp.normalizePageUrl(ok), ok);
  }
  for (const bad of ['https://evil.example/x', 'http://x', '//evil.example/x',
    'javascript:alert(1)', 'allboards/remaining', '', '   ', null, undefined, 7, {}]) {
    assert.ok(!sp.isStarrablePageUrl(bad), `${JSON.stringify(bad)} is refused`);
    assert.strictEqual(sp.normalizePageUrl(bad), '');
    // ...and refusing means the list is unchanged, not that a bad entry lands.
    assert.deepStrictEqual(sp.toggleStarredPage([], bad, 'x'), []);
  }
  // `//host/path` starts with a slash and leaves the site. It is the one that
  // slips through a naive startsWith('/') test.
  assert.ok(!sp.isStarrablePageUrl('//evil.example/x'));
});

test('a bookmark is its URL and its title', () => {
  const e = sp.pageEntry('/allboards/remaining', 'WeKan - All Boards / Remaining');
  assert.deepStrictEqual(e,
    { url: '/allboards/remaining', title: 'WeKan - All Boards / Remaining' });
  // A blank title falls back to the URL, so a row is never empty.
  assert.strictEqual(sp.pageEntry('/x', '').title, '/x');
  assert.strictEqual(sp.pageEntry('/x', '   ').title, '/x');
  assert.strictEqual(sp.pageEntry('/x').title, '/x');
  assert.strictEqual(sp.pageEntry('https://x', 'T'), null);

  // Anything else in the profile - written by an older version, hand-edited -
  // is dropped rather than drawn.
  assert.deepStrictEqual(sp.starredPagesOf([null, 'x', 7, {}, { url: 'https://x' },
    { url: '/ok', title: 'T' }]), [{ url: '/ok', title: 'T' }]);
  assert.deepStrictEqual(sp.starredPagesOf(undefined), []);
  assert.deepStrictEqual(sp.starredPagesOf('nope'), []);
});

test('the star is one button: it stars, then it unstars', () => {
  let pages = [];
  pages = sp.toggleStarredPage(pages, '/allboards/remaining', 'A');
  assert.strictEqual(pages.length, 1);
  assert.ok(sp.isPageStarred(pages, '/allboards/remaining'));
  assert.ok(!sp.isPageStarred(pages, '/allboards/starred'));

  pages = sp.toggleStarredPage(pages, '/allboards/remaining', 'A');
  assert.deepStrictEqual(pages, [], 'clicking it again takes the page out');

  // Newest LAST, so the list reads in the order the reader built it.
  pages = sp.toggleStarredPage(sp.toggleStarredPage([], '/a', 'A'), '/b', 'B');
  assert.deepStrictEqual(pages.map(p => p.url), ['/a', '/b']);
});

test('starring an already-starred page again takes it OUT, whatever the title', () => {
  // The button is a toggle, and a page whose title has changed is the same
  // page: matching on the URL is what makes the second click predictable.
  const pages = sp.toggleStarredPage([], '/x', 'Old title');
  assert.deepStrictEqual(sp.toggleStarredPage(pages, '/x', 'New title'), []);
});

test('the list is capped, and the cap drops the oldest', () => {
  let pages = [];
  for (let i = 0; i < sp.MAX_STARRED_PAGES + 5; i++) {
    pages = sp.toggleStarredPage(pages, `/p${i}`, `P${i}`);
  }
  assert.strictEqual(pages.length, sp.MAX_STARRED_PAGES, 'it is a dropdown');
  assert.strictEqual(pages[0].url, '/p5', 'the five starred longest ago are gone');
  assert.strictEqual(pages[pages.length - 1].url,
    `/p${sp.MAX_STARRED_PAGES + 4}`, 'and the newest is still there');
});

test('dragging one past another reorders them - one order, two views', () => {
  const P = [{ url: '/a', title: 'A' }, { url: '/b', title: 'B' }, { url: '/c', title: 'C' }];
  assert.deepStrictEqual(sp.moveStarredPage(P, '/c', '/a').map(p => p.url),
    ['/c', '/a', '/b'], 'dropped on the first, it goes first');
  assert.deepStrictEqual(sp.moveStarredPage(P, '/a', '/c').map(p => p.url),
    ['/b', '/a', '/c'], 'dropped on the last, it goes before it');
  assert.deepStrictEqual(sp.moveStarredPage(P, '/a', null).map(p => p.url),
    ['/b', '/c', '/a'], 'no target: the end of the list');

  // No-ops, rather than a list that quietly loses an entry.
  assert.deepStrictEqual(sp.moveStarredPage(P, '/a', '/a').map(p => p.url), ['/a', '/b', '/c']);
  assert.deepStrictEqual(sp.moveStarredPage(P, '/nope', '/a').map(p => p.url), ['/a', '/b', '/c']);
  assert.deepStrictEqual(sp.moveStarredPage(P, '/a', '/nope').map(p => p.url), ['/a', '/b', '/c']);
  // Every move keeps every bookmark.
  for (const [from, to] of [['/a', '/b'], ['/b', '/a'], ['/c', '/b'], ['/a', null]]) {
    assert.deepStrictEqual(sp.moveStarredPage(P, from, to).map(p => p.url).sort(),
      ['/a', '/b', '/c'], `${from} -> ${to} loses nothing`);
  }
});

test('the browser tab says the product name and then where you are', () => {
  assert.strictEqual(sp.pageDocumentTitle('Product name', 'All Boards / Remaining'),
    'Product name - All Boards / Remaining', "xet7's example, verbatim");
  // A page with nothing to say beyond its own name keeps what it had.
  assert.strictEqual(sp.pageDocumentTitle('WeKan', ''), 'WeKan');
  assert.strictEqual(sp.pageDocumentTitle('WeKan', null), 'WeKan');
  assert.strictEqual(sp.pageDocumentTitle('', 'All Boards'), 'All Boards');
  assert.strictEqual(sp.pageDocumentTitle('  WeKan  ', '  All Boards  '), 'WeKan - All Boards');
});

test('and that title is what the tab shows and what a bookmark is named', () => {
  const utils = read('client/lib/utils.js');
  assert.ok(/pageDocumentTitle\(productName, headerPathVar\.get\(\)\)/.test(utils),
    'the tab is composed from the product name and the header path');
  // The path is PUBLISHED by the header, which is the one thing rendered on
  // every page and the one place that already works it out. `Utils` importing
  // the header component instead once ran a module before its own template was
  // registered and threw.
  assert.ok(/headerPathVar\.set\(headerFullPath\(\)\)/.test(headerJs),
    'the header publishes it');
  const leaf = read('client/lib/headerPathVar.js');
  assert.strictEqual((leaf.match(/^import /gm) || []).length, 1,
    'the var lives in a leaf module, so it cannot be half of an import cycle');

  // The bookmark is named with `document.title`, which is that string.
  const handler = stripComments(headerJs.slice(headerJs.indexOf("  'click .js-star-page'(evt) {")));
  assert.ok(/Meteor\.call\('toggleStarredPage', url, document\.title \|\| url/
    .test(handler.slice(0, 600)), 'so a row says where it goes, not a path to parse');
});

test('the star group is caret, count, star - a bookmarks menu', () => {
  const group = headerJade.slice(headerJade.indexOf('.header-star-group'),
    headerJade.indexOf('if isMiniScreen'));
  assert.ok(group.indexOf('fa-caret-down') < group.indexOf('board-star-counter'),
    'the caret opens the list, then the count of what is in it');
  assert.ok(group.indexOf('board-star-counter') < group.indexOf('js-star-page'),
    'and the star is last - whether THIS one is among them');
  // On a board the board's own star is drawn there instead; it also carries the
  // count of members who starred that board.
  assert.ok(/if isBoardPage\n\s+\+boardStarButton/.test(group), 'a board keeps its own');
  assert.ok(/if isPageStarrable/.test(group), 'and every other page stars the page');
  // TWO conditions, not if/else: a comment between an `if` and its `else` is a
  // jade parse error, and it has bitten this file before.
  assert.ok(!/\+boardStarButton\n\s+else/.test(group), 'not an else that a comment can break');

  // Hollow when it is not starred, filled when it is - the one glyph that says
  // both what the state is and what the click will do.
  assert.ok(/fa-star\{\{#unless isCurrentPageStarred\}\}-o\{\{\/unless\}\}/.test(group));
  assert.ok(/click-to-unstar-page.*click-to-star-page/s.test(group)
    || /click-to-star-page/.test(group), 'and says which in its tooltip');
});

test('a board page is never page-starrable, and a bad URL never is', () => {
  const helper = stripComments(headerJs.slice(headerJs.indexOf('  isPageStarrable() {'),
    headerJs.indexOf('  isCurrentPageStarred() {')));
  assert.ok(/Utils\.getCurrentBoardId\(\)\) return false/.test(helper),
    'on a board the board star is the one drawn');
  assert.ok(/isStarrablePageUrl\(currentPagePath\(\)\)/.test(helper),
    'and the address has to be one this app can star');

  // The path comes from the ROUTER, not from window.location: the star has to
  // turn hollow the moment you navigate away, and location is not reactive.
  const pagePath = stripComments(headerJs.slice(headerJs.indexOf('function currentPagePath() {'),
    headerJs.indexOf('// The path after')));
  assert.ok(/FlowRouter\.current\(\)/.test(pagePath), 'read from the router');
  assert.ok(!/window\.location/.test(pagePath), 'so Blaze can watch it');
});

test('the dropdown lists both kinds, and the count counts both', () => {
  const popup = headerJade.slice(headerJade.indexOf('template(name="starredBoardsPopup")'));
  assert.ok(/each currentUser\.starredBoards/.test(popup), 'the boards');
  assert.ok(/each currentUser\.starredPages/.test(popup), 'and the bookmarks');
  assert.ok(popup.indexOf('starredBoards') < popup.indexOf('starredPages'),
    'boards first');
  assert.ok(/\{\{_ 'starred-pages'\}\}/.test(popup),
    'under a heading of their own, so the two kinds are not one flat list');
  assert.ok(/a\(href="\{\{url\}\}"\)/.test(popup), 'each bookmark a link to its URL');
  assert.ok(/span \{\{title\}\}/.test(popup), 'named by its title');

  const count = headerJs.slice(headerJs.indexOf('  starredBoardsCount() {'),
    headerJs.indexOf('  isPageStarrable() {'));
  assert.ok(/boards\.length \+ pages\.length/.test(count),
    'and the count is both, or it says 2 above five rows');

  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['click-to-star-page', 'click-to-unstar-page', 'starred-pages']) {
    assert.ok(en[key], `${key} is translated`);
  }
  // The button names what it opens - both kinds - rather than one of the two.
  assert.ok(/titleKey: 'allboards.starred'/.test(headerJs));
});

test('the bookmarks are tiles in All Boards / Starred', () => {
  // Starred is the list of places you keep, and a bookmark is one of them, so
  // it sits in the same grid rather than somewhere else on the page.
  assert.ok(/if isSelectedMenu 'starred'\n\s+each starredPages/.test(listJade),
    'drawn in the Starred section, and only there');
  const tile = listJade.slice(listJade.indexOf("each starredPages"),
    listJade.indexOf('each boards'));
  assert.ok(/data-url="\{\{url\}\}"/.test(tile) && /draggable="true"/.test(tile),
    'each tile knows its URL and can be picked up');
  // Title AND URL, which is what a bookmark bar shows: the title says where it
  // goes, the address says what it is.
  assert.ok(/span\.bookmark-title/.test(tile) && /\{\{title\}\}/.test(tile), 'the title');
  assert.ok(/span\.bookmark-url \{\{url\}\}/.test(tile), 'and the address under it');
  // Its own way off the list: the header star stars the page you are ON, so a
  // bookmark for somewhere else could otherwise only be removed by going there.
  assert.ok(/js-unstar-bookmark/.test(tile), 'and a way to unstar it from here');
  // A SIBLING of the link, not a child: an `a` inside an `a` is invalid HTML
  // and browsers repair it by closing the outer one early.
  const linkAt = tile.indexOf('a.board-list-item(href=');
  const unstarAt = tile.indexOf('a.js-unstar-bookmark');
  const urlAt = tile.indexOf('span.bookmark-url');
  assert.ok(linkAt < urlAt && urlAt < unstarAt,
    'the URL line is inside the link, and the unstar button is after it');
});

test('...with the template tile\'s white border and the theme behind it', () => {
  const css = read('client/components/boards/boardsList.css');
  const rule = css.slice(css.indexOf('.board-list .board-list-item-bookmark .board-list-item {'));
  const body = rule.slice(0, rule.indexOf('}'));
  // The SAME border the template-container tile carries, so "not an ordinary
  // board" is one signal rather than two different ones.
  const template = css.slice(css.indexOf('.board-list .board-list-item.template-container {'));
  const templateBody = template.slice(0, template.indexOf('}'));
  const borderOf = s => (/border:\s*([^;]+)/.exec(s) || [])[1];
  assert.strictEqual(borderOf(body), borderOf(templateBody),
    'the same white border as the Templates tile');
  assert.ok(/4px solid #fff/.test(borderOf(body)));
  // The theme's own colour behind it, so the tile belongs to this WeKan rather
  // than being a grey box in a coloured page.
  assert.ok(/background:\s*var\(--theme-accent/.test(body), "the applied theme's colour");
  assert.ok(/var\(--theme-accent,\s*#/.test(body),
    'with a fallback, for the themes that predate the variable');
});

test('dragging a tile past another reorders the dropdown too', () => {
  const src = stripComments(listJs);
  // Its own dataTransfer type, so a bookmark and a board cannot be dropped on
  // each other - a board dropped between two bookmarks has no meaning.
  assert.ok(/const BOOKMARK_DRAG = 'application\/x-wekan-bookmark'/.test(src));
  const reader = src.slice(src.indexOf('function isBookmarkDrag(evt)'));
  assert.ok(/dataTransfer\.types/.test(reader.slice(0, 400)),
    'read from types, so dragover can decide before the drop');

  for (const ev of ['dragstart .js-bookmark', 'dragover .js-bookmark',
    'dragleave .js-bookmark', 'drop .js-bookmark']) {
    assert.ok(src.includes(`'${ev}'`), `${ev} is handled`);
  }
  const drop = src.slice(src.indexOf("  'drop .js-bookmark'(evt) {"));
  assert.ok(/Meteor\.call\('moveStarredPage', url, before/.test(drop.slice(0, 900)),
    'the move is persisted, so it survives a reload');
  assert.ok(/url === before\) return/.test(drop.slice(0, 900)),
    'and a tile dropped on itself changes nothing');
  // One array behind both views, so the menu order follows the tiles.
  assert.ok(/moveStarredPage/.test(serverUsers), 'the server owns the order');
});

test('the server refuses what it should, and checks before anything else', () => {
  const toggle = serverUsers.slice(serverUsers.indexOf('  async toggleStarredPage(url, title) {'),
    serverUsers.indexOf('  async moveStarredPage(url, beforeUrl) {'));
  assert.ok(/check\(url, String\)/.test(toggle) && /check\(title, String\)/.test(toggle),
    'both arguments checked');
  const checkAt = toggle.indexOf('check(url, String)');
  const returnAt = toggle.search(/\breturn\b/);
  assert.ok(returnAt === -1 || checkAt < returnAt,
    'and nothing returns first - that raises "Did not check() all arguments"');
  assert.ok(/isStarrablePageUrl\(url\)/.test(toggle),
    'the URL is refused unless it is a relative path...');
  assert.ok(/throw new Meteor\.Error\('invalid-page-url'/.test(toggle),
    '...rather than being cleaned up into something that leaves the site');

  const move = serverUsers.slice(serverUsers.indexOf('  async moveStarredPage(url, beforeUrl) {'));
  const moveBody = move.slice(0, move.indexOf('\n  },'));
  assert.ok(/check\(url, String\)/.test(moveBody), 'the move checks too');
  assert.ok(/check\(beforeUrl, Match\.OneOf\(String, null\)\)/.test(moveBody),
    'and null means "the end of the list", which has to be allowed through');
  // Both write only the caller's own profile.
  for (const body of [toggle, moveBody]) {
    assert.ok(/Users\.updateAsync\(this\.userId/.test(body),
      'a user can only star for themselves');
  }
});

test('the design doc is there and says what all of it does', () => {
  const doc = read('docs/Features/Board/Starred.md');
  for (const phrase of ['bookmark', 'relative', 'Product name - All Boards / Remaining',
    'template-container', '--theme-accent', 'moveStarredPage', 'caret',
    'toggleStarredPage']) {
    assert.ok(doc.includes(phrase), `the doc must explain ${phrase}`);
  }
  assert.ok(/docs\/Features\/Board\/Starred\.md/.test(headerJs)
    && /docs\/Features\/Board\/Starred\.md/.test(listJs), 'and the code points at it');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nstarredPages: ${passed} tests passed`);
