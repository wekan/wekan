'use strict';

// New passwords: PASSWORD_MIN_LENGTH and PASSWORD_CHECK_PWNED
// (models/lib/passwordPolicy.js, server/lib/passwordPolicy.js,
// client/lib/newPasswordCheck.js).
//
//  - test: too short, too long, the username, and a breached password are
//    refused; the default minimum is 8;
//  - negative: a long enough password passes, a broken setting does not open
//    the minimum to 1, padding lines are not breaches, and an unreachable
//    breach service never refuses a password;
//  - negative, "nowhere else": every place a password reaches the server as
//    text checks it, and signing in is never checked;
//  - the browser check sends 5 hex digits of the SHA-1, never the password,
//    and leaves the sign-in form alone.
//
// Run: node tests/passwordPolicy.test.cjs

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const {
  passwordPolicyConfig, passwordProblem, parsePwnedRange, isPwned,
} = require('../models/lib/passwordPolicy');
const { AUTH_CONFIG_SECTIONS } = require('../models/lib/authConfigCatalog');

let passed = 0;
const pending = [];
function test(name, fn) {
  pending.push(async () => {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  });
}
const env = values => name => values[name];
const sha1 = s => crypto.createHash('sha1').update(s, 'utf8').digest('hex').toUpperCase();

test('the default refuses a password shorter than 8 characters', () => {
  const config = passwordPolicyConfig(env({}));
  assert.deepStrictEqual(config, { minLength: 8, checkPwned: false });
  assert.deepStrictEqual(passwordProblem('1234567', config), { error: 'password-too-short', min: 8 });
  assert.strictEqual(passwordProblem('12345678', config), null);
});

test('the administrator sets the minimum; length counts characters, not bytes', () => {
  const config = passwordPolicyConfig(env({ PASSWORD_MIN_LENGTH: '12' }));
  assert.strictEqual(config.minLength, 12);
  assert.strictEqual(passwordProblem('short-pass1', config).error, 'password-too-short');
  assert.strictEqual(passwordProblem('äöåäöåäöåäöå', config), null, '12 characters, 24 bytes');
  assert.strictEqual(passwordPolicyConfig(env({ PASSWORD_MIN_LENGTH: '9999' })).minLength, 256);
});

test('the username, the email and a huge password are refused', () => {
  const config = passwordPolicyConfig(env({}));
  assert.strictEqual(passwordProblem('Administrator', config, { username: 'administrator' }).error, 'password-same-as-username');
  assert.strictEqual(passwordProblem('maija.meikalainen', config, { email: 'maija.meikalainen@example.com' }).error, 'password-same-as-username');
  assert.strictEqual(passwordProblem('x'.repeat(513), config).error, 'password-too-long');
  assert.strictEqual(passwordProblem(undefined, config).error, 'password-invalid');
});

test('negative: a broken PASSWORD_MIN_LENGTH keeps the default instead of allowing any password', () => {
  for (const bad of ['0', '-5', 'eight', '7.5']) {
    assert.strictEqual(passwordPolicyConfig(env({ PASSWORD_MIN_LENGTH: bad })).minLength, 8, bad);
  }
});

test('a breached password is found from its range; padding is not a breach', () => {
  const hash = sha1('password');
  const body = [`${hash.slice(5)}:9659365`, `${'0'.repeat(35)}:0`, 'garbage', `${'A'.repeat(35)}:2`].join('\r\n');
  const suffixes = parsePwnedRange(body);
  assert.deepStrictEqual(suffixes, [hash.slice(5), 'A'.repeat(35)]);
  assert.strictEqual(isPwned(hash, suffixes), true);
  assert.strictEqual(isPwned(sha1('correct horse battery staple 2026'), suffixes), false);
  assert.strictEqual(isPwned('0'.repeat(40), parsePwnedRange(`${'0'.repeat(35)}:0`)), false, 'padding');
  assert.strictEqual(isPwned('not hex', suffixes), false);
});

