'use strict';

// The newest features' settings are in the Admin Panel as well as the
// environment (tests/envVarCoverage.test.cjs keeps every variable accounted
// for; tests/authConfigCatalog.test.cjs keeps every catalog variable on every
// platform). This pins how each new one reaches the code: read when used,
// Admin Panel first, so a change applies without a restart where it can.
// Run: node tests/adminPanelNewSettings.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { AUTH_CONFIG_SECTIONS, authConfigField } = require(path.join(ROOT, 'models/lib/authConfigCatalog.js'));
const { createRateLimiter } = require(path.join(ROOT, 'models/lib/emailToCard.js'));

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('email to card limits are a catalog section beside its Admin Panel settings', () => {
  assert.deepEqual(AUTH_CONFIG_SECTIONS.inboundEmail.fields.map(f => f.envVar), [
    'INBOUND_IMAP_POLL_SECONDS', 'INBOUND_EMAIL_PER_ADDRESS_PER_HOUR', 'INBOUND_EMAIL_MAX_BYTES',
    'INBOUND_EMAIL_MAX_ATTACHMENT_BYTES', 'EMAIL_VIEW_SENDS_PER_HOUR']);
  assert.match(read('client/components/settings/emailToCardSettings.jade'), /\+authProviderSettings\(inboundLimitsData\)/);
  // negative: the per-process switch is not shared through the Admin Panel
  assert.equal(authConfigField('INBOUND_IMAP_DISABLED'), null);
});

test('a rate limit given as a function is read at every call', () => {
  let limit = 2;
  const allow = createRateLimiter({ limit: () => limit, now: () => 1000 });
  assert.equal(allow('a'), true);
  assert.equal(allow('a'), true);
  assert.equal(allow('a'), false, 'at the limit');
  limit = 5;
  assert.equal(allow('a'), true, 'a limit raised in the Admin Panel applies at once');
  // negative: a plain number still works as before
  const fixed = createRateLimiter({ limit: 1, now: () => 1000 });
  assert.equal(fixed('b'), true);
  assert.equal(fixed('b'), false);
});

test('no new limit is read once at load, before the Admin Panel values are', () => {
  const imap = read('server/lib/imapInbound.js');
  assert.doesNotMatch(imap, /const (INTERVAL_MS|LEASE_MS|MAX_MESSAGE_BYTES) =/);
  assert.match(imap, /const intervalMs = \(\) => Math\.max\(15, Number\(authEnv\('INBOUND_IMAP_POLL_SECONDS'\)\) \|\| 60\) \* 1000;/);
  assert.match(imap, /onAuthConfigChange\('inboundEmail'/, 'a changed interval restarts the poller');
  const card = read('server/emailToCard.js');
  assert.match(card, /limit: \(\) => Number\(authEnv\('INBOUND_EMAIL_PER_ADDRESS_PER_HOUR'\)\) \|\| 60,/);
  assert.match(card, /a\.content\.length > maxAttachmentBytes\(\)/);
  assert.match(read('server/emailView.js'), /limit: \(\) => Number\(authEnv\('EMAIL_VIEW_SENDS_PER_HOUR'\)\) \|\| 50/);
  assert.match(read('server/lib/inboundEmailRequest.js'), /const maxBytes = \(\) => Number\(setting\('INBOUND_EMAIL_MAX_BYTES'\)\)/);
});

test('Windows SSO is in Admin Panel / People / Login, and listed for Windows only', () => {
  const fields = AUTH_CONFIG_SECTIONS.windowsSso.fields;
  assert.deepEqual(fields.map(f => f.envVar), ['WINDOWS_SSO_ENABLED', 'WINDOWS_SSO_DOMAINS',
    'WINDOWS_SSO_ACTIVE_DIRECTORY', 'WINDOWS_SSO_MERGE_EXISTING_USERS']);
  assert.ok(fields.every(f => JSON.stringify(f.platforms) === JSON.stringify(['start-wekan.bat'])));
  assert.match(read('client/components/settings/peopleBody.jade'), /\+authProviderSettings\(loginOptionsData\)\n\s+\/\/-.*\n\s+\+authProviderSettings\(windowsSsoData\)/);
  // negative: nothing reads the Windows SSO variables around the Admin Panel
  assert.doesNotMatch(read('server/windowsSso.js'), /process\.env\.WINDOWS_SSO_/);
});

test('the login-cookie limit is a Login setting that applies from the next start', () => {
  const field = authConfigField('ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT');
  assert.equal(field.section, 'login');
  assert.equal(field.restart, true);
});

test('every new Settings sub-document is in the schema', () => {
  const schema = read('models/settings.js');
  for (const storage of ['attachmentRetention', 'backupOptions', 'inboundMailLimits', 'windowsSso']) {
    assert.match(schema, new RegExp(`${storage}: \\{ type: Object, optional: true, blackbox: true \\}`), storage);
  }
});

console.log(`adminPanelNewSettings: ${passed} tests passed`);
