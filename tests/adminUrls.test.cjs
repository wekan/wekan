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
  paneIdForSlug, slugForPaneId, resolvePaneId, adminPath, adminRoutePath,
  ADMIN_PANE_TITLES, adminPaneTitle,
} = require('../models/lib/adminUrls');

const router = read('config/router.js');

// A page's menu entries: pane id -> whichever label form it carries. Same
// scoping and comment-stripping as menuIdsOf below, and the same reason.
function menuLabelsOf(file, marker) {
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
  const out = new Map();
  for (const m of src.slice(open, i).matchAll(/\{\s*id:\s*'([\w-]+)'([^{}]*)\}/g)) {
    const key = /labelKey:\s*'([\w.-]+)'/.exec(m[2]);
    const label = /label:\s*'([^']+)'/.exec(m[2]);
    if (key) out.set(m[1], { titleKey: key[1] });
    else if (label) out.set(m[1], { title: label[1] });
  }
  return out;
}

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
  problems: ['client/components/settings/adminProblems.js', 'const PROBLEMS_MENU = ['],
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

test('every pane is named in the URL, the default one included', () => {
  // This USED to leave the default pane unnamed - `/settings` rather than
  // `/settings/version` - so the address of "Settings" and the address of
  // "Settings showing Version" were one string. The address is meant to say
  // where you are, and the first pane is somewhere too. The bare page address
  // still resolves: it redirects here rather than being a second name for it.
  for (const page of ADMIN_PAGE_KEYS) {
    const cfg = ADMIN_PAGES[page];
    const expected = `${cfg.base}/${cfg.defaultSlug}`;
    assert.strictEqual(adminPath(page, cfg.defaultSlug), expected);
    assert.strictEqual(adminPath(page, cfg.panes[cfg.defaultSlug]), expected);
  }
  // The examples xet7 asked for, verbatim.
  assert.strictEqual(adminPath('settings', 'version-setting'), '/admin/settings/version');
  assert.strictEqual(adminPath('people', 'registration-setting'), '/admin/people/login');
  assert.strictEqual(adminPath('settings', 'tableVisibilityMode-setting'), '/admin/settings/visibility');
  assert.strictEqual(adminPath('settings', 'webhook-setting'), '/admin/settings/global-webhooks');
});

