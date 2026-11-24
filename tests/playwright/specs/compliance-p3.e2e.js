'use strict';
// docs/Compliance/README.md P3, against a live server:
// - every audited administrator action is appended to the hash chain, and the
//   chain verifies (models/lib/auditChain.js);
// - emergency access is kept with its note (models/lib/emergencyAccess.js);
// - with REGISTRATION_MINIMUM_AGE set, a sign-up without the age confirmation
//   is refused and one with it is accepted (models/lib/registrationAge.js).
//   Skipped when the server runs without the setting.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const call = (page, name, ...args) => page.evaluate(([n, a]) => Meteor.callAsync(n, ...a)
  .then(r => ({ ok: true, r }), e => ({ ok: false, error: e.error, reason: e.reason })), [name, args]);

test('audited actions are hash-chained, and the chain verifies', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  // Two audited actions (saveLegalContacts is in AUDITED_METHODS).
  expect((await call(page, 'saveLegalContacts', { privacyContact: 'p1@example.com' })).ok).toBe(true);
  expect((await call(page, 'saveLegalContacts', { privacyContact: 'p2@example.com' })).ok).toBe(true);
  const rows = db.find('adminAuditLog', { method: 'saveLegalContacts', seq: { $exists: true } });
  expect(rows.length).toBeGreaterThanOrEqual(2);
  for (const r of rows) {
    expect(r._id).toBe(`audit-${String(r.seq).padStart(12, '0')}`);
    expect(r.hash).toMatch(/^[0-9a-f]{64}$/);
  }
  const verified = await call(page, 'verifyAdminAuditChain');
  expect(verified.ok).toBe(true);
  expect(verified.r.ok).toBe(true);
  expect(verified.r.checked).toBeGreaterThanOrEqual(2);

  // Negative: an edited row is found.
  const last = rows.sort((a, b) => b.seq - a.seq)[0];
  db.updateOne('adminAuditLog', { _id: last._id }, { $set: { actorUsername: 'someone-else' } });
  try {
    const broken = await call(page, 'verifyAdminAuditChain');
    expect(broken.r.ok).toBe(false);
    expect(broken.r.broken).toContainEqual({ seq: last.seq, reason: 'changed' });
  } finally {
    db.updateOne('adminAuditLog', { _id: last._id }, { $set: { actorUsername: last.actorUsername } });
  }
  expect((await call(page, 'verifyAdminAuditChain')).r.ok).toBe(true);
});

test('emergency access is kept as such, with its note', async ({ page, adminUser, user }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  db.deleteMany('impersonatedUsers', { adminId: adminUser.id });
  const res = await page.evaluate(id => Meteor.callAsync('impersonate', id, { emergency: true, note: 'locked out, on call' })
    .then(() => true, e => e.reason || e.message), user.id);
  expect(res).toBe(true);
  const rec = db.findOne('impersonatedUsers', { adminId: adminUser.id, userId: user.id });
  expect(rec.reason).toBe('emergency');
  expect(rec.note).toBe('locked out, on call');
});

// Through the real sign-up form (ATCreateUserServer), as a person signs up.
async function signUp(browser, name, tick) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/sign-up', { waitUntil: 'load' });
  await expect(page.locator('#at-field-confirmAge')).toBeVisible({ timeout: 20_000 });
  await page.locator('#at-field-username').fill(name);
  await page.locator('#at-field-email').fill(`${name}@example.com`);
  await page.locator('#at-field-password').fill('Long-Enough-Pw-123');
  const again = page.locator('#at-field-password_again');
  if (await again.count()) await again.fill('Long-Enough-Pw-123');
  if (tick) await page.locator('#at-field-confirmAge').check();
  // The browser's own "required" check would stop the form before the
  // server sees it; the server's refusal is what is tested here.
  else await page.evaluate(() => document.getElementById('at-field-confirmAge').removeAttribute('required'));
  await page.locator('#at-btn').click();
  return { context, page };
}

test('with a minimum age set, a sign-up must confirm it', async ({ browser, page }) => {
  await page.goto('/sign-up', { waitUntil: 'load' });
  const age = await page.evaluate(() => Meteor.callAsync('getRegistrationMinimumAge'));
  test.skip(!age, 'the server runs without REGISTRATION_MINIMUM_AGE');
  const name = `age${Date.now()}`;
  const names = [`${name}n`, `${name}y`];
  try {
    const refused = await signUp(browser, names[0], false);
    await refused.page.waitForTimeout(4000);
    expect(db.findOne('users', { username: names[0] }), 'refused without the confirmation').toBeFalsy();
    await refused.context.close();
    db.deleteMany('AccountsLockout.Connections', { clientAddress: { $in: ['127.0.0.1', '::1', '::ffff:127.0.0.1'] } });
    const accepted = await signUp(browser, names[1], true);
    await expect.poll(() => !!db.findOne('users', { username: names[1] }), { timeout: 20_000 }).toBe(true);
    const made = db.findOne('users', { username: names[1] });
    expect(made.profile && made.profile.confirmAge, 'nothing of the box is kept').toBeUndefined();
    await accepted.context.close();
  } finally {
    db.deleteMany('users', { username: { $in: names } });
  }
});

test('Where I am signed in: every session, this browser marked, and one can be ended', async ({ page, user }) => {
  await loginWithToken(page, user.id, user.token);
  db.addResumeToken(user.id);
  const sessions = (await call(page, 'getMySessions')).r;
  expect(sessions.length).toBeGreaterThanOrEqual(2);
  expect(sessions.filter(s => s.current)).toHaveLength(1);
  expect(JSON.stringify(sessions)).not.toContain('hashedToken');
  const other = sessions.find(s => !s.current);
  expect((await call(page, 'endMySession', other.id)).ok).toBe(true);
  const after = (await call(page, 'getMySessions')).r;
  expect(after.map(s => s.id)).not.toContain(other.id);
  expect(after.some(s => s.current), 'this browser is still signed in').toBe(true);
  // Negative: a session id that is not the caller's is not found.
  expect((await call(page, 'endMySession', 'ffffffffffffffff')).error).toBe('session-not-found');
});
