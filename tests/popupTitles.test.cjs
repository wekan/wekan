'use strict';

// Every popup has a title, and they all get one the same way.
// Run: node tests/popupTitles.test.cjs
//
// A pop-over's header is drawn from its title. With no title it renders as
// `no-title`: no header, and so no close button and no back arrow - Escape or a
// click away are the only ways out. That is wrong anywhere and worst on a
// confirmation, which is where it was noticed ("Are you sure you want to delete
// this background image?" had no header at all).
//
// ONE way to give one, and it is the way 151 of them already used: a
// `<name>Popup-title` key in imports/i18n/data/en.i18n.json. The second
// mechanism - `Popup.open(name, { titleKey })` - is not a different way but the
// same one pointed at a phrase the app HAS: "Custom Fields", "Sort Boards",
// "Show on Card". Those exist so a word already translated into 147 languages
// is not copied into a second key that would start as English in all of them.
//
// So this guard is: every popup template resolves a title through one of those
// two, and a new popup cannot ship without one.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function walk(dir, ext, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (full.endsWith(ext)) out.push(full);
  }
  return out;
}

const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const jadeFiles = walk(path.join(ROOT, 'client'), '.jade');
const jsSource = walk(path.join(ROOT, 'client'), '.js')
  .map(f => fs.readFileSync(f, 'utf8')).join('\n');

// Every popup template in the client.
const popupNames = new Set();
for (const file of jadeFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/template\(name="([a-zA-Z]+)Popup"\)/g)) {
    popupNames.add(match[1]);
  }
}

// A popup opened with an explicit key: `Popup.open('name', { titleKey: '...' })`
// - the same mechanism, pointed at a phrase the app already translates.
const explicitTitleKeys = new Map();
for (const match of jsSource.matchAll(
  /Popup\.open\(\s*'([a-zA-Z]+)'\s*,\s*\{\s*titleKey:\s*'([^']+)'/g)) {
  explicitTitleKeys.set(match[1], match[2]);
}

// The two that deliberately have no title, with the reason.
const UNTITLED = {
  // Leftover: its body is the archive-board confirmation, and nothing opens it
  // under this name. Removing it is a separate change from titling everything.
  boardCreateRule: 'not opened anywhere; its body belongs to archiveBoardPopup',
};

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('popupTitles:');

test('every popup resolves a title', () => {
  const missing = [];
  for (const name of [...popupNames].sort()) {
    if (name in UNTITLED) continue;
    const conventionKey = `${name}Popup-title`;
    if (en[conventionKey]) continue;
    const explicit = explicitTitleKeys.get(name);
    if (explicit && en[explicit]) continue;
    missing.push(name);
  }
  assert.deepStrictEqual(missing, [],
    'these popups would render with no header, and so with no close button');
});

test('the convention is the common way, by a long way', () => {
  const byConvention = [...popupNames].filter(n => en[`${n}Popup-title`]);
  assert.ok(byConvention.length > popupNames.size * 0.9,
    `${byConvention.length} of ${popupNames.size} popups are titled by their own key`);
});

test('an explicit titleKey names a phrase that exists (negative)', () => {
  // The point of `titleKey` is to reuse a translated phrase. Pointing it at a
  // key nobody has translated is the failure it exists to avoid, and it fails
  // silently: the popup renders with no header.
  for (const [popup, key] of explicitTitleKeys) {
    assert.ok(en[key], `${popup} points at '${key}', which en.i18n.json does not have`);
  }
});

test('Requested By and Assigned By reuse their existing translated titles', () => {
  assert.strictEqual(explicitTitleKeys.get('cardRequestedBy'), 'requested-by');
  assert.strictEqual(explicitTitleKeys.get('cardAssignedBy'), 'assigned-by');
  assert.strictEqual(en['requested-by'], 'Requested By');
  assert.strictEqual(en['assigned-by'], 'Assigned By');
});

test('the confirmations that had no header now have one', () => {
  // The ones this came from. A question about deleting something is the worst
  // place for a pop-over you can only leave by pressing Escape.
  for (const name of ['deleteBoardBackground', 'deleteDuplicateLists', 'userDelete']) {
    assert.ok(en[`${name}Popup-title`], `${name} has a title`);
  }
  assert.strictEqual(en['deleteBoardBackgroundPopup-title'], 'Delete Background Image');
});

test('a title key is only added where the app has no words already (negative)', () => {
  // The four that reuse an existing phrase keep doing so - adding
  // `showOnCardPopup-title` etc. would put a second copy of one phrase into 147
  // language files, English in every one of them until somebody translates it
  // again.
  for (const name of ['showOnCard', 'showOnMinicard', 'boardsSort']) {
    assert.ok(!en[`${name}Popup-title`], `${name} has no key of its own`);
    assert.ok(explicitTitleKeys.has(name), `${name} points at one the app has`);
  }
});

test('the popup takes both, in that order', () => {
  const popup = read('client/lib/popup.js');
  assert.ok(/const translationKey = titleKey \|\| `\$\{popupName\}-title`;/.test(popup),
    'an explicit key wins, otherwise the convention');
  assert.ok(/title !== translationKey \? title : defaultTitle/.test(popup),
    'and a key with no translation behind it is no title at all');
});

console.log(`\npopupTitles: ${passed} tests passed`);
