'use strict';

// The shared left menu — docs/Design/Page/Left-Menu.md.
//
// This is the COMBINED suite for that design: the pure helpers, the template, the
// side it appears on (and its mirroring under a right-to-left language), the
// theming, and the layout it shares with the table page. Files under test are the
// ones listed in the Related files table of the design doc.
//
// Every Admin Panel page has the same menu beside its content, and the markup was
// retyped 44 times across seven templates — with, in two of those pages, one
// click handler per entry instead of one per menu.
//
// Run: node tests/leftMenu.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const libSrc = read('models/lib/leftMenu.js');
const jade = read('client/components/settings/leftMenu.jade');
const css = read('client/components/settings/settingBody.css');
const tableCss = read('client/components/settings/tablePage.css');
const doc = read('docs/Design/Page/Left-Menu.md');

const lib = {};
new Function('exports', libSrc.replace(/export function/g, 'function') +
  '\nexports.buildMenuItems = buildMenuItems;\nexports.activeCount = activeCount;' +
  '\nexports.leftMenuData = leftMenuData;')(lib);

console.log('leftMenu:');

// ── pure helpers ────────────────────────────────────────────────────────────

test('buildMenuItems marks exactly one entry active', () => {
  const items = lib.buildMenuItems([
    { id: 'a', icon: 'fa-key', labelKey: 'registration' },
    { id: 'b', icon: 'fa-envelope', labelKey: 'email' },
    { id: 'c', icon: 'fa-users', labelKey: 'accounts' },
  ], 'b');
  assert.strictEqual(items.length, 3);
  assert.strictEqual(lib.activeCount(items), 1,
    'a menu must never highlight two rows - that is what per-entry isXActive ' +
    'helpers drift into');
  assert.strictEqual(items[1].active, true);
  assert.strictEqual(items[0].active, false);
});

test('an unknown or missing active id highlights nothing (negative)', () => {
  const items = [{ id: 'a', labelKey: 'x' }, { id: 'b', labelKey: 'y' }];
  assert.strictEqual(lib.activeCount(lib.buildMenuItems(items, 'nope')), 0);
  assert.strictEqual(lib.activeCount(lib.buildMenuItems(items, undefined)), 0);
  assert.strictEqual(lib.activeCount(lib.buildMenuItems(items, '')), 0);
});

test('a numeric id still matches the active id', () => {
  const items = lib.buildMenuItems([{ id: 1, labelKey: 'x' }], '1');
  assert.strictEqual(items[0].active, true, 'compared as strings');
});

test('conditional entries and separators are handled', () => {
  // A page builds its list with holes (the E-mail entry is absent on Sandstorm).
  const items = lib.buildMenuItems([
    { id: 'a', labelKey: 'x' },
    null,
    { separator: true },
    { id: 'b', labelKey: 'y' },
  ], 'b');
  assert.strictEqual(items.length, 3, 'the null hole is dropped, not rendered');
  assert.deepStrictEqual(items[1], { separator: true });
  assert.strictEqual(items[2].active, true);
});

test('buildMenuItems survives junk input (negative)', () => {
  assert.deepStrictEqual(lib.buildMenuItems(null, 'a'), []);
  assert.deepStrictEqual(lib.buildMenuItems(undefined, undefined), []);
  assert.strictEqual(lib.activeCount(null), 0);
  // An entry with no id/icon/label renders as empty strings, not "undefined".
  const [item] = lib.buildMenuItems([{}], '');
  assert.deepStrictEqual(
    { id: item.id, icon: item.icon, labelKey: item.labelKey }, { id: '', icon: '', labelKey: '' });
});

test('the page keeps its own handler class alongside the shared one', () => {
  const [item] = lib.buildMenuItems([{ id: 'a', labelKey: 'x' }], 'a', 'js-setting-menu');
  assert.strictEqual(item.jsClass, 'js-setting-menu');
  // Per-entry override wins, so a page can keep one odd entry on its own handler.
  const [own] = lib.buildMenuItems([{ id: 'a', labelKey: 'x', jsClass: 'js-other' }], 'a', 'js-setting-menu');
  assert.strictEqual(own.jsClass, 'js-other');
});

