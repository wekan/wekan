'use strict';

// Admin Panel / Problems / Password length (models/lib/shortPasswordLogins.js,
// server/lib/shortPasswordLogins.js, client/components/settings/passwordLengthReport.*).
//
//  - test: one row per account - a short sign-in counts, keeps the first time,
//    updates the latest time and that family's address and location, and
//    reopens a fixed row; the filter is Too short by default, Fixed, All; the
//    page is in the Problems menu, at /admin/problems/password-length, with the
//    columns and settings asked for;
//  - negative: an unknown filter is the default, not "all"; the table is for
//    site administrators only; an address of one family does not erase the
//    other's.
// Run: node tests/shortPasswordLogins.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const { FILTERS, DEFAULT_FILTER, filterSelector, cleanFilter, shortLoginUpdate } = require('../models/lib/shortPasswordLogins');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('a short sign-in counts, keeps the first time, and reopens a fixed row', () => {
  const now = new Date('2026-10-31T12:00:00Z');
  const location = { city: 'Helsinki', country: 'FI' };
  const update = shortLoginUpdate({ username: 'maija', now, address: '192.0.2.7', family: 'ipv4', location });
  assert.deepStrictEqual(update.$inc, { count: 1 });
  assert.deepStrictEqual(update.$setOnInsert, { firstAt: now }, 'the first time is kept');
  assert.deepStrictEqual(update.$set, { username: 'maija', at: now, ipv4: '192.0.2.7', ipv4Location: location });
  assert.deepStrictEqual(update.$unset, { fixedAt: '' }, 'seen short again: not fixed any more');
});

test('negative: an address of one family does not erase the other', () => {
  const now = new Date();
  const v6 = shortLoginUpdate({ username: 'u', now, address: '2001:db8::1', family: 'ipv6' });
  assert.strictEqual(v6.$set.ipv6, '2001:db8::1');
  assert.ok(!('ipv4' in v6.$set) && !('ipv4Location' in v6.$set));
  const none = shortLoginUpdate({ username: 'u', now, address: '', family: null });
  assert.deepStrictEqual(Object.keys(none.$set).sort(), ['at', 'username']);
});

test('the filter: Too short by default, Fixed, All; an unknown one is the default', () => {
  assert.deepStrictEqual(FILTERS, ['short', 'fixed', 'all']);
  assert.strictEqual(DEFAULT_FILTER, 'short');
  assert.deepStrictEqual(filterSelector('short'), { fixedAt: null });
  assert.deepStrictEqual(filterSelector('fixed'), { fixedAt: { $type: 'date' } });
  assert.deepStrictEqual(filterSelector('all'), {});
  for (const bad of [undefined, '', 'everything', '{"$ne":1}']) assert.strictEqual(cleanFilter(bad), 'short', String(bad));
});

test('the server records with the shared address resolver, and the table is for site administrators', () => {
  const server = read('server/lib/shortPasswordLogins.js');
  assert.match(server, /resolveClientKey\(\{/);
  assert.match(server, /locationFromHeaders\(/);
  assert.match(server, /upsertAsync\(\{ userId: user\._id \}/, 'one row per account');
  assert.match(server, /async shortPasswordLoginsPage\(options = \{\}\) \{\n\s+check\(options,[^]*?await requireSiteAdmin\(this\.userId\);/);
  assert.match(server, /user\.isAdmin !== true \|\| user\.loginDisabled === true/);
  assert.match(server, /filterSelector\(cleanFilter\(options\.filter\)\)/);
  assert.match(server, /ensureIndex\(ShortPasswordLogins, \{ userId: 1 \}, \{ unique: true \}\)/);
  assert.match(read('server/passwordChangeRequired.js'), /await recordShortPasswordLogin\(user, this\.connection\);\n\s+if \(!currentPasswordPolicy\(\)\.enforce\) return false;/,
    'reported always, the change required only when enforced');
});

test('the page: menu entry, URL, columns, filter and the two settings', () => {
  assert.match(read('client/components/settings/adminProblems.js'), /\{ id: 'report-password-length', icon: 'fa-key', labelKey: 'password-length-report-title' \}/);
  assert.match(read('client/components/settings/adminProblems.jade'), /else if isPane 'report-password-length'\n\s+\+passwordLengthReport/);
  // Not in SELF_LOADING_PANES, the pane waited for a subscription it never makes: a spinner for ever.
  const problems = read('client/components/settings/adminProblems.js');
  assert.match(problems.slice(problems.indexOf('const SELF_LOADING_PANES'), problems.indexOf('function openReportPane')), /'report-password-length'/);
  assert.match(read('models/lib/adminUrls.js'), /'password-length': 'report-password-length'/);
  assert.match(read('client/features/settings.js'), /passwordLengthReport\.jade';\nimport '\/client\/components\/settings\/passwordLengthReport\.js'/);
  const js = read('client/components/settings/passwordLengthReport.js');
  const columns = js.slice(js.indexOf('const COLUMNS'), js.indexOf('const FILTER_OPTIONS'));
  const labels = [...columns.matchAll(/(?:labelKey: |addressColumn\()'([^']+)'/g)].map(m => m[1]);
  assert.deepStrictEqual(labels, ['username', 'password-length-first-login', 'event-ipv4', 'event-ipv6',
    'password-length-last-login', 'password-length-login-count', 'password-length-fixed']);
  assert.match(js, /flag: row => locationFlag\(row, family\)/, 'the country flag');
  assert.match(js, /locationText\(row, family\)/, 'the city');
  assert.match(js, /saveAuthConfigSettings', 'login', \{\n\s+passwordMinLength:[^\n]+\n\s+passwordMinLengthEnforce:/);
  const jade = read('client/components/settings/passwordLengthReport.jade');
  for (const cls of ['js-password-min-length', 'js-toggle-password-min-length-enforce', 'js-save-password-length']) assert.ok(jade.includes(cls), cls);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['password-length-report-title', 'password-length-filter-short', 'password-length-filter-fixed',
    'password-length-filter-all', 'password-length-first-login', 'password-length-last-login',
    'password-length-login-count', 'password-length-fixed', 'password-min-length', 'password-min-length-enforce']) {
    assert.ok(en[key], key);
  }
  assert.strictEqual(en['password-length-filter-short'], 'Too short password');
  assert.strictEqual(en['password-length-filter-fixed'], 'Fixed to long enough password');
});

test('documented: the page, the URL list, the table list and both settings', () => {
  const doc = read('docs/Features/Admin-Panel/Problems/Password-length.md');
  for (const word of ['PASSWORD_MIN_LENGTH_ENFORCE', 'Too short password', 'Fixed to long enough password', '/admin/problems/password-length']) {
    assert.ok(doc.includes(word), word);
  }
  assert.match(read('docs/Features/Admin-Panel/Admin-Panel-URLs.md'), /`\/admin\/problems\/password-length` \| Password length \| `report-password-length`/);
  assert.match(read('docs/Features/Admin-Panel/Problems/README.md'), /\| Problems \/ Password length \| `password-length` \| \[Password-length\.md\]/);
  assert.match(read('docs/Features/General/Table.md'), /\| Password length \| Admin Panel \/ Problems \/ Password length \|/);
  for (const file of ['Dockerfile', 'docker-compose.yml', 'snap-src/bin/config', 'start-wekan.sh', 'start-wekan.bat', 'docs/Security/Security-Settings.md']) {
    assert.ok(read(file).includes('PASSWORD_MIN_LENGTH_ENFORCE'), file);
  }
});

console.log(`shortPasswordLogins: ${passed} tests passed`);
