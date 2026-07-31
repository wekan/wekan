'use strict';

// Every Admin Panel left-menu entry has its own URL.
//
// The panel was four addresses - /setting, /people, /admin-reports,
// /attachments - each opening whatever pane its page happened to open first.
// Which pane you were looking at was ReactiveVar state and nothing else, so a
// pane could not be linked, bookmarked, opened in a second tab or reached with
// the back button, and /setting always landed on Version.
//
// The map is checked against the REAL menus in both directions, because a slug
// that names nothing renders an empty panel and a pane with no slug cannot be
// linked - and neither shows up until somebody clicks that row.
//
// Run: node tests/adminUrls.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const {
  ADMIN_PAGES, ADMIN_PAGE_KEYS,
  paneIdForSlug, slugForPaneId, resolvePaneId, adminPath,
} = require('../models/lib/adminUrls');

const router = read('config/router.js');

// The pane ids a page's menu really offers.
//
// Scoped to the MENU definition, not to the whole file: `{ id: '...' }` is also
// how the shared table page declares a filter, so a file-wide grep counted
// People's "Show: all / locked / active" filter as a menu entry with no URL.
// Comments are stripped too, so a pane named in prose is not counted as one.
function menuIdsOf(file, marker) {
  const src = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const at = src.indexOf(marker);
  assert.notStrictEqual(at, -1, `${file}: no menu definition matching ${marker}`);
  const open = src.indexOf('[', at);
  let depth = 1;
  let i = open + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') depth--;
    i++;
  }
  const menu = src.slice(open, i);
  return new Set([...menu.matchAll(/\{\s*id:\s*'([\w-]+)'/g)].map(m => m[1]));
}

const MENU_SOURCE = {
  settings: ['client/components/settings/settingBody.js', 'function settingsMenu('],
  people: ['client/components/settings/peopleBody.js', 'function peopleMenu('],
  problems: ['client/components/settings/adminReports.js', 'const PROBLEMS_MENU = ['],
  attachments: ['client/components/settings/attachments.js', 'function attachmentsMenu('],
};

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('adminUrls:');

test('every slug is lowercase, and reads as words rather than as an id', () => {
  for (const page of ADMIN_PAGE_KEYS) {
    for (const slug of Object.keys(ADMIN_PAGES[page].panes)) {
      assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/,
        `${page}/${slug} must be lowercase words separated by -`);
      // The pane ids are internal (`tableVisibilityMode-setting`, `report-cpu`);
      // a URL is something a person types and reads.
      assert.ok(!/-setting$/.test(slug), `${page}/${slug} still reads like a pane id`);
      assert.ok(!/^report-/.test(slug), `${page}/${slug} still reads like a pane id`);
    }
  }
});

test('and no two panes of a page share one', () => {
  for (const page of ADMIN_PAGE_KEYS) {
    const paneIds = Object.values(ADMIN_PAGES[page].panes);
    assert.strictEqual(new Set(paneIds).size, paneIds.length,
      `${page} maps two slugs to one pane`);
  }
});

test('every slug names a pane the page actually has', () => {
  for (const page of ADMIN_PAGE_KEYS) {
    const real = menuIdsOf(...MENU_SOURCE[page]);
    for (const [slug, paneId] of Object.entries(ADMIN_PAGES[page].panes)) {
      assert.ok(real.has(paneId),
        `/${page}/${slug} opens ${paneId}, which ${MENU_SOURCE[page][0]} has no menu entry for`);
    }
  }
});

test('and every menu entry has a slug, so every pane can be linked', () => {
  // A pane with no URL is one nobody can bookmark - and it is invisible until
  // somebody notices its address does not change.
  const KNOWN_UNROUTED = {
    settings: new Set(),
    people: new Set(),
    problems: new Set(),
    attachments: new Set(),
  };
  for (const page of ADMIN_PAGE_KEYS) {
    for (const paneId of menuIdsOf(...MENU_SOURCE[page])) {
      if (KNOWN_UNROUTED[page].has(paneId)) continue;
      assert.ok(slugForPaneId(page, paneId),
        `${page}: the menu entry ${paneId} has no URL`);
    }
  }
});

test('the default pane is the bare page URL, not a redundant slug', () => {
  // One address for "the Settings page", not two.
  for (const page of ADMIN_PAGE_KEYS) {
    const cfg = ADMIN_PAGES[page];
    assert.strictEqual(adminPath(page, cfg.defaultSlug), cfg.base);
    assert.strictEqual(adminPath(page, cfg.panes[cfg.defaultSlug]), cfg.base);
  }
  // The examples xet7 asked for, verbatim.
  assert.strictEqual(adminPath('settings', 'version-setting'), '/settings');
  assert.strictEqual(adminPath('settings', 'tableVisibilityMode-setting'), '/settings/visibility');
  assert.strictEqual(adminPath('settings', 'webhook-setting'), '/settings/global-webhooks');
});

