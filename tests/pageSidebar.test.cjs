'use strict';

// A page's controls live in a right sidebar, not in a second header bar.
//
// Each page used to be its content plus a strip of buttons above it. The title
// moved to the first header bar (tests/headerBars.test.cjs); the buttons move
// here. A board has its own sidebar and All Boards has its own, so this is the
// shared one for every other page - and pages with no controls at all get no
// sidebar and no hamburger, because an empty panel is worse than none.
//
// Run: node tests/pageSidebar.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const {
  PAGE_SIDEBAR_TEMPLATES, OWN_SIDEBAR_ROUTES,
  hasOwnSidebar, pageSidebarTemplate, hasPageSidebar,
} = require('../models/lib/pageSidebar');

const router = read('config/router.js');
const jade = read('client/components/main/pageSidebar.jade');

// Every template this repo defines, so a name can be checked against reality.
const defined = new Set();
(function walk(dir) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel);
    else if (e.name.endsWith('.jade')) {
      for (const m of read(rel).matchAll(/^template\(name="(\w+)"\)/gm)) defined.add(m[1]);
    }
  }
})('client/components');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('pageSidebar:');

test('every page it maps has a controls template that exists', () => {
  for (const [route, tpl] of Object.entries(PAGE_SIDEBAR_TEMPLATES)) {
    assert.ok(defined.has(tpl), `${route} -> ${tpl}, which no .jade defines`);
    assert.ok(router.includes(`name: '${route}'`), `${route} is not a route`);
  }
});

test('and a page with its own sidebar never gets this one', () => {
  for (const route of OWN_SIDEBAR_ROUTES) {
    assert.ok(hasOwnSidebar(route), `${route} must be known to have its own`);
    assert.strictEqual(pageSidebarTemplate(route), null,
      `${route} has a sidebar already - two would fight over the same corner`);
    assert.strictEqual(hasPageSidebar(route), false);
  }
  // A page nobody mapped gets nothing, rather than an empty panel.
  assert.strictEqual(pageSidebarTemplate('support'), null);
  assert.strictEqual(hasPageSidebar('support'), false);
  assert.strictEqual(hasPageSidebar('nonsense'), false);
});

test('the shell is the board sidebar\'s, themed on an ancestor', () => {
  assert.ok(/\.board-sidebar\.sidebar\.page-sidebar/.test(jade), 'the same shell classes');
  assert.ok(/if hasPageSidebar/.test(jade), 'drawn only where there is something to draw');
  // The theme must be on a wrapper, not on `.sidebar`: every themed sidebar rule
  // is a descendant selector, so a class on the sidebar element matches nothing.
  const shell = /\.board-sidebar\.sidebar\.page-sidebar\(class="([^"]*)"\)/.exec(jade);
  assert.ok(shell && !/themeClass/.test(shell[1]),
    'the theme class on the sidebar element itself would match nothing');
  assert.ok(/\.page-sidebar-theme\(class="\{\{themeClass\}\}"\)/.test(jade),
    'it goes on a wrapper that contains the sidebar');
});

test('it is mounted once, by the layout, on every page', () => {
  const layout = read('client/components/main/layouts.jade');
  assert.ok(/\+pageSidebar/.test(layout), 'the layout renders it');
  assert.strictEqual((layout.match(/\+pageSidebar/g) || []).length, 1, 'exactly once');
});

test('the migrated pages have no second header bar left', () => {
  // Their title moved to the first bar and their controls into the sidebar, so
  // there is nothing left for a second bar to hold. A route naming a template
  // that no longer exists renders "No such template" in that bar.
  for (const bar of ['myCardsHeaderBar', 'dueCardsHeaderBar',
    'globalSearchHeaderBar', 'rulesHeaderBar']) {
    assert.ok(!defined.has(bar), `${bar} must be gone`);
    assert.ok(!router.includes(bar), `and no route may still name ${bar}`);
  }
  // ...and every header bar a route DOES still name must exist.
  const named = [...router.matchAll(/headerBar: '(\w+)'/g)].map(m => m[1]);
  for (const bar of new Set(named)) {
    assert.ok(defined.has(bar), `a route names ${bar}, which no .jade defines`);
  }
});

test('and their handlers followed their markup', () => {
  // A Blaze event map only sees events inside its OWN template, so a handler
  // left on the old header bar would fire for nothing.
  for (const [file, ctl] of [
    ['client/components/main/myCards.js', 'myCardsControls'],
    ['client/components/main/dueCards.js', 'dueCardsControls'],
    ['client/components/main/globalSearch.js', 'globalSearchControls'],
    ['client/components/rules/rulesMain.js', 'rulesControls'],
  ]) {
    const src = read(file);
    assert.ok(new RegExp(`Template\\.${ctl}\\.(events|helpers)`).test(src),
      `${file}: the handlers must be on ${ctl}`);
    assert.ok(!/Template\.\w+HeaderBar\./.test(src),
      `${file}: nothing may still be registered on a header bar that is gone`);
  }
});

test('the hamburger is offered only where it opens something', () => {
  const header = read('client/components/main/header.jade');
  assert.ok(/if hasSidebar\n\s+\.board-header-btns\.header-sidebar-toggle/.test(header),
    'the hamburger is behind a check');
  const js = read('client/components/main/header.js');
  assert.ok(/hasSidebar\(\) \{[\s\S]{0,300}hasPageSidebar\(route\)/.test(js),
    'and that check knows about the shared sidebar');
  // Which sidebar it toggles: the board\'s, All Boards\', or the shared one.
  const at = js.indexOf("'click .js-toggle-page-sidebar'");
  const body = js.slice(at, at + 700);
  assert.ok(/getSidebarInstance\(\)/.test(body), 'a board toggles its own');
  assert.ok(/hasOwnSidebar\(FlowRouter\.getRouteName\(\)\)[\s\S]{0,120}toggleAllBoardsSidebar/.test(body),
    'All Boards toggles its own');
  assert.ok(/togglePageSidebar\(\)/.test(body), 'and every other page the shared one');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\npageSidebar: ${passed} tests passed`);