test('the server checks every password that reaches it as text', () => {
  const users = read('server/models/users.js');
  const setPassword = users.slice(users.indexOf('async setPassword('), users.indexOf('Accounts.setPasswordAsync(userId, newPassword)'));
  assert.match(setPassword, /await assertNewPassword\(newPassword,/, 'Admin Panel / People / Set password');
  const create = users.slice(users.indexOf('async setCreateUser('), users.indexOf("from: 'admin' }"));
  assert.match(create, /await assertNewPassword\(password, \{ username, email \}\)/, 'Admin Panel / People / Add user');
  const register = read('server/apiAuthRoutes.js');
  assert.ok(register.indexOf("assertNewPassword(options.password") > -1
    && register.indexOf("assertNewPassword(options.password") < register.indexOf('Accounts.createUserAsync(userOptions)'),
    'POST /users/register checks before it creates the account');
});

test('negative: nothing else sets a password from text without the check (LDAP is the directory\'s)', () => {
  const { execFileSync } = require('child_process');
  const hits = execFileSync('git', ['grep', '-n', '-E', 'createUserAsync\\(|setPasswordAsync\\(|Accounts\\.setPassword\\(', '--',
    'server', 'models', 'config', 'imports', 'packages'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n').filter(Boolean).filter(l => !/\/tests?\//.test(l) && !/^[^:]+:\d+:\s*\/\//.test(l));
  const allowed = [
    /^server\/apiAuthRoutes\.js:/, /^server\/models\/users\.js:/,
    /^packages\/wekan-ldap\//, /^models\/lib\/clientAccountCreation\.js:/,
  ];
  assert.deepStrictEqual(hits.filter(l => !allowed.some(re => re.test(l))), []);
});

test('negative: signing in is never checked, so an existing shorter password still works', () => {
  const accounts = read('config/accounts.js');
  assert.match(accounts, /AccountsTemplates\.getField\(id\)/);
  assert.match(accounts, /for \(const id of \['password', 'password_again'\]\)/);
  const check = read('client/lib/newPasswordCheck.js');
  assert.match(check, /#at-field-password_again/);
  assert.match(check, /#at-field-current_password/);
  assert.doesNotMatch(read('server/lib/passwordPolicy.js'), /validateLoginAttempt/);
});

test('the browser sends five hex digits of the SHA-1 and replays a clean password', async () => {
  const { createNewPasswordSubmitHandler, isNewPasswordForm } = require('../client/lib/newPasswordCheck');
  const subtle = require('crypto').webcrypto.subtle;
  function form(fields) {
    return {
      id: 'at-pwd-form',
      querySelector: sel => (fields[sel] !== undefined ? { value: fields[sel] } : null),
    };
  }
  const asked = [];
  const errors = [];
  const replayed = [];
  const breachedSuffix = sha1('password').slice(5);
  const handler = createNewPasswordSubmitHandler({
    policy: () => ({ checkPwned: true }),
    range: async prefix => { asked.push(prefix); return [breachedSuffix]; },
    subtle,
    pwnedMessage: () => 'breached',
    showError: m => errors.push(m),
    replay: f => replayed.push(f),
  });
  const event = target => ({ target, preventDefault() {}, stopImmediatePropagation() {} });

  const bad = form({ '#at-field-password': 'password', '#at-field-password_again': 'password' });
  await handler(event(bad));
  assert.deepStrictEqual(asked, [sha1('password').slice(0, 5)], 'only the prefix leaves the browser');
  assert.deepStrictEqual(errors, ['breached']);
  assert.strictEqual(replayed.length, 0);

  const good = form({ '#at-field-password': 'a fine new password 2026', '#at-field-current_password': 'old' });
  await handler(event(good));
  assert.deepStrictEqual(replayed, [good]);

  assert.strictEqual(isNewPasswordForm(form({ '#at-field-password': 'x' })), false, 'the sign-in form is not checked');
});

test('negative: an unreachable breach service never stops a password', async () => {
  const { createNewPasswordSubmitHandler } = require('../client/lib/newPasswordCheck');
  const replayed = [];
  const handler = createNewPasswordSubmitHandler({
    policy: () => ({ checkPwned: true }),
    range: async () => { throw new Error('offline'); },
    subtle: require('crypto').webcrypto.subtle,
    pwnedMessage: () => 'breached', showError: () => { throw new Error('must not refuse'); },
    replay: f => replayed.push(f),
  });
  const f = { id: 'at-pwd-form', querySelector: sel => (sel.startsWith('#at-field-password') ? { value: 'password' } : null) };
  await handler({ target: f, preventDefault() {}, stopImmediatePropagation() {} });
  assert.strictEqual(replayed.length, 1);
  const server = read('server/lib/passwordPolicy.js');
  assert.match(server, /if \(!response\.ok\) return null;/);
  assert.match(server, /return suffixes \? isPwned\(sha1, suffixes\) : false;/);
});

test('the settings are in the catalog, and breach checks are off unless asked for', () => {
  const login = AUTH_CONFIG_SECTIONS.login.fields.map(f => [f.envVar, f.defaultValue]);
  assert.deepStrictEqual(login.filter(([v]) => v.startsWith('PASSWORD_') && v !== 'PASSWORD_LOGIN_ENABLED'),
    [['PASSWORD_MIN_LENGTH', 8], ['PASSWORD_CHECK_PWNED', false]]);
  assert.match(read('server/lib/passwordPolicy.js'), /if \(!currentPasswordPolicy\(\)\.checkPwned\) return null;/);
  assert.match(read('server/lib/passwordPolicy.js'), /DDPRateLimiter\.addRule\(\{ type: 'method', name: 'passwordPwnedRange' \}/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['password-pwned', 'password-too-short', 'password-same-as-username']) assert.ok(en[key], key);
  assert.match(en['password-too-short'], /__min__/);
});

(async () => {
  for (const run of pending) await run();
  console.log(`passwordPolicy: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
