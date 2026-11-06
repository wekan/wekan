'use strict';

// Guard: Playwright specs that change the site-wide password policy hold one
// lock, and put the policy back to its default rather than to a snapshot.
// Run: node tests/playwrightSharedSettingLock.test.cjs
//
// In the full Chromium run (two workers) password-length-report.e2e.js and
// password-min-length-signup-login.e2e.js ran side by side. Both write
// settings.loginOptions.passwordMinLength / passwordMinLengthEnforce, one
// document for every worker, so each switched enforcement on or off under
// the other, and one test of each failed. Both also "restored" the
// loginOptions they had seen before the test - and once a test had been
// interrupted, that snapshot already held an enforced minimum, which every
// later test then restored, so the minimum stayed enforced for the rest of
// the run. tests/playwright/helpers/sharedSettingLock.js makes the second
// file wait for the first, and the specs now $unset the two keys afterwards.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const specsDir = path.join(__dirname, 'playwright', 'specs');
const helper = path.join(__dirname, 'playwright', 'helpers', 'sharedSettingLock.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const specs = fs.readdirSync(specsDir).filter(f => f.endsWith('.e2e.js'))
  .map(f => ({ f, text: fs.readFileSync(path.join(specsDir, f), 'utf8') }));
// Writing the policy names its keys; a spec that only opens the Password
// length page (admin-pane-titles-and-help) reads it and needs no lock.
const writesPolicy = ({ text }) => /loginOptions\.passwordMinLength/.test(text);
const policySpecs = specs.filter(writesPolicy);

test('the scan finds the password policy specs', () => {
  const names = policySpecs.map(s => s.f);
  assert.ok(names.includes('password-length-report.e2e.js'), names.join(', '));
  assert.ok(names.includes('password-min-length-signup-login.e2e.js'), names.join(', '));
});

test('every spec that changes the password policy holds the password-policy lock', () => {
  const missing = policySpecs.filter(({ text }) => !/holdSharedSetting\(test, 'password-policy'\)/.test(text)).map(s => s.f);
  assert.deepStrictEqual(missing, [],
    'these specs change the site-wide password policy without the lock, so they can run beside another that does');
});

test('negative: no such spec restores loginOptions from a snapshot', () => {
  const restoring = policySpecs.filter(({ text }) => /loginOptions:\s*setting\.loginOptions/.test(text)).map(s => s.f);
  assert.deepStrictEqual(restoring, [],
    'restoring a snapshot keeps an enforced minimum that an interrupted test left behind');
  for (const { f, text } of policySpecs) {
    assert.match(text, /\$unset: \{ 'loginOptions\.passwordMinLength': '', 'loginOptions\.passwordMinLengthEnforce': '' \}/, f);
  }
});

async function lockBehaviour() {
  // Driven for real, in a throwaway TMPDIR.
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'setting-lock-test-'));
  const old = process.env.TMPDIR;
  process.env.TMPDIR = tmp;
  try {
    delete require.cache[require.resolve(helper)];
    const { acquire } = require(helper);
    const dir = path.join(tmp, 'wekan-e2e-setting-lock-probe');
    const a = await acquire('probe');
    const b = await acquire('probe');
    a();
    assert.ok(fs.existsSync(dir), 'still held while another holder in this process has it');
    b();
    assert.ok(!fs.existsSync(dir), 'released by the last holder');
    // A lock whose owner is gone is taken over rather than waited for.
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'pid'), '2147483646');
    const c = await acquire('probe');
    assert.strictEqual(fs.readFileSync(path.join(dir, 'pid'), 'utf8'), String(process.pid));
    c();
    // Negative: a live other holder is waited for, until the time limit.
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'pid'), String(process.ppid));
    await assert.rejects(acquire('probe', { waitMs: 300 }), /still held by process/);
    fs.rmSync(dir, { recursive: true, force: true });
    await assert.rejects(acquire('Not Kebab'), /kebab-case/);
  } finally {
    process.env.TMPDIR = old;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  passed += 1;
  console.log('  ok - the lock waits for another holder, is shared inside one process, and survives a dead holder');
}

lockBehaviour().then(() => console.log(`\n${passed} passed`), error => { console.error(error); process.exit(1); });