test('a slug that is not one falls back to the default, not to nothing', () => {
  // A URL is typed, and a typo must not render an empty panel.
  for (const page of ADMIN_PAGE_KEYS) {
    const cfg = ADMIN_PAGES[page];
    const fallback = cfg.panes[cfg.defaultSlug];
    for (const junk of [null, undefined, '', 'nonsense', 7, '../etc']) {
      assert.strictEqual(paneIdForSlug(page, junk), null, `${JSON.stringify(junk)} is not a slug`);
      assert.strictEqual(resolvePaneId(page, junk), fallback, 'and resolves to the default');
    }
  }
  // An unknown PAGE is answered too, rather than throwing.
  assert.strictEqual(resolvePaneId('nonsense', 'version'), null);
  assert.strictEqual(adminPath('nonsense', 'version'), null);
});

test('the routes take the slug and hand the pane to the page', () => {
  for (const page of ADMIN_PAGE_KEYS) {
    const base = ADMIN_PAGES[page].base;
    const at = router.indexOf(`FlowRouter.route('${base}/:pane?'`);
    assert.notStrictEqual(at, -1, `${base}/:pane? must be a route`);
    const body = router.slice(at, router.indexOf('\n});', at));
    assert.ok(new RegExp(`resolvePaneId\\('${page}',`).test(body),
      `${base}: the slug must be resolved to a pane id`);
    assert.ok(/Session\.set\('\w+OpenPane'/.test(body),
      `${base}: and handed to the page`);
  }
});

test('and the pages open it, and put a clicked pane back in the URL', () => {
  const pages = [
    ['settings', 'client/components/settings/settingBody.js', 'settingsOpenPane'],
    ['people', 'client/components/settings/peopleBody.js', 'peopleOpenPane'],
    ['problems', 'client/components/settings/adminReports.js', 'problemsOpenPane'],
    ['attachments', 'client/components/settings/attachments.js', 'attachmentsOpenPane'],
  ];
  for (const [page, file, sessionKey] of pages) {
    const src = read(file);
    assert.ok(src.includes(`Session.get('${sessionKey}')`),
      `${file} must open the pane the URL asks for`);
    assert.ok(new RegExp(`adminPath\\('${page}',`).test(src),
      `${file}: a clicked pane must go into the address bar`);
    // FlowRouter.go, not replace: Back must return to the previous pane rather
    // than leaving the Admin Panel.
    assert.ok(/FlowRouter\.go\(path\)/.test(src), `${file}: pushes, so Back works`);
    // ...and only when it would actually change, or every click is a navigation.
    assert.ok(/FlowRouter\.current\(\)\.path !== path/.test(src),
      `${file}: must not navigate to the URL it is already on`);
  }
});

test('the old singular /setting still works', () => {
  const at = router.indexOf("FlowRouter.route('/setting', {");
  assert.notStrictEqual(at, -1, '/setting must still resolve');
  const body = router.slice(at, router.indexOf('\n});', at));
  assert.ok(/redirect\(/.test(body), 'as a redirect');
  assert.ok(!/content: 'setting'/.test(body), 'not as a second copy of the page');
  // The route NAME stays `setting`, so every `{{pathFor 'setting'}}` in the
  // templates keeps working and now points at /settings.
  assert.ok(/FlowRouter\.route\('\/settings\/:pane\?', \{\n\s+name: 'setting',/.test(router),
    "the plural route keeps the name 'setting'");
  for (const jade of ['client/components/settings/settingHeader.jade',
    'client/components/users/userHeader.jade']) {
    assert.ok(/pathFor 'setting'/.test(read(jade)), `${jade} links by route name`);
  }
});

test('the design doc says what the URLs are', () => {
  const doc = read('docs/Design/Page/Admin-Panel-URLs.md');
  for (const page of ADMIN_PAGE_KEYS) {
    for (const slug of Object.keys(ADMIN_PAGES[page].panes)) {
      const url = adminPath(page, slug);
      assert.ok(doc.includes(url), `${url} must be in the design doc`);
    }
  }
  for (const m of doc.matchAll(/`([\w.-]+\/[\w./-]+\.(?:jade|js|css|cjs))`/g)) {
    assert.ok(fs.existsSync(path.join(ROOT, m[1])),
      `the design doc names ${m[1]}, which does not exist`);
  }
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nadminUrls: ${passed} tests passed`);
