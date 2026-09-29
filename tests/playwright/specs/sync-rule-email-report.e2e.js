'use strict';
const { randomBytes, randomUUID } = require('node:crypto');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
test('only administrators can read bounded rule-email attempt metadata through DDP', async ({ page, user, adminUser }) => {
  const prefix = randomBytes(12).toString('hex');
  const ids = Array.from({ length: 12 }, (_, i) => `${prefix}${i.toString(16).padStart(40, '0')}`);
  for (const id of ids) db.insertOne('listSyncRuleEmailAttempts', { _id: id, version: 1,
    commandHash: 'a'.repeat(64), invocationId: 'b'.repeat(64), attemptId: randomUUID(),
    state: 'sending', startedAt: new Date(1000), mail: 'private body and address@example.org' });
  const query = { search: prefix, page: 0, status: 'unconfirmed' };
  try {
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(async query => {
      try { await Meteor.callAsync('syncRuleEmailRecoveryReport', query); return 'accepted'; }
      catch (error) { return error.error; }
    }, query);
    expect(denied).toBe('not-authorized');
    await loginWithToken(page, adminUser.id, adminUser.token);
    const first = await page.evaluate(query => Meteor.callAsync('syncRuleEmailRecoveryReport', query), query);
    expect(first.total).toBe(12); expect(first.rows).toHaveLength(10);
    expect(first.rows[0].status).toBe('unconfirmed');
    expect(Object.keys(first.rows[0]).sort()).toEqual(['attemptId', 'commandId', 'finishedAt', 'invocationId', 'startedAt', 'status']);
    expect(JSON.stringify(first)).not.toContain('private body');
    expect(JSON.stringify(first)).not.toContain('address@example.org');
    const last = await page.evaluate(query => Meteor.callAsync('syncRuleEmailRecoveryReport', query), { ...query, page: 99 });
    expect(last.page).toBe(1); expect(last.rows).toHaveLength(2);
    expect(new Set([...first.rows, ...last.rows].map(row => row.commandId)).size).toBe(12);
  } finally { db.deleteMany('listSyncRuleEmailAttempts', { _id: { $in: ids } }); }
});


test('administrator filters, pages and refreshes rule email attempts in Recovery', async ({ page, adminUser }) => {
  const prefix = randomBytes(12).toString('hex');
  const ids = Array.from({ length: 13 }, (_, i) => `${prefix}${i.toString(16).padStart(40, '0')}`);
  for (const [i, id] of ids.entries()) db.insertOne('listSyncRuleEmailAttempts', {
    _id: id, version: 1, commandHash: 'a'.repeat(64), invocationId: 'b'.repeat(64),
    attemptId: randomUUID(), state: i === 12 ? 'sent' : 'sending', startedAt: new Date(1000),
    ...(i === 12 ? { finishedAt: new Date(2000) } : {}), mail: 'private body address@example.org',
  });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.sync-rule-email-recovery-reports');
    await expect(panel.getByRole('heading', { name: 'Rule email delivery' })).toBeVisible();
    const search = panel.locator('.js-table-page-search');
    await search.fill(prefix); await search.press('Enter');
    const rows = panel.locator('tr[data-command]');
    await expect(rows).toHaveCount(10);
    await expect(rows.first()).toHaveAttribute('data-command', ids[0]);
    await panel.locator('.js-table-page-next').click();
    await expect(rows).toHaveCount(3);
    await panel.locator('.js-table-page-prev').click();
    await expect(rows).toHaveCount(10);
    await panel.locator('.js-rule-email-status').selectOption('sent');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toHaveAttribute('data-command', ids[12]);
    await expect(rows.first()).toContainText('Accepted by mail server');
    await panel.locator('.js-rule-email-status').selectOption('unconfirmed');
    await expect(rows).toHaveCount(10);
    await panel.locator('.js-table-page-next').click();
    await expect(rows).toHaveCount(2);
    await panel.locator('.js-table-page-action').click();
    await expect(rows).toHaveCount(2);
    await expect(panel).not.toContainText('private body');
    await expect(panel).not.toContainText('address@example.org');
    await search.fill(`${prefix}missing`); await search.press('Enter');
    await expect(rows).toHaveCount(0);
    await expect(panel).toContainText('No rule email attempts match this search.');
  } finally { db.deleteMany('listSyncRuleEmailAttempts', { _id: { $in: ids } }); }
});

