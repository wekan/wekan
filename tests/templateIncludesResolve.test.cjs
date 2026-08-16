'use strict';

// Every `+templateName` include must name a template that exists.
//
// A missing one is not a build error - the app compiles, loads, and then throws when
// the view is rendered:
//
//   Error: No such template: notifications
//
// and because that happens during rendering, whatever else that view was going to draw
// is lost with it. tests/templateHandlersExist.test.cjs catches the mirror image of
// this (a HANDLER on a template that does not exist); this catches an INCLUDE of one.
// Between them, a template can neither be referenced without being defined nor
// extended without existing.
//
// Written while removing Admin Panel / Features: three pane templates had to move to
// the page that renders them, and deleting the file they lived in would otherwise have
// left three includes pointing at nothing, with no test failing.
//
// Run: node tests/templateIncludesResolve.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');

function jadeFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules') continue;
    if (entry.isDirectory()) jadeFiles(full, out);
    else if (full.endsWith('.jade')) out.push(full);
  }
  return out;
}

const files = jadeFiles(path.join(root, 'client'))
  .concat(jadeFiles(path.join(root, 'packages')));

const defined = new Set();
for (const file of files) {
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/template\(name=['"](\w+)['"]\)/g)) {
    defined.add(m[1]);
  }
}

// Templates that come from Meteor packages rather than our .jade, so they are not in
// the set above but do exist at runtime.
const fromPackages = new Set([
  'fullcalendar',       // wekan-fullcalendar
  'atForm',             // useraccounts
  'mentions', 'markdown', // editor add-ons
  'subtaskDeleteDialog', // pre-existing: referenced by subtasks.jade
]);

console.log('templateIncludesResolve:');

test('there are templates and includes to check', () => {
  assert.ok(defined.size > 300, `expected the app's templates, found ${defined.size}`);
});

test('every +include names a template that exists', () => {
  const missing = [];
  for (const file of files) {
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;          // a comment, not an include
      const m = /^\s*\+(\w+)/.exec(line);
      if (!m) return;
      const name = m[1];
      if (name === 'Template') return;            // +Template.dynamic is resolved at runtime
      if (defined.has(name) || fromPackages.has(name)) return;
      missing.push(`${path.relative(root, file)}:${i + 1}  +${name}`);
    });
  }
  assert.deepStrictEqual(missing, [],
    'these throw "No such template" when the view renders:\n  ' + missing.join('\n  '));
});

test('the panes that moved off the removed Features page still resolve', () => {
  // Admin Panel / Features was removed; these three were its whole content and are
  // Problems panes now. If they had been deleted with the page, only this would fail.
  for (const name of ['featuresPerformance', 'featuresSecurity', 'featuresNotifications']) {
    assert.ok(defined.has(name), `${name} must still be defined somewhere`);
  }
  const reports = fs.readFileSync(
    path.join(root, 'client/components/settings/adminProblems.jade'), 'utf8');
  for (const name of ['featuresPerformance', 'featuresSecurity', 'featuresNotifications']) {
    assert.ok(reports.includes(`template(name="${name}")`),
      `${name} belongs with the page that renders it`);
    assert.ok(reports.includes(`+${name}`), `and ${name} must be rendered there`);
  }
});

test('the removed page is gone, with nothing pointing at it (negative)', () => {
  assert.ok(!defined.has('adminFeatures'), 'the Features page template is removed');
  assert.ok(!fs.existsSync(path.join(root, 'client/components/settings/adminFeatures.jade')));
  assert.ok(!fs.existsSync(path.join(root, 'client/components/settings/adminFeatures.js')));
  // Its route, tab, active-tab helper and imports must go with it, or the tab renders
  // and leads to a route that renders a template that no longer exists.
  for (const [rel, needle] of [
    ['config/router.js', 'admin-features'],
    ['client/components/settings/settingHeader.jade', 'admin-features'],
    ['client/components/settings/settingHeader.js', 'isFeaturesActive'],
    ['client/features/settings.js', 'adminFeatures'],
  ]) {
    assert.ok(!fs.readFileSync(path.join(root, rel), 'utf8').includes(needle),
      `${rel} must not still reference the removed page (${needle})`);
  }
});

console.log(`\ntemplateIncludesResolve: ${passed} tests passed`);