test('and the panel lives under /admin, where the app is not', () => {
  // The four pages sat at the TOP level - /settings, /people, /attachments -
  // as if they were pages of the app rather than of the Admin Panel. Worse,
  // /attachments is also the path the file server serves attachments from
  // (server/routes/universalFileServer.js), so the panel and the files were
  // claiming one address.
  for (const page of ADMIN_PAGE_KEYS) {
    const cfg = ADMIN_PAGES[page];
    assert.ok(cfg.base.startsWith('/admin/'), `${page} is under /admin`);
    // ...and it says where it used to be, so the old address can redirect.
    assert.ok(typeof cfg.legacyBase === 'string' && cfg.legacyBase.startsWith('/'),
      `${page} records the path it used to answer on`);
    assert.notStrictEqual(cfg.legacyBase, cfg.base, 'which is not where it is now');
  }
  const fileServer = read('server/routes/universalFileServer.js');
  assert.ok(fileServer.includes("WebApp.handlers.use('/attachments'"),
    'the collision this avoided is real: the file server owns /attachments');
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
    // The path is built by the module, so the route and the links cannot
    // disagree about it; the guard checks the module produced what it should.
    assert.strictEqual(adminRoutePath(page), `${base}/:pane`,
      `${base}/:pane is the route pattern`);
    const at = router.indexOf(`FlowRouter.route(adminRoutePath('${page}')`);
    assert.notStrictEqual(at, -1, `${base} must be a route`);
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
    ['problems', 'client/components/settings/adminProblems.js', 'problemsOpenPane'],
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

test('and every path the panel used to answer on redirects', () => {
  // Three shapes per page: the bare new address, the bare old one, and the old
  // one WITH a pane - a bookmarked /settings/global-webhooks has to land on
  // the same pane, not on the top of the panel.
  const at = router.indexOf('Object.keys(ADMIN_PAGES).forEach(page => {');
  assert.notStrictEqual(at, -1, 'the redirects are built from the same map the URLs are');
  const body = router.slice(at, router.indexOf('\n});', at));
  assert.ok(/FlowRouter\.route\(cfg\.base,/.test(body), 'the bare new address');
  assert.ok(/FlowRouter\.route\(cfg\.legacyBase,/.test(body), 'the bare old one');
  assert.ok(/FlowRouter\.route\(`\$\{cfg\.legacyBase\}\/:pane`/.test(body),
    'and the old one with a pane in it');
  assert.ok(/adminPath\(page, \(context\.params \|\| \{\}\)\.pane\)/.test(body),
    'which keeps the pane it names');
  // Handed the `redirect`, never FlowRouter.go(): go() from inside
  // triggersEnter happens while the route is still entering and is swallowed,
  // so nothing renders at all.
  assert.ok(!/FlowRouter\.go\(/.test(body), 'redirects with what it is handed');
});

test('the old singular /setting still works', () => {
  const at = router.indexOf("FlowRouter.route('/setting', {");
  assert.notStrictEqual(at, -1, '/setting must still resolve');
  const body = router.slice(at, router.indexOf('\n});', at));
  assert.ok(/redirect\(/.test(body), 'as a redirect');
  assert.ok(!/content: 'setting'/.test(body), 'not as a second copy of the page');
  // The route NAME stays `setting`, so every `{{pathFor 'setting'}}` in the
  // templates keeps working and now points under /admin.
  assert.ok(/FlowRouter\.route\(adminRoutePath\('settings'\), \{\n\s+name: 'setting',/.test(router),
    "the Settings route keeps the name 'setting'");
  for (const jade of ['client/components/settings/settingHeader.jade',
    'client/components/users/userHeader.jade']) {
    assert.ok(/pathFor 'setting'/.test(read(jade)), `${jade} links by route name`);
  }
});

test('the design doc says what the URLs are', () => {
  const doc = read('docs/Features/Page/Admin-Panel-URLs.md');
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

test('the title bar names the pane, in the menu row\'s own words', () => {
  // "Admin Panel / Settings / Version": the address names three things and so
  // does the title. This is a SECOND copy of the menu's labels - the header is
  // a separate Blaze instance from the Admin Panel's pages and must not import
  // them, so it cannot read the menus - and nothing but this guard keeps the
  // two equal.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const page of ADMIN_PAGE_KEYS) {
    const labels = menuLabelsOf(...MENU_SOURCE[page]);
    for (const [slug, paneId] of Object.entries(ADMIN_PAGES[page].panes)) {
      const got = adminPaneTitle(page, slug);
      assert.ok(got.titleKey || got.title, `${page}/${slug} has no title`);
      const want = labels.get(paneId);
      assert.ok(want, `${MENU_SOURCE[page][0]}: ${paneId} has no menu label to match`);
      assert.deepStrictEqual(got, want,
        `${page}/${slug}: the bar and the menu row that opens it must say the same words`);
      // A key has to be a real one; a literal label is a name that is not
      // translated (PWA is a product name), and stays as written.
      if (got.titleKey) assert.ok(got.titleKey in en, `${got.titleKey} is not a translation key`);
    }
    // No pane in the title map that the page does not have.
    for (const slug of Object.keys(ADMIN_PANE_TITLES[page])) {
      assert.ok(slug in ADMIN_PAGES[page].panes, `${page}/${slug} is not a pane`);
    }
  }
  // An unknown slug titles nothing, rather than naming a pane that is not open.
  assert.deepStrictEqual(adminPaneTitle('settings', 'nonsense'), {});
  assert.deepStrictEqual(adminPaneTitle('nonsense', 'version'), {});

  // ...and the bar draws it, from the URL rather than from the page. It is one
  // entry of the title TRAIL - the Admin Panel and All Boards both have a path
  // and they do not have the same number of segments, so a helper per segment
  // could only ever serve whichever page was written first.
  const js = read('client/components/main/header.js');
  assert.ok(/function headerTitleTrailOf\(\)/.test(js), 'the path is built');
  assert.ok(/adminPaneTitle\(page, params\.pane \|\| ADMIN_PAGES\[page\]\.defaultSlug\)/.test(js),
    'read from the URL, with the default pane when the URL names none');
  // The bar shows the ROOT only; the path is the title's TOOLTIP. It grows -
  // a workspace nests as deep as its tree does - and this bar is the one strip
  // always on screen and already short of width.
  const jade = read('client/components/main/header.jade');
  // The element carries a class as well now - on a board it is also the rename
  // button (#4990) - so this pins the tooltip, which is what the test is about,
  // and not the whole attribute list.
  assert.ok(/span\.header-page-title\(title="\{\{headerTitleFullPath\}\}"/.test(jade),
    'and the bar carries it in the title tooltip');
  assert.ok(!/each headerTitleTrail/.test(jade), 'and does not draw it inline any more');
  assert.ok(/headerTitleFullPath\(\) \{/.test(js), 'the tooltip helper exists');
  // A `title` attribute is plain text, so the path is resolved in JS - and a
  // workspace's own name still must not go through the translator.
  //
  // In `headerFullPath()`, a plain function: the browser tab needs the same
  // string (docs/Features/Board/Starred.md) and a Blaze helper cannot be called
  // from outside its template, so the helper delegates to it.
  const at = js.indexOf('function headerFullPath() {');
  assert.notStrictEqual(at, -1, 'the path is built in one place');
  const body = js.slice(at, js.indexOf('\n}', at));
  assert.ok(/part\.key \? TAPi18n\.__\(part\.key\) : part\.title/.test(body),
    'each segment translated only if it IS a key');
  assert.ok(/join\(' \/ '\)/.test(body), 'joined with the same separator it used to draw');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nadminUrls: ${passed} tests passed`);
