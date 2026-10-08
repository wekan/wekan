'use strict';
// Automatic logout: LOGOUT_WITH_TIMER, LOGOUT_IN, LOGOUT_ON_HOURS and
// LOGOUT_ON_MINUTES (maintainer decision of 2026-10-08). The platforms offered
// them, but nothing read them. models/lib/logoutTimer.js computes when a login
// ends; server/logoutTimer.js removes the expired login tokens once a minute.
//
// The server removes tokens made before expiredBefore(now) in one query, which
// is right only if expiredBefore is the exact inverse of logoutDeadline. The
// brute-force test below checks that over two years of logins, in the time
// zone the suite runs in and in two with daylight saving time.
//
// Run: node tests/logoutTimer.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { logoutTimerConfig, logoutDeadline, expiredBefore } = require('../models/lib/logoutTimer');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log(`logoutTimer (TZ=${process.env.TZ || 'system'}):`);

const env = values => name => values[name];

test('off unless LOGOUT_WITH_TIMER is true', () => {
  assert.deepEqual(logoutTimerConfig(env({})), { enabled: false, reason: 'off' });
  assert.deepEqual(logoutTimerConfig(env({ LOGOUT_WITH_TIMER: 'false', LOGOUT_IN: '1' })), { enabled: false, reason: 'off' });
});

test('the three shapes it accepts', () => {
  assert.deepEqual(logoutTimerConfig(env({ LOGOUT_WITH_TIMER: 'true', LOGOUT_IN: '2' })),
    { enabled: true, days: 2, hour: null, minute: null });
  assert.deepEqual(logoutTimerConfig(env({ LOGOUT_WITH_TIMER: 'true', LOGOUT_ON_HOURS: '3' })),
    { enabled: true, days: 0, hour: 3, minute: 0 });
  assert.deepEqual(logoutTimerConfig(env({ LOGOUT_WITH_TIMER: 'true', LOGOUT_IN: '1', LOGOUT_ON_HOURS: '9', LOGOUT_ON_MINUTES: '55' })),
    { enabled: true, days: 1, hour: 9, minute: 55 });
});

test('negative: an unusable setting turns it off with the reason, never logs everybody out', () => {
  for (const values of [
    { LOGOUT_WITH_TIMER: 'true' },
    { LOGOUT_WITH_TIMER: 'true', LOGOUT_IN: '0' },
    { LOGOUT_WITH_TIMER: 'true', LOGOUT_IN: '-1' },
    { LOGOUT_WITH_TIMER: 'true', LOGOUT_IN: '1.5' },
    { LOGOUT_WITH_TIMER: 'true', LOGOUT_IN: 'soon' },
    { LOGOUT_WITH_TIMER: 'true', LOGOUT_ON_HOURS: '24' },
    { LOGOUT_WITH_TIMER: 'true', LOGOUT_ON_HOURS: '9', LOGOUT_ON_MINUTES: '60' },
    { LOGOUT_WITH_TIMER: 'true', LOGOUT_ON_MINUTES: '30' },
  ]) {
    const config = logoutTimerConfig(env(values));
    assert.equal(config.enabled, false, JSON.stringify(values));
    assert.ok(config.reason && config.reason !== 'off', JSON.stringify(values));
    assert.equal(expiredBefore(new Date(), config), null);
  }
});

test('deadlines as documented', () => {
  const login = new Date(2026, 9, 8, 14, 30);
  const days2 = logoutTimerConfig(env({ LOGOUT_WITH_TIMER: 'true', LOGOUT_IN: '2' }));
  assert.equal(logoutDeadline(login, days2).getTime(), login.getTime() + 2 * 86400000);
  const at3 = logoutTimerConfig(env({ LOGOUT_WITH_TIMER: 'true', LOGOUT_ON_HOURS: '3' }));
  assert.deepEqual(logoutDeadline(login, at3), new Date(2026, 9, 9, 3, 0), 'the next 03:00');
  assert.deepEqual(logoutDeadline(new Date(2026, 9, 8, 2, 0), at3), new Date(2026, 9, 8, 3, 0), 'the same night');
  const next955 = logoutTimerConfig(env({ LOGOUT_WITH_TIMER: 'true', LOGOUT_IN: '1', LOGOUT_ON_HOURS: '9', LOGOUT_ON_MINUTES: '55' }));
  assert.deepEqual(logoutDeadline(login, next955), new Date(2026, 9, 9, 9, 55), 'the next day at 09:55');
  assert.deepEqual(logoutDeadline(new Date(2026, 9, 8, 23, 59), next955), new Date(2026, 9, 9, 9, 55));
});