// ── the template ────────────────────────────────────────────────────────────

test('the template renders the menu once, from the item list', () => {
  assert.ok(/template\(name="leftMenu"\)/.test(jade));
  assert.ok(/\.side-menu/.test(jade) && /each items/.test(jade),
    'one .side-menu, driven by the items');
  assert.ok(/js-left-menu-item/.test(jade),
    'every entry carries the shared handler class');
  assert.ok(/data-id="\{\{id\}\}"/.test(jade), 'the id is what a handler reads');
  assert.ok(/\{\{_ labelKey\}\}/.test(jade), 'labels are i18n keys, not literals');
  assert.ok(/if separator/.test(jade), 'group separators are supported');
});

test('the template pins no physical side', () => {
  // The side comes from the document direction and logical CSS. A physical side
  // in the markup is how you get a right-hand menu whose contents still read
  // left. (The class name js-left-menu-item is a NAME, not a placement.)
  const markup = jade.replace(/^\s*\/\/-.*$/gm, '');
  assert.ok(!/style=/.test(markup), 'no inline styles to hide a side in');
  assert.ok(!/(padding|margin|border)-(left|right)|text-align:\s*(left|right)|float:/.test(markup),
    'no physical side properties in the markup');
});

// ── side and mirroring ──────────────────────────────────────────────────────

test('the menu mirrors under a right-to-left language', () => {
  const menu = css.slice(css.indexOf('.side-menu {'), css.indexOf('.content-body .main-body {'));
  // Physical properties do not flip; logical ones do.
  assert.ok(!/padding-left|padding-right|margin-left|margin-right/.test(menu),
    'use padding-inline-* / margin-inline-*, never the physical side');
  assert.ok(/padding-inline-start/.test(menu),
    'the entry indent must follow the reading direction');
  assert.ok(/margin-inline-end/.test(menu),
    'the gap after the icon must follow the reading direction');
  // An inset shadow offset sideways is physical too - it shaded the wrong inner
  // edge once the menu mirrored to the right.
  assert.ok(!/box-shadow: inset -/.test(menu),
    'an inset shadow must not be offset on the X axis');
});

test('the design doc states which side, both ways', () => {
  assert.ok(/left-to-right/i.test(doc) && /right-to-left/i.test(doc),
    'both directions must be described');
  assert.ok(/mirror/i.test(doc), 'and that the panel mirrors');
  assert.ok(/dir=rtl/.test(doc), 'naming the mechanism');
});

// ── theme ───────────────────────────────────────────────────────────────────

test('the selected entry is darker and bold, and still themeable', () => {
  // The white background and shadow on the active row are subtle; with the label the
  // same grey as every other entry, which page you were on was easy to miss.
  const active = /\.side-menu ul li\.active > a \{([^}]*)\}/.exec(css);
  assert.ok(active, 'the active entry must be styled');
  assert.ok(/font-weight:\s*bold/.test(active[1]), 'the selected label is bold');
  assert.ok(/color: var\(--theme-accent, #[0-9a-f]{6}\)/.test(active[1]),
    'a per-user accent still wins, over a DARKER fallback - "inherit" was what made ' +
    'the selected entry identical to the unselected ones');
  assert.ok(!/inherit/.test(active[1]), 'the fallback must not inherit the panel grey');
  // The icon goes with the label rather than keeping its own colour.
  assert.ok(/\.side-menu ul li\.active > a i \{[^}]*color: inherit/.test(css),
    'the icon takes the same colour as the label');
  const menu = css.slice(css.indexOf('.side-menu {'), css.indexOf('.content-body .main-body {'));
  // No brand colour may be hard-coded into the menu.
  assert.ok(!/#0079bf|#2980b9|#01628c/.test(menu),
    'no hard-coded WeKan blue in the menu - themeable parts use --theme-accent');
});

