'use strict';

// Admin Panel / Problems: the menu order, the Security Report rename, the three
// panes that moved here from Admin Panel / Features, and the Delete setting added
// after that page was removed.
//
// Requested:
//   * "Security" renamed to "Security Report" and moved ABOVE "Broken Cards"
//   * "Impersonation Report" moved BELOW "Security Report"
//   * Performance, Security and Notifications moved here, below "Summary"
//   * Performance, Speed, Tests and CPU usage moved below "Impersonation Report"
//   * a "Settings" title below Summary and a "Reports" title above Security Report,
//     each after a horizontal rule - titles, not entries: nothing to click
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

const reportsJs = read('client/components/settings/adminProblems.js');
const reportsJade = read('client/components/settings/adminProblems.jade');
// Admin Panel / Features was removed once its last three panes moved here, so the
// panes and their handlers live with the page that renders them.
const featuresJs = read('client/components/settings/adminProblems.js');
const featuresJade = read('client/components/settings/adminProblems.jade');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

const menu = reportsJs.slice(reportsJs.indexOf('const PROBLEMS_MENU'),
  reportsJs.indexOf('];', reportsJs.indexOf('const PROBLEMS_MENU')));
const at = id => menu.indexOf(`id: '${id}'`);
const headingAt = key => menu.indexOf(`{ heading: true, labelKey: '${key}' }`);

console.log('problemsMenuOrder:');

test('Security Report sits above Broken Cards, with Impersonation between', () => {
  assert.ok(at('report-security') > -1 && at('report-broken') > -1
    && at('report-impersonation') > -1, 'all three entries must exist');
  assert.ok(at('report-security') < at('report-broken'),
    'Security Report is above Broken Cards');
  assert.ok(at('report-impersonation') > at('report-security'),
    'Impersonation Report is below Security Report');
  assert.ok(at('report-impersonation') < at('report-broken'),
    'and still above Broken Cards - Performance, Speed, Tests and CPU usage sit '
    + 'between it and Broken Cards now, but the order of these three is unchanged');
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

test('the menu is two named groups: Settings, then Reports', () => {
  // Summary, then a rule and a "Settings" title over the server-wide switches,
  // then a rule and a "Reports" title over everything else.
  for (const id of ['features-security', 'features-delete', 'features-notifications']) {
    assert.ok(at(id) > -1, `${id} must be a Problems entry`);
    assert.ok(at(id) > at('report-summary'), `${id} must be below Summary`);
  }
  assert.ok(headingAt('settings') > -1 && headingAt('reports') > -1,
    'both group titles must exist, as headings rather than entries');
  assert.ok(headingAt('settings') > at('report-summary'),
    'the Settings title comes after Summary');
  assert.ok(headingAt('settings') < at('features-security'),
    'and above the settings panes it names');
  assert.ok(at('features-security') < at('features-delete'),
    'Delete is below Security');
  assert.ok(at('features-delete') < at('features-notifications'),
    'Delete is immediately above Notifications');
  assert.ok(at('features-notifications') < headingAt('reports'),
    'the Reports title comes after them');
  assert.ok(headingAt('reports') < at('report-security'),
    'and above Security Report, the first report');
  // A rule before each title, so the groups read as groups: two in the menu.
  assert.strictEqual((menu.match(/\{ separator: true \}/g) || []).length, 2,
    'one horizontal rule above each group title');
  // Existing i18n keys - a heading is a label like any other, not a new string.
  assert.strictEqual(en.settings, 'Settings');
  assert.strictEqual(en.reports, 'Reports');
});

test('Performance sits with the streams it is about, below Impersonation Report', () => {
  // Performance, Speed, Tests and CPU usage are one subject; Performance was up with
  // the other two Features panes, three groups away from the streams it configures.
  assert.ok(at('features-performance') > at('report-impersonation'),
    'Performance moved below Impersonation Report');
  assert.ok(at('features-performance') < at('report-speed'),
    'and directly above Speed');
  assert.ok(at('report-speed') < at('report-tests'));
  assert.ok(at('report-tests') < at('report-cpu'));
  assert.ok(at('report-cpu') < at('report-broken'),
    'the four sit together, above the remaining reports');
});

test('EVERY pane in the menu is rendered, and has something behind it', () => {
  // This replaced a check on three named panes and their ReactiveVars. The state
  // is one `activeReport` id now, so the invariant can be stated for ALL of them:
  // a menu entry must be rendered by the template, and must either load itself
  // or have a report config. Missing either is what made a pane render blank -
  // the menu set a variable, the template asked for a helper that did not exist,
  // and an undefined helper is simply falsy.
  const ids = [...reportsJs.matchAll(/^\s*\{ id: '([\w-]+)'/gm)].map(m => m[1]);
  assert.ok(ids.length > 10, `expected the menu, found ${ids.length} entries`);

  const selfLoading = /const SELF_LOADING_PANES = \[([\s\S]*?)\];/.exec(reportsJs);
  assert.ok(selfLoading, 'the self-loading pane list must exist');
  const selfLoadingIds = [...selfLoading[1].matchAll(/'([\w-]+)'/g)].map(m => m[1]);
  const configured = [...reportsJs.matchAll(/^\s*'([\w-]+)': \{ page: /gm)].map(m => m[1]);

  const unrendered = ids.filter(id => !reportsJade.includes(`isPane '${id}'`)
    && !configured.includes(id));
  assert.deepStrictEqual(unrendered, [],
    `these menu entries render nothing: ${unrendered.join(', ')}`);

  const unloaded = ids.filter(id => !selfLoadingIds.includes(id) && !configured.includes(id));
  assert.deepStrictEqual(unloaded, [],
    'these panes neither load themselves nor have a report config, so opening one '
    + `spins for ever: ${unloaded.join(', ')}`);
});

test('no pane keeps its own ReactiveVar any more (negative)', () => {
  // Eleven booleans said what one id already said, and each pane needed seven
  // edits to add. A new `this.showX = new ReactiveVar` is that pattern coming
  // back.
  // The CODE, not the comment above it that records why the pattern went.
  const code = reportsJs.split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  const flags = [...code.matchAll(/this\.(show[A-Z]\w*) = new ReactiveVar/g)].map(m => m[1]);
  assert.deepStrictEqual(flags, [],
    `these duplicate activeReport: ${flags.join(', ')}`);
});


test('each settings pane has its helpers and handlers', () => {
  // The half that fails silently: the pane renders, every checkbox reads as unchecked
  // and no click does anything.
  assert.ok(/const featurePaneHelpers = \{/.test(featuresJs), 'the pane helpers are their own object');
  assert.ok(/const featurePaneEvents = \{/.test(featuresJs), 'and so are the handlers');
  assert.ok(/for \(const tpl of \[Template\.featuresPerformance, Template\.featuresSecurity,[\s\S]{0,140}tpl\.helpers\(featurePaneHelpers\);[\s\S]{0,40}tpl\.events\(featurePaneEvents\);/
    .test(featuresJs), 'registered on every settings pane template');
  assert.ok(featuresJs.includes("toggleSettingField('enablePermanentDelete')"),
    'the Delete checkbox writes the permanent-delete setting');
  assert.ok(/Template\.featuresDelete/.test(featuresJs),
    'the Delete pane receives the shared helpers and handlers');
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