// The property the one-query sweep depends on: a token is removed at `now` if
// and only if its deadline has come.
test('expiredBefore is the exact inverse of logoutDeadline', () => {
  const configs = [
    { LOGOUT_IN: '1' }, { LOGOUT_IN: '30' },
    { LOGOUT_ON_HOURS: '0' }, { LOGOUT_ON_HOURS: '3', LOGOUT_ON_MINUTES: '30' }, { LOGOUT_ON_HOURS: '23', LOGOUT_ON_MINUTES: '59' },
    { LOGOUT_IN: '1', LOGOUT_ON_HOURS: '9', LOGOUT_ON_MINUTES: '55' }, { LOGOUT_IN: '7', LOGOUT_ON_HOURS: '2' },
  ].map(values => logoutTimerConfig(env({ LOGOUT_WITH_TIMER: 'true', ...values })));
  // Deterministic pseudo-random instants over two years, both DST changes included.
  let seed = 42;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const start = new Date(2026, 0, 1).getTime();
  const span = 2 * 365 * 86400000;
  let checked = 0;
  for (const config of configs) {
    for (let i = 0; i < 400; i++) {
      const now = new Date(start + 40 * 86400000 + Math.floor(random() * span));
      const cutoff = expiredBefore(now, config);
      for (let j = 0; j < 12; j++) {
        const when = new Date(now.getTime() - Math.floor(random() * 40 * 86400000));
        const expired = logoutDeadline(when, config).getTime() <= now.getTime();
        assert.equal(when.getTime() < cutoff.getTime(), expired,
          `${JSON.stringify(config)} login ${when.toString()} now ${now.toString()}`);
        checked++;
      }
    }
  }
  assert.ok(checked > 30000);
});

test('the server sweeps through the resolver, once a minute, in one query', () => {
  const server = read('server/logoutTimer.js');
  assert.match(server, /logoutTimerConfig\(authEnv\)/, 'Admin Panel overrides apply');
  assert.match(server, /Meteor\.setInterval\(sweep, SWEEP_MS\)/);
  assert.match(server, /\$pull: \{ 'services\.resume\.loginTokens': \{ when: \{ \$lt: cutoff \} \} \}/);
  assert.match(server, /if \(!config\.enabled\) \{[\s\S]*?return 0;/, 'off or unusable removes nothing');
  assert.match(read('server/imports.js'), /^import '\/server\/logoutTimer';$/m);
  const { AUTH_CONFIG_SECTIONS } = require('../models/lib/authConfigCatalog');
  const login = AUTH_CONFIG_SECTIONS.login.fields.map(field => field.envVar);
  for (const name of ['LOGOUT_WITH_TIMER', 'LOGOUT_IN', 'LOGOUT_ON_HOURS', 'LOGOUT_ON_MINUTES']) {
    assert.ok(login.includes(name), `${name} is overridable in Admin Panel / People / Login`);
  }
});

console.log(`\nlogoutTimer: ${passed} tests passed`);

// The same checks in time zones with daylight saving time, once.
if (!process.env.LOGOUT_TIMER_TZ_CHILD) {
  for (const tz of ['Europe/Helsinki', 'America/New_York']) {
    execFileSync(process.execPath, [__filename], { stdio: 'inherit', env: { ...process.env, TZ: tz, LOGOUT_TIMER_TZ_CHILD: '1' } });
  }
}
