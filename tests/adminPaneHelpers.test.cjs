'use strict';

// Every `showSomething.get` branch in an Admin Panel template has a helper of
// that name in the template's own .js.
//
// WHY THIS EXISTS. Admin Panel / Problems / Filesystem integrity rendered an
// EMPTY page. Everything about it looked right: the menu entry was there, it
// highlighted when clicked, the pane title said "Filesystem integrity", the
// click handler set `tmpl.showIntegrity`, and the template had
// `else if showIntegrity.get` with a report under it. The one missing piece was
// the helper - `showIntegrity()` was never added beside `showDatabase()` and the
// eight others - and in Blaze an undefined helper is not an error. It is falsy.
// So the branch never ran, the pane drew nothing at all, and Summary went on
// reporting "7 new problems" for a page that could not show them.
//
// That is the whole class this guards: a pane wired up in three places out of
// four, failing silently in the fourth. Nothing throws, nothing logs, and the
// only symptom is a blank page that looks like "no data".
//
// THE MECHANISM CHANGED, THE FAILURE DID NOT. Problems no longer keeps a
// ReactiveVar per pane - eleven booleans that each restated the one `activeReport`
// id - so there are four places fewer to get wrong, and the template asks
// `isPane 'report-integrity'` instead. An undefined helper is still falsy, and a
// pane id that no branch matches still draws nothing, so both idioms are checked
// here: the `show*.get` one for any template that still uses it, and the
// `isPane` one for the templates that have moved.
//
// Run: node tests/adminPaneHelpers.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Every settings template that switches panes on a `show*` ReactiveVar, found
// rather than listed: a template added later is covered without editing this
// file, and one that uses a different idiom (settingBody.jade switches on
// `isVersionSetting` and friends) is simply not in the list.
const SETTINGS_DIR = 'client/components/settings';
const PAIRS = fs.readdirSync(path.join(repoRoot, SETTINGS_DIR))
  .filter(f => f.endsWith('.jade'))
  .map(f => [`${SETTINGS_DIR}/${f}`, `${SETTINGS_DIR}/${f.replace(/\.jade$/, '.js')}`])
  .filter(([jade, js]) =>
    /\bshow[A-Za-z0-9]+\.get\b/.test(read(jade)) &&
    fs.existsSync(path.join(repoRoot, js)));

const usedIn = jade =>
  [...new Set([...jade.matchAll(/\b(show[A-Za-z0-9]+)\.get\b/g)].map(m => m[1]))];
const helpersIn = js =>
  new Set([...js.matchAll(/^\s{2}(show[A-Za-z0-9]+)\(\)\s*\{/gm)].map(m => m[1]));
const varsIn = js =>
  new Set([...js.matchAll(/this\.(show[A-Za-z0-9]+)\s*=\s*new ReactiveVar/g)].map(m => m[1]));

console.log('adminPaneHelpers:');

test('every show*.get branch has a helper, or the pane renders nothing', () => {
  // PAIRS may legitimately be empty: adminProblems.jade was the last template
  // using the idiom and it switches on `isPane` now. The scan stays because it
  // costs nothing and covers a template that adopts show* later.
  for (const [jadeFile, jsFile] of PAIRS) {
    const used = usedIn(read(jadeFile));
    const helpers = helpersIn(read(jsFile));
    const missing = used.filter(name => !helpers.has(name));
    assert.deepStrictEqual(missing, [],
      `${jsFile} has no helper for: ${missing.join(', ')} - Blaze reads an undefined `
      + 'helper as false, so those panes draw a blank page instead of failing');
  }
});

test('and a ReactiveVar behind it, or the helper returns undefined forever', () => {
  for (const [jadeFile, jsFile] of PAIRS) {
    const js = read(jsFile);
    const vars = varsIn(js);
    const missing = usedIn(read(jadeFile)).filter(name => !vars.has(name));
    assert.deepStrictEqual(missing, [],
      `${jsFile} never creates a ReactiveVar for: ${missing.join(', ')}`);
  }
});

// The templates that switch panes on the shared active-pane id.
const PANE_PAIRS = fs.readdirSync(path.join(repoRoot, SETTINGS_DIR))
  .filter(f => f.endsWith('.jade'))
  .map(f => [`${SETTINGS_DIR}/${f}`, `${SETTINGS_DIR}/${f.replace(/\.jade$/, '.js')}`])
  .filter(([jade, js]) =>
    /\bisPane '/.test(read(jade)) && fs.existsSync(path.join(repoRoot, js)));

test('every isPane branch has the helper behind it', () => {
  // One helper covers every pane now, so this can only fail one way - the
  // helper is missing entirely - but that way takes EVERY pane down at once
  // rather than one, which is worth a line of test.
  assert.ok(PANE_PAIRS.length > 0, 'Problems switches panes on isPane');
  for (const [jadeFile, jsFile] of PANE_PAIRS) {
    assert.ok(/^\s{2}isPane\(\w*\)\s*\{/m.test(read(jsFile)),
      `${jsFile} has no isPane helper, so every one of its panes is blank`);
  }
});

test('and every id it branches on is a real menu entry (negative)', () => {
  // The other half: a branch on an id the menu never sets is dead template, and
  // a menu id no branch matches is a blank pane. Both are typos of the same
  // kind - `report-intergity` - and neither says anything at runtime.
  for (const [jadeFile, jsFile] of PANE_PAIRS) {
    const js = read(jsFile);
    const ids = new Set([...js.matchAll(/^\s*\{ id: '([\w-]+)'/gm)].map(m => m[1]));
    if (!ids.size) continue;
    const branched = [...new Set([...read(jadeFile).matchAll(/\bisPane '([\w-]+)'/g)]
      .map(m => m[1]))];
    const unknown = branched.filter(id => !ids.has(id));
    assert.deepStrictEqual(unknown, [],
      `${jadeFile} branches on ids no menu entry sets: ${unknown.join(', ')}`);
  }
});

test('Filesystem integrity in particular: menu entry, click, branch, report', () => {
  // The places that pane needs to exist in, named one by one, because this is
  // the one that was three-quarters wired and blank. It is one place shorter
  // than it was: the ReactiveVar and its setter are gone, and the id the menu
  // entry already carries is what the template matches.
  const js = read('client/components/settings/adminProblems.js');
  const jade = read('client/components/settings/adminProblems.jade');
  assert.ok(/id: 'report-integrity'/.test(js), 'the menu has a report-integrity entry');
  assert.ok(/'report-integrity'/.test(js), 'clicking it is handled');
  assert.ok(/else if isPane 'report-integrity'/.test(jade), 'the template branches on it');
  assert.ok(/\+eventStreamReport\(stream="integrity"\)/.test(jade),
    'and renders the integrity event stream');
});

console.log(`\nadminPaneHelpers: ${passed} tests passed`);
