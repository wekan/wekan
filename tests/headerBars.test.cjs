'use strict';

// The top header: one colour, the page's own name, and one hamburger.
//
// Three things it was not:
//   * the two bars were two shades of the theme, so the header read as two
//     headers stacked;
//   * the first bar said "All Boards" on every page, whatever page it was - the
//     one bar that is always on screen named a place you were not;
//   * the sidebar hamburger was at the end of the SECOND bar, which is the bar
//     whose contents are moving into the sidebar it opens.
//
// Run: node tests/headerBars.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/main/header.jade');
const js = read('client/components/main/header.js');
const colors = read('client/components/boards/boardColors.css');

const { PAGE_TITLE_KEYS, pageTitleKey, headerTitle } = require('../models/lib/pageTitles');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('headerBars:');

test('both bars are the same colour, in every theme', () => {
  // The PROPERTY, not the spelling: what colour does each bar end up? Most
  // themes get there by naming the quick-access bar in the selector list the
  // main bar already has - one hex to keep right rather than two - but a couple
  // say it their own way, and that is fine as long as the answer matches.
  const bg = which => {
    const out = {};
    for (const rule of colors.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const [, selector, body] = rule;
      const decl = /background(?:-color)?:\s*(#[0-9a-fA-F]+)/.exec(body);
      if (!decl) continue;
      for (const m of selector.matchAll(new RegExp(`\\.board-color-([\\w-]+)${which}(?![-\\w])`, 'g'))) {
        if (out[m[1]] === undefined) out[m[1]] = decl[1].toLowerCase();
      }
    }
    return out;
  };
  const main = bg('#header');
  const quick = bg('#header-quick-access');
  const themes = Object.keys(main);
  assert.ok(themes.length >= 15, `expected every theme, found ${themes.length}`);
  for (const t of themes) {
    assert.strictEqual(quick[t], main[t],
      `${t}: the two bars must be one colour`);
  }
  // The unthemed default, too.
  const header = read('client/components/main/header.css');
  const mainDefault = /^#header \{[^}]*background: (#[0-9a-f]+);/m.exec(header);
  const quickDefault = /^#header-quick-access \{[\s\S]*?background: (#[0-9a-f]+);/m.exec(header);
  assert.ok(mainDefault && quickDefault, 'both bars must declare a background');
  assert.strictEqual(quickDefault[1], mainDefault[1], 'and it must be the same one');
});

test('the first bar names the page, not "All Boards"', () => {
  // The house is still the link home; the text beside it is where you ARE.
  assert.ok(/a\(href="\{\{pathFor 'home'\}\}" title="\{\{_ 'all-boards'\}\}"\)/.test(jade),
    'the home link keeps its name as a tooltip');
  assert.ok(/span\.header-page-title/.test(jade), 'and the title has its own element');
  const home = jade.slice(jade.indexOf('span.home-icon.allBoards'), jade.indexOf('// Logo'));
  assert.ok(!/\|\s*\{\{_ 'all-boards'\}\}/.test(home),
    'the literal "All Boards" label must be gone');
});

test('a board title is printed as TEXT, a page title through the translator', () => {
  // A board called "settings" is not the Admin Panel: user text must never go
  // through {{_ }}, and a translation key must.
  assert.ok(/if headerTitleKey\n\s+\| \{\{_ headerTitleKey\}\}/.test(jade),
    'a page title is translated');
  assert.ok(/else\n\s+= headerTitleText/.test(jade), 'a board title is not');
  assert.ok(/headerTitleKey\(\) \{/.test(js) && /headerTitleText\(\) \{/.test(js),
    'both helpers must exist');
});

test('and the title rule itself is pure, so it can be tested', () => {
  // A board wins wherever there is one.
  assert.deepStrictEqual(headerTitle('board', 'My Board'), { title: 'My Board' });
  assert.deepStrictEqual(headerTitle('home', ''), { key: 'all-boards' });
  assert.deepStrictEqual(headerTitle('setting', null), { key: 'admin-panel' });
  assert.deepStrictEqual(headerTitle('archive', undefined), { key: 'archived-boards' });
  // A blank board title is not a title.
  assert.deepStrictEqual(headerTitle('home', '   '), { key: 'all-boards' });
  // A route nobody mapped shows nothing rather than the wrong thing.
  assert.deepStrictEqual(headerTitle('nonsense', null), {});
  assert.strictEqual(pageTitleKey('nonsense'), null);

  // Every key must be a real translation key.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const [route, key] of Object.entries(PAGE_TITLE_KEYS)) {
    assert.ok(key in en, `${route} -> ${key} is not a translation key`);
  }
  // And every route named here must be a route that exists.
  const router = read('config/router.js');
  for (const route of Object.keys(PAGE_TITLE_KEYS)) {
    assert.ok(router.includes(`name: '${route}'`), `${route} is not a route`);
  }
});

test('the hamburger is in the first bar, right of the username', () => {
  const bar = jade.slice(0, jade.indexOf('#header.nodragscroll'));
  const user = bar.indexOf('+headerUserBar');
  const burger = bar.indexOf('js-toggle-page-sidebar');
  assert.notStrictEqual(user, -1, 'the user bar must be in the first bar');
  assert.notStrictEqual(burger, -1, 'and so must the hamburger');
  assert.ok(user < burger, 'the hamburger comes after the username');
  assert.ok(/\.board-header-btns\.header-sidebar-toggle\n\s+\.separator\n\s+a\.board-header-btn\.js-toggle-page-sidebar/.test(bar),
    'divider then hamburger, as the board header had them');
});

test('and it opens whichever sidebar the page has', () => {
  const at = js.indexOf("'click .js-toggle-page-sidebar'");
  assert.notStrictEqual(at, -1, 'the hamburger must be handled');
  const body = js.slice(at, at + 500);
  assert.ok(/getSidebarInstance\(\)/.test(body), "a board toggles the board's own");
  assert.ok(/toggleAllBoardsSidebar\(\)/.test(body), 'every other page the shared one');
  assert.ok(/Utils\.getCurrentBoardId\(\)/.test(body), 'and it is the board that decides');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nheaderBars: ${passed} tests passed`);
