'use strict';
// #6736: Admin Panel / Settings / Visibility / Features.
// Run: node tests/instanceFeatures.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const features = require('../models/lib/instanceFeatures');
const views = require('../models/lib/boardViewSettings');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const allOn = Object.fromEntries(features.FEATURE_KEYS.map(key => [key, true]));
const admin = { _id: 'a', isAdmin: true };
const member = { _id: 'm' };
const pilot = { _id: 'p', featurePreview: true };

test('the catalog groups known views, each once, and never the core views', () => {
  const seen = new Set();
  for (const feature of features.FEATURES) {
    assert.ok(feature.views.length > 0, feature.key);
    for (const view of feature.views) {
      assert.ok(views.isKnownBoardView(view), `${feature.key}: ${view} is not a board view`);
      assert.ok(!seen.has(view), `${view} is in two features`);
      seen.add(view);
    }
  }
  assert.ok(!seen.has('board-view-swimlanes') && !seen.has('board-view-lists'), 'Swimlanes and Lists are core');
  // Every other view can be decided about, so no optional view escapes the page.
  const optional = views.BOARD_VIEWS.map(v => v.view).filter(view => !['board-view-swimlanes', 'board-view-lists'].includes(view));
  assert.deepEqual(optional.filter(view => !seen.has(view)), [], 'every optional view belongs to a feature');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const feature of features.FEATURES) assert.ok(en[feature.labelKey] && en[feature.descKey], feature.key);
});

test('with nothing stored, every feature is on, as before', () => {
  for (const key of features.FEATURE_KEYS) assert.equal(features.isFeatureEnabled({}, key), true);
  assert.equal(features.isFeatureEnabled(undefined, 'views-gantt'), true);
  assert.equal(features.isBoardViewAvailable(undefined, member, 'board-view-gantt'), true);
});

test('a disabled feature is hidden from members; its views and nothing else', () => {
  const setting = { featureStates: { ...allOn, 'views-gantt': false } };
  assert.equal(features.isBoardViewAvailable(setting, member, 'board-view-gantt-frappe'), false);
  assert.equal(features.isBoardViewAvailable(setting, member, 'board-view-table'), true);
  // Negative: core views and unknown keys can never be disabled.
  assert.equal(features.isBoardViewAvailable(setting, member, 'board-view-swimlanes'), true);
  assert.equal(features.isBoardViewAvailable({ featureStates: { 'board-view-swimlanes': false } }, member,
    'board-view-swimlanes'), true);
});

test('admins preview disabled features only when that is on; pilot users always', () => {
  const off = { featureStates: { ...allOn, 'views-scrum': false } };
  assert.equal(features.isBoardViewAvailable(off, admin, 'board-view-sprints'), false, 'no preview by default');
  assert.equal(features.isBoardViewAvailable({ ...off, featurePreviewAdmins: true }, admin, 'board-view-sprints'), true);
  assert.equal(features.isBoardViewAvailable({ ...off, featurePreviewAdmins: true }, member, 'board-view-sprints'), false);
  assert.equal(features.isBoardViewAvailable(off, pilot, 'board-view-sprints'), true);
  assert.equal(features.isBoardViewAvailable(off, null, 'board-view-sprints'), false, 'a visitor never previews');
});

test('the approval policy holds back only features added after it was turned on', () => {
  const known = features.FEATURE_KEYS.filter(key => key !== 'views-map');
  const setting = { featureApprovalRequired: true, featureKnownKeys: known, featureStates: {} };
  assert.equal(features.isAwaitingApproval(setting, 'views-map'), true);
  assert.equal(features.isFeatureEnabled(setting, 'views-map'), false);
  assert.equal(features.isFeatureEnabled(setting, 'views-gantt'), true, 'a feature already there stays on');
  // Negative: without the policy, a new feature is on as always.
  assert.equal(features.isFeatureEnabled({ ...setting, featureApprovalRequired: false }, 'views-map'), true);
  // An explicit decision ends the wait either way.
  assert.equal(features.isFeatureEnabled({ ...setting, featureStates: { 'views-map': true } }, 'views-map'), true);
  assert.equal(features.isAwaitingApproval({ ...setting, featureStates: { 'views-map': false } }, 'views-map'), false);
  const rows = features.featureRows(setting);
  assert.deepEqual(rows.filter(row => row.awaitingApproval).map(row => row.key), ['views-map']);
});

test('saving stores a decision for every feature and records the catalog', () => {
  const result = features.featureSettingsModifier({ states: { ...allOn, 'views-map': false },
    approvalRequired: true, previewAdmins: false });
  assert.equal(result.$set.featureStates['views-map'], false);
  assert.deepEqual(Object.keys(result.$set.featureStates), features.FEATURE_KEYS);
  assert.deepEqual(result.$set.featureKnownKeys, features.FEATURE_KEYS);
  assert.equal(result.$set.featureApprovalRequired, true);
  // Negative: unknown keys, missing decisions and wrong types are refused.
  assert.equal(features.featureSettingsModifier({ states: { ...allOn, bogus: true }, approvalRequired: false,
    previewAdmins: false }).error, 'unknown-feature');
  assert.equal(features.featureSettingsModifier({ states: { 'views-map': true }, approvalRequired: false,
    previewAdmins: false }).error, 'invalid');
  assert.equal(features.featureSettingsModifier({ states: allOn, approvalRequired: 'yes', previewAdmins: false }).error,
    'invalid');
  assert.equal(features.featureSettingsModifier(null).error, 'invalid');
  assert.deepEqual(features.parsePilotUsernames(' alice, bob\ncarol;alice '), ['alice', 'bob', 'carol']);
  assert.deepEqual(features.parsePilotUsernames(undefined), []);
});