test('the design doc explains the theming', () => {
  assert.ok(/## Theme/.test(doc));
  assert.ok(/--theme-accent/.test(doc) && /Change color/.test(doc),
    'name the per-user override and where it is set');
  assert.ok(/inherit/.test(doc), 'and the fallback that keeps the default look');
});

// ── layout shared with the table page ───────────────────────────────────────

test('narrow windows stack the menu above the content', () => {
  const at = tableCss.indexOf('@media screen and (max-width: 800px)');
  assert.ok(at > 0, 'the stacking rule lives with the table page and covers both');
  const block = tableCss.slice(at);
  assert.ok(/\.side-menu \{[^}]*width:\s*100%/.test(block));
  assert.ok(/\.content-body \{\s*flex-wrap:\s*wrap/.test(block));
});

// ── the doc ─────────────────────────────────────────────────────────────────

test('the related-files table lists files that exist', () => {
  assert.ok(doc.includes('| File Path | File Type | Description |'),
    'the related-files table must have those three columns');
  const paths = [...doc.matchAll(/\| `([a-z][\w./-]+\.(?:jade|css|js|cjs))` \|/g)].map(m => m[1]);
  assert.ok(paths.length >= 10, `expected the full file list, found ${paths.length}`);
  for (const rel of paths) {
    assert.ok(fs.existsSync(path.join(root, rel)), `related file missing: ${rel}`);
  }
  assert.strictEqual(new Set(paths).size, paths.length, 'no file listed twice');
});

test('the two page designs cross-link', () => {
  assert.ok(/\[Table\]\(Table\.md\)/.test(doc),
    'Left-Menu.md must link to Table.md - the two compose on the same page');
  assert.ok(fs.existsSync(path.join(root, 'docs/Design/Page/Table.md')));
});

// ── the template and the pages must agree on the data shape ─────────────────

test('what the pages pass is what the template iterates', () => {
  // The whole Admin Panel lost its left menu to this. leftMenu.jade iterates
  // `each items`, and every page handed it the bare ARRAY from buildMenuItems - so
  // Spacebars looked `items` up ON the array, found nothing, and rendered an empty
  // panel on Settings, People, Features, Attachments, Version and Problems alike.
  // Nothing failed: the template was fine, the helper was fine, only the seam between
  // them was wrong. Neither half can be checked alone, so check the seam.
  const iterated = /^\s*each (\w+)\s*$/m.exec(jade);
  assert.ok(iterated, 'the template must iterate a named variable');
  const key = iterated[1];
  const context = lib.leftMenuData([{ id: 'a', labelKey: 'x' }], 'a');
  assert.ok(!Array.isArray(context),
    'a bare array cannot carry a named property for the template to iterate');
  assert.ok(Array.isArray(context[key]),
    `the template iterates \`${key}\`, so the data context must have a \`${key}\` array`);
  assert.strictEqual(context[key].length, 1, 'and it must hold the built entries');
});

test('every page builds its context through that one helper', () => {
  // Six pages, one shape. Calling buildMenuItems directly returns the array again and
  // silently empties that page's menu, so no page may do it.
  const pages = ['settingBody', 'peopleBody', 'adminFeatures', 'attachments',
    'adminReports', 'informationBody'];
  for (const page of pages) {
    const src = read(`client/components/settings/${page}.js`);
    const helper = /menuItems\(\) \{[\s\S]*?\n  \},/.exec(src);
    assert.ok(helper, `${page}: must have a menuItems helper`);
    assert.ok(/leftMenuData\(/.test(helper[0]),
      `${page}: must build its context with leftMenuData`);
    assert.ok(!/return buildMenuItems\(/.test(helper[0]),
      `${page}: returning the bare array renders an empty menu`);
  }
});

// ── pages converted to the shared menu ──────────────────────────────────────

test('Admin Panel / Problems renders the shared menu from data', () => {
  const jade = read('client/components/settings/adminReports.jade');
  // Strip line comments: the collapsed handlers are DESCRIBED in a comment there.
  const js = read('client/components/settings/adminReports.js').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(/\+leftMenu\(menuItems\)/.test(jade), 'renders the shared menu');
  assert.ok(!/\.side-menu/.test(jade), 'no hand-written .side-menu markup left');
  assert.ok(/PROBLEMS_MENU = \[/.test(js), 'its entries are a data list');
  assert.ok(/leftMenuData\(PROBLEMS_MENU/.test(js), 'built by the shared helper');
  // Twelve identical per-entry handlers collapsed to one on the shared class.
  assert.strictEqual((js.match(/'click a\.js-report-/g) || []).length, 0,
    'the per-entry handlers must be gone');
  assert.strictEqual((js.match(/'click \.js-left-menu-item'/g) || []).length, 1,
    'exactly one menu handler');
  // The active row is rendered from activeReport, so the hand DOM toggling that
  // used to fight a re-render must be gone.
  assert.ok(!/side-menu li\.active'\)\.removeClass/.test(js),
    'no manual active-class toggling');
});

test('the shared menu reproduces each page icon shape', () => {
  // Same styling after conversion: an empty span.emoji-icon (Settings,
  // Features), a coloured wrapper (People / Locked users), or a bare icon.
  assert.ok(/if iconWrapCls/.test(jade) && /if emoji/.test(jade),
    'all three icon shapes must be supported');
  const [plain] = lib.buildMenuItems([{ id: 'a', icon: 'fa-list', labelKey: 'x' }], 'a');
  assert.strictEqual(plain.emoji, false);
  assert.strictEqual(plain.iconWrapCls, '');
  const [emoji] = lib.buildMenuItems([{ id: 'b', icon: 'fa-key', labelKey: 'y', emoji: true }], 'b');
  assert.strictEqual(emoji.emoji, true);
  const [red] = lib.buildMenuItems([{ id: 'c', icon: 'fa-lock', labelKey: 'z', iconWrapCls: 'text-red' }], 'c');
  assert.strictEqual(red.iconWrapCls, 'text-red');
});

test('Settings, Features and Info render the shared menu too', () => {
  const pages = [
    ['settingBody', 'settingsMenu()', 'js-setting-menu'],
    ['adminFeatures', 'FEATURES_MENU', 'js-features-menu'],
    ['informationBody', 'INFO_MENU', 'js-setting-menu'],
  ];
  for (const [file, list, jsClass] of pages) {
    const pageJade = read(`client/components/settings/${file}.jade`);
    const pageJs = read(`client/components/settings/${file}.js`);
    assert.ok(/\+leftMenu\(menuItems\)/.test(pageJade), `${file}: renders the shared menu`);
    assert.ok(!/\.side-menu/.test(pageJade), `${file}: no hand-written menu markup left`);
    assert.ok(pageJs.includes(`leftMenuData(${list}`), `${file}: built by the shared helper`);
    assert.ok(pageJs.includes(jsClass), `${file}: keeps its own handler class`);
  }
});

test('Settings keeps its Sandstorm exception and one active pane', () => {
  const js = read('client/components/settings/settingBody.js');
  assert.ok(/isSandstorm \? null :/.test(js),
    'the e-mail entry is still absent on Sandstorm - as a dropped null, not empty markup');
  assert.ok(/function activeSettingId/.test(js),
    'the eight per-pane vars are mapped to ONE active id');
  // Every pane the menu can open must be mapped, or that entry never highlights.
  // No 'account-setting': its three settings moved to Email and Login, so the
  // pane was removed rather than left empty.
  for (const id of ['registration-setting', 'email-setting',
    'tableVisibilityMode-setting',
    'announcement-setting', 'accessibility-setting',
    'layout-setting', 'webhook-setting']) {
    assert.ok(js.includes(`'${id}'`), `${id} must be in both the menu and the id map`);
  }
});

test('Admin Panel / People renders the shared menu from data', () => {
  const pageJade = read('client/components/settings/peopleBody.jade');
  const pageJs = read('client/components/settings/peopleBody.js').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(/\+leftMenu\(menuItems\)/.test(pageJade), 'renders the shared menu');
  assert.ok(!/\.side-menu/.test(pageJade), 'no hand-written menu markup left');
  assert.ok(/PEOPLE_MENU = \[/.test(pageJs) && /leftMenuData\(PEOPLE_MENU/.test(pageJs),
    'its entries are data, built by the shared helper');
  // Seven near-identical handlers collapsed to one.
  for (const old of ['js-org-menu', 'js-team-menu', 'js-people-menu',
    'js-locked-users-menu', 'js-roles-menu', 'js-templates-menu', 'js-domains-menu']) {
    assert.ok(!pageJs.includes(old), `${old} must be gone`);
  }
  assert.strictEqual((pageJs.match(/'click \.js-left-menu-item'/g) || []).length, 1,
    'exactly one menu handler');
  // The per-pane extras must survive the collapse.
  for (const extra of ['refreshOrgsCount', 'refreshTeamsCount', 'refreshUsersCount']) {
    assert.ok(pageJs.includes(extra), `${extra} must still run on its pane`);
  }
  // Active row from state, not from a hand-toggled class.
  assert.ok(/activeMenuId = new ReactiveVar\('org-setting'\)/.test(pageJs),
    'the open pane is state now, and starts on the pane orgSetting starts true for');
  assert.ok(!/side-menu li\.active'\)\.removeClass/.test(pageJs),
    'no manual active-class toggling');
  assert.ok(/iconWrapCls: 'text-red'/.test(pageJs),
    'Locked users keeps its red lock');
});

test('ALL seven Admin Panel pages now render the shared menu', () => {
  // The design is only worth having if nothing is left outside it.
  // Translation moved INTO Settings as a pane, so it no longer has a menu of its
  // own - it is one entry in the Settings menu now.
  const pages = ['settingBody', 'peopleBody', 'adminFeatures', 'attachments',
    'adminReports', 'informationBody'];
  for (const page of pages) {
    const pageJade = read(`client/components/settings/${page}.jade`);
    assert.ok(/\+leftMenu\(menuItems\)/.test(pageJade), `${page}: renders the shared menu`);
    assert.ok(!/\.side-menu/.test(pageJade), `${page}: no hand-written menu markup left`);
  }
});

test('Attachments keeps its Sandstorm entry and its literal label', () => {
  const js = read('client/components/settings/attachments.js');
  assert.ok(/isSandstorm \? \{ id: 'sandstorm'/.test(js),
    'the Sandstorm entry is still Sandstorm-only, as a dropped null elsewhere');
  assert.ok(/label: 'Sandstorm'/.test(js),
    'a proper noun uses label, not an i18n key');
  // The template must render a literal label when there is no key.
  assert.ok(/if labelKey[\s\S]*\{\{_ labelKey\}\}[\s\S]*else[\s\S]*\{\{label\}\}/.test(jade),
    'the template falls back to a literal label');
  const [lit] = lib.buildMenuItems([{ id: 's', label: 'Sandstorm' }], 's');
  assert.strictEqual(lit.label, 'Sandstorm');
  assert.strictEqual(lit.labelKey, '');
});

test('Translation is a Settings pane, not a page of its own', () => {
  const js = read('client/components/settings/settingBody.js');
  const jadeSrc = read('client/components/settings/settingBody.jade');
  assert.ok(/id: 'translation-setting'/.test(js), 'it is an entry in the Settings menu');
  assert.ok(/\+translationSettings/.test(jadeSrc), 'and Settings renders the pane');
  // The old top-level tab and its helper are gone.
  const header = read('client/components/settings/settingHeader.jade');
  assert.ok(!/pathFor 'translation'/.test(header), 'the Admin Panel tab must be gone');
  assert.ok(!/isTranslationActive/.test(read('client/components/settings/settingHeader.js')));
  // The pane carries the state that feeds its table - a child template cannot
  // see a parent page that no longer renders it.
  const body = read('client/components/settings/translationBody.js');
  assert.ok(/Template\.translationSettings\.onCreated/.test(body));
  assert.ok(!/Template\.translation\./.test(body), 'the old page template must be gone');
  // The URL still resolves, redirecting rather than rendering a dead template.
  const router = read('config/router.js');
  assert.ok(!/content: 'translation'/.test(router), 'it must not render the old template');
  assert.ok(/FlowRouter\.go\('setting'\)/.test(router), 'a bookmark must land in Settings');
});

console.log(`\nleftMenu: ${passed} tests passed`);
