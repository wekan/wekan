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
  assert.ok(PAIRS.length > 0, 'at least one settings template switches on show*.get');
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

test('Filesystem integrity in particular: menu entry, branch, setter and helper', () => {
  // The four places that pane needs to exist in, named one by one, because
  // this is the one that was three-quarters wired and blank.
  const js = read('client/components/settings/adminProblems.js');
  const jade = read('client/components/settings/adminProblems.jade');
  assert.ok(/id: 'report-integrity'/.test(js), 'the menu has a report-integrity entry');
  assert.ok(/'report-integrity' === targetID/.test(js), 'clicking it is handled');
  assert.ok(/tmpl\.showIntegrity\.set\(true\)/.test(js), 'and it sets showIntegrity');
  assert.ok(/^\s{2}showIntegrity\(\)\s*\{/m.test(js), 'showIntegrity is a helper');
  assert.ok(/else if showIntegrity\.get/.test(jade), 'the template branches on it');
  assert.ok(/\+eventStreamReport\(stream="integrity"\)/.test(jade),
    'and renders the integrity event stream');
});

console.log(`\nadminPaneHelpers: ${passed} tests passed`);