test('the board view menu, rows, moves and fallback skip what the instance disabled', () => {
  const allow = view => view !== 'board-view-table' && view !== 'board-view-cal';
  const board = { permission: 'private' };
  const menu = views.boardViewMenuEntries(board, 'board-view-swimlanes', allow).map(entry => entry.view);
  assert.ok(!menu.includes('board-view-table') && !menu.includes('board-view-cal'));
  assert.ok(menu.includes('board-view-lists'));
  // A user left on a disabled view is moved to the board default...
  assert.equal(views.resolveBoardView(board, 'board-view-table', allow), 'board-view-swimlanes');
  // ...and when the default itself is disabled, to Swimlanes.
  assert.equal(views.resolveBoardView({ ...board, defaultPrivateBoardView: 'board-view-cal' }, 'board-view-table', allow),
    'board-view-swimlanes');
  // Without a filter nothing changes (negative).
  assert.equal(views.resolveBoardView(board, 'board-view-table'), 'board-view-table');
  // Moving Lists down passes the hidden Table and lands after the next visible row.
  const order = views.moveBoardView(undefined, 'board-view-lists', 'down', allow);
  const visible = order.filter(allow);
  assert.equal(visible.indexOf('board-view-lists'), 2, 'one visible row passed');
  assert.ok(order.indexOf('board-view-lists') > order.indexOf('board-view-cal'));
});

test('wiring: every place that draws or picks a board view asks the instance', () => {
  assert.match(read('client/lib/utils.js'), /resolveBoardView\(board, stored, allowBoardView\)/);
  assert.match(read('client/components/boards/boardHeader.js'),
    /boardViewMenuEntries\(board, Utils\.boardView\(\), allowBoardView\)/);
  const sidebar = read('client/components/sidebar/sidebar.js');
  assert.match(sidebar, /orderedBoardViews\(board\)\.filter\(v => allowBoardView\(v\.view\)\)/);
  // Negative, tree-wide: no client code draws the menu or resolves a view
  // without the instance's filter.
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
  for (const file of walk(path.join(ROOT, 'client')).filter(f => f.endsWith('.js'))) {
    const src = fs.readFileSync(file, 'utf8');
    for (const call of src.match(/\b(?:boardViewMenuEntries|resolveBoardView)\(.*$/gm) || []) {
      if (/^(?:boardViewMenuEntries|resolveBoardView)\(\) \{/.test(call)) continue; // helper definitions
      assert.match(call, /allowBoardView/, `${path.relative(ROOT, file)}: ${call}`);
    }
  }
  assert.match(read('client/lib/instanceFeatures.js'), /isBoardViewAvailable\(ReactiveCache\.getCurrentSetting\(\), ReactiveCache\.getCurrentUser\(\), view\)/);
});

test('storage: site admin only, published without secrets, pilots not writable by users', () => {
  const method = read('server/methods/instanceFeatures.js');
  assert.match(method, /async requireSiteAdmin\(\)|async function requireSiteAdmin\(\) \{\s*const user = await Meteor\.userAsync\(\);\s*if \(user\?\.isAdmin !== true\) throw/);
  assert.equal((method.match(/await requireSiteAdmin\(\);/g) || []).length, 2, 'both methods check the admin');
  assert.match(method, /featureSettingsModifier\(decisions\)/);
  assert.match(read('server/imports.js'), /import '\/server\/methods\/instanceFeatures';/);
  const settingsPub = read('server/publications/settings.js');
  for (const field of ['featureStates', 'featureApprovalRequired', 'featureKnownKeys', 'featurePreviewAdmins']) {
    assert.match(settingsPub, new RegExp(`\\b${field}: 1,`), field);
    assert.match(read('models/settings.js'), new RegExp(`\\b${field}: \\{`), `${field} in the schema`);
  }
  // The pilot flag is published only in the user's own document.
  assert.match(read('server/publications/users.js'),
    /publish\('user-admin', function \(\) \{\s*const ret = Meteor\.users\.find\(this\.userId,[\s\S]*?featurePreview: 1,/);
  // Negative: a user can not make themselves a pilot.
  const { isUserUpdateAllowed } = { isUserUpdateAllowed: fields => {
    const src = read('models/users.js');
    const exact = src.match(/USER_UPDATE_ALLOWED_EXACT = \[([^\]]*)\]/)[1];
    const prefixes = src.match(/USER_UPDATE_ALLOWED_PREFIXES = \[([^\]]*)\]/)[1];
    return fields.every(field => exact.includes(`'${field}'`) ||
      [...prefixes.matchAll(/'([^']+)'/g)].some(m => field.startsWith(m[1])));
  } };
  assert.equal(isUserUpdateAllowed(['featurePreview']), false);
});

test('the Admin Panel group: rows from the catalog, one save through the method', () => {
  const jade = read('client/components/settings/settingBody.jade');
  assert.match(jade, /each featureRows\s+li\.tableVisibilityMode-form\.js-feature-row\(data-feature=key\)/);
  assert.match(jade, /#feature-approval-required/);
  assert.match(jade, /#feature-preview-admins/);
  assert.match(jade, /textarea\.wekan-form-control#feature-pilot-users/);
  // Inside the site-admin-only part of the Visibility pane.
  const pane = jade.slice(jade.indexOf("template(name='tableVisibilityModeSettings')"));
  assert.ok(pane.indexOf('if isSiteAdmin') < pane.indexOf('each featureRows'));
  const js = read('client/components/settings/settingBody.js');
  assert.match(js, /Meteor\.callAsync\('saveInstanceFeatures', \{/);
  assert.match(js, /instanceFeatures\.featureRows\(ReactiveCache\.getCurrentSetting\(\)\)/);
});

console.log(`\ninstanceFeatures: ${passed} passed`);