// #2713, maintainer decision of 2026-09-30: an administrator resolves a
// partially accepted rule email. Resend needs a live SMTP server and is
// covered by tests/syncRuleEmailResolution.test.cjs; this pins the review,
// the quarantine refusal and a drop, end to end.
test('administrator reviews recipients and drops an unconfirmed rule email', async ({ page, user, adminUser }) => {
  const prefix = randomBytes(12).toString('hex');
  const oldId = `${prefix}${'0'.repeat(40)}`, newId = `${prefix}${'1'.repeat(40)}`;
  const seed = (id, startedAt) => {
    db.insertOne('listSyncRuleEmailCommands', { _id: id, checksum: 'a'.repeat(64), invocationId: 'b'.repeat(64),
      mail: { to: 'one@example.org, two@example.org', from: 'wekan@example.org', subject: 'S', text: 'T' } });
    const attemptId = randomUUID();
    db.insertOne('listSyncRuleEmailAttempts', { _id: id, version: 1, commandHash: 'a'.repeat(64),
      invocationId: 'b'.repeat(64), attemptId, state: 'sending', startedAt });
    db.insertOne('listSyncRuleEmailOutcomes', { _id: id, attemptId, accepted: ['one@example.org'] });
  };
  seed(oldId, new Date(Date.now() - 60 * 60 * 1000));
  seed(newId, new Date());
  try {
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(id => Meteor.callAsync('syncRuleEmailRecoveryResolve', { commandId: id, decision: 'drop' })
      .then(() => 'accepted', error => error.error), oldId);
    expect(denied).toBe('not-authorized');
    await loginWithToken(page, adminUser.id, adminUser.token);
    const early = await page.evaluate(id => Meteor.callAsync('syncRuleEmailRecoveryResolve', { commandId: id, decision: 'drop' })
      .then(() => 'accepted', error => error.error), newId);
    expect(early).toBe('rule-email-resolution-too-early');
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.sync-rule-email-recovery-reports');
    const search = panel.locator('.js-table-page-search');
    await search.fill(prefix); await search.press('Enter');
    await expect(panel.locator('tr[data-command]')).toHaveCount(2);
    await panel.locator(`tr[data-command="${oldId}"] .js-rule-email-review`).click();
    const detail = panel.locator('.rule-email-recovery-detail');
    await expect(detail).toContainText('one@example.org — Accepted');
    await expect(detail).toContainText('two@example.org — Not confirmed');
    page.once('dialog', dialog => dialog.accept());
    await detail.locator('.js-rule-email-drop').click();
    await expect(panel.locator(`tr[data-command="${oldId}"]`)).toContainText('Dropped by an administrator');
    await expect(detail.locator('.js-rule-email-drop')).toBeDisabled();
    const stored = db.findOne('listSyncRuleEmailAttempts', { _id: oldId });
    expect(stored.state).toBe('dropped');
  } finally {
    for (const name of ['listSyncRuleEmailCommands', 'listSyncRuleEmailAttempts', 'listSyncRuleEmailOutcomes']) {
      db.deleteMany(name, { _id: { $in: [oldId, newId] } });
    }
    db.deleteMany('listSyncRuleEmailResolutions', { commandId: { $in: [oldId, newId] } });
  }
});

// Legacy rule emails (maintainer decision of 2026-09-30): listed for review,
// never run automatically; discard records a dropped attempt. Re-binding
// needs a full rule/activity chain and is covered by
// tests/syncRuleEmailLegacy.test.cjs.
test('administrator reviews and discards a legacy rule email', async ({ page, user, adminUser }) => {
  const { canonical, sha256 } = require('../../../models/lib/changeHistoryIntegrity');
  const id = randomBytes(32).toString('hex'), planDoc = randomBytes(32).toString('hex');
  const plan = { version: 1, actions: [{ id: 'i'.repeat(64), rule: { _id: 'r' }, action: { _id: 'a', actionType: 'sendEmail' } }] };
  db.insertOne('listSyncRulePlans', { _id: planDoc, plan, checksum: sha256(canonical(plan)) });
  db.insertOne('listSyncRuleEmailCommands', { _id: id, version: 1, kind: 'rule-email', invocationId: 'i'.repeat(64),
    planId: planDoc, boardId: 'legacy-board', cardId: 'legacy-card', checksum: 'c'.repeat(64),
    mail: { to: 'legacy@example.org', from: 'wekan@example.org', subject: 'Legacy subject', text: 'T' } });
  try {
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(id => Meteor.callAsync('syncRuleEmailLegacyDiscard', id)
      .then(() => 'accepted', error => error.error), id);
    expect(denied).toBe('not-authorized');
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.sync-rule-email-legacy-commands');
    const row = panel.locator(`tr[data-command="${id}"]`);
    await expect(row).toContainText('legacy@example.org');
    await expect(row).toContainText('Legacy subject');
    await expect(row).toContainText('Source not recorded');
    page.once('dialog', dialog => dialog.accept());
    await row.locator('.js-rule-email-legacy-discard').click();
    await expect(row).toHaveCount(0);
    expect(db.findOne('listSyncRuleEmailAttempts', { _id: id }).state).toBe('dropped');
  } finally {
    db.deleteMany('listSyncRulePlans', { _id: planDoc });
    db.deleteMany('listSyncRuleEmailCommands', { _id: id });
    db.deleteMany('listSyncRuleEmailAttempts', { _id: id });
    db.deleteMany('listSyncRuleEmailResolutions', { commandId: id });
  }
});
