'use strict';

// Admin Panel / Problems: the menu order, the Security Report rename, and the three
// panes that moved here from Admin Panel / Features.
//
// Requested:
//   * "Security" renamed to "Security Report" and moved ABOVE "Broken Cards"
//   * "Impersonation Report" moved BELOW "Security Report"
//   * Performance, Security and Notifications moved here, below "Summary"
//
// The rename is what makes the rest safe: the pane arriving from Features is ALSO
// called Security, and the two now sit in one menu. Renaming the report is the source
// string changing, so other languages keep their existing translation until it is
// retranslated - a human translation is never overwritten.
//
// The pane move has the same trap as every other move in this series: the helpers and
// handlers were on Template.adminFeatures, and Blaze resolves a helper - and delivers
// an event - against the template the element is IN, never an enclosing one. Left
// there, each pane would render on Problems and then do nothing at all.
//
// Run: node tests/problemsMenuOrder.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const reportsJs = read('client/components/settings/adminReports.js');
const reportsJade = read('client/components/settings/adminReports.jade');
// Admin Panel / Features was removed once its last three panes moved here, so the
// panes and their handlers live with the page that renders them.
const featuresJs = read('client/components/settings/adminReports.js');
const featuresJade = read('client/components/settings/adminReports.jade');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

const menu = reportsJs.slice(reportsJs.indexOf('const PROBLEMS_MENU'),
  reportsJs.indexOf('];', reportsJs.indexOf('const PROBLEMS_MENU')));
const at = id => menu.indexOf(`id: '${id}'`);

console.log('problemsMenuOrder:');

test('Security Report sits above Broken Cards, with Impersonation between', () => {
  assert.ok(at('report-security') > -1 && at('report-broken') > -1
    && at('report-impersonation') > -1, 'all three entries must exist');
  assert.ok(at('report-security') < at('report-broken'),
    'Security Report is above Broken Cards');
  assert.ok(at('report-impersonation') > at('report-security'),
    'Impersonation Report is below Security Report');
  assert.ok(at('report-impersonation') < at('report-broken'),
    'and still above Broken Cards, i.e. directly between the two');
});

test('the report is called Security Report, in the source string', () => {
  assert.strictEqual(en.securityReportTitle, 'Security Report');
  // The menu still points at the same key, so no pane lost its translations - only
  // the English source changed, and Transifex marks it for retranslation.
  assert.ok(/id: 'report-security'[^}]*labelKey: 'securityReportTitle'/.test(menu));
  // It has to differ from the Features pane it now shares a menu with.
  assert.notStrictEqual(en.securityReportTitle, en['features-security'],
    'two entries in one menu must not both read "Security"');
});

test('Performance, Security and Notifications sit below Summary', () => {
  for (const id of ['features-performance', 'features-security', 'features-notifications']) {
    assert.ok(at(id) > -1, `${id} must be a Problems entry`);
    assert.ok(at(id) > at('report-summary'), `${id} must be below Summary`);
  }
  // In their original order, and above the reports that were already here.
  assert.ok(at('features-performance') < at('features-security'));
  assert.ok(at('features-security') < at('features-notifications'));
  assert.ok(at('features-notifications') < at('report-speed'));
});

test('Problems renders all three right-hand pages', () => {
  for (const [flag, tpl] of [['showFeaturesPerformance', 'featuresPerformance'],
    ['showFeaturesSecurity', 'featuresSecurity'],
    ['showFeaturesNotifications', 'featuresNotifications']]) {
    assert.ok(new RegExp(`else if ${flag}\\.get\\s*\\n\\s*\\+${tpl}`).test(reportsJade),
      `${tpl} must be rendered`);
    // With the state behind it, or the branch is never true.
    assert.ok(reportsJs.includes(`this.${flag} = new ReactiveVar(false)`), `${flag} must exist`);
    assert.ok(reportsJs.includes(`tmpl.${flag}.set(false)`), `${flag} must be reset on a switch`);
    assert.ok(reportsJs.includes(`tmpl.${flag}.set(true)`), `${flag} must be set by its entry`);
    assert.ok(new RegExp(`  ${flag}\\(\\) \\{`).test(reportsJs), `${flag} needs a helper`);
  }
  // And the templates they render must exist.
  for (const tpl of ['featuresPerformance', 'featuresSecurity', 'featuresNotifications']) {
    assert.ok(featuresJade.includes(`template(name="${tpl}")`), `template ${tpl} must exist`);
  }
});

test('each pane took its helpers and handlers with it', () => {
  // The half that fails silently: the pane renders, every checkbox reads as unchecked
  // and no click does anything.
  assert.ok(/const featurePaneHelpers = \{/.test(featuresJs), 'the pane helpers are their own object');
  assert.ok(/const featurePaneEvents = \{/.test(featuresJs), 'and so are the handlers');
  assert.ok(/for \(const tpl of \[Template\.featuresPerformance, Template\.featuresSecurity,[\s\S]{0,80}tpl\.helpers\(featurePaneHelpers\);[\s\S]{0,40}tpl\.events\(featurePaneEvents\);/
    .test(featuresJs), 'registered on all three pane templates');
  // They must NOT be left on the page template.
  // There is no page template left to leave them on: the pane templates are the only
  // place they can be.
  assert.ok(!/Template\.adminFeatures/.test(featuresJs),
    'the removed page template must not be referenced at all');
});

test('the Features page is removed entirely (negative)', () => {
  // It had nothing left once these three moved. tests/templateIncludesResolve.test.cjs
  // checks the route, tab and imports went with it.
  assert.ok(!/FEATURES_MENU/.test(featuresJs), 'no menu left behind');
  assert.ok(!/template\(name="adminFeatures"\)/.test(featuresJade), 'no page template');
});

console.log(`\nproblemsMenuOrder: ${passed} tests passed`);
