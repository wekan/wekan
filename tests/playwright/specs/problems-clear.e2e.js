'use strict';
// #6893: Admin Panel -> Problems -> Summary. Clear, beside Acknowledge,
// removes the checked streams' events up to now, so a resolved problem stops
// showing; an unchecked stream keeps its rows, and a non-admin cannot clear.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Clear removes the checked streams\' problems and keeps the rest', async ({ page, user, adminUser }) => {
  const mark = `clear6893-${Date.now()}`;
  const old = new Date(Date.now() - 60 * 60 * 1000);
  db.insertOne('eventlog', { _id: `${mark}-sec`, stream: 'security', severity: 'high', action: 'blocked',
    category: 'authz', source: mark, detail: mark, count: 1, firstAt: old, at: old });
  db.insertOne('eventlog', { _id: `${mark}-db`, stream: 'database', severity: 'error', kind: 'error',
    source: mark, message: mark, count: 1, firstAt: old, at: old });
  const acks = db.find('eventlogAcks', {});
  db.deleteMany('eventlogAcks', { stream: { $in: ['security', 'database'] } });
  try {
    // Negative: a member who is not an admin is refused, and nothing is removed.
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(() => Meteor.callAsync('clearEventLog', ['security']).then(() => 'ok', e => e.error));
    expect(denied).toBe('not-authorized');
    expect(db.findOne('eventlog', { _id: `${mark}-sec` })).toBeTruthy();

    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/summary');
    const security = page.locator('.js-problem-check[data-stream="security"]');
    await expect(security).toBeVisible();
    await expect(page.locator('button.js-clear-checked')).toBeVisible();
    await expect(page.locator('button.js-ack-checked')).toBeVisible();
    await security.check();
    await page.locator('button.js-clear-checked').click();

    await expect.poll(() => db.findOne('eventlog', { _id: `${mark}-sec` })).toBeFalsy();
    expect(db.findOne('eventlog', { _id: `${mark}-db` }), 'the unchecked stream keeps its rows').toBeTruthy();
    expect(db.findOne('eventlogAcks', { stream: 'security' })?.at).toBeTruthy();
    await expect(page.locator('.js-problem-check[data-stream="security"]')).toHaveCount(0);
    await expect(page.locator('.js-problem-check[data-stream="database"]')).toBeVisible();
  } finally {
    db.deleteMany('eventlog', { source: mark });
    db.deleteMany('eventlogAcks', { stream: { $in: ['security', 'database'] } });
    for (const ack of acks.filter(a => ['security', 'database'].includes(a.stream))) db.insertOne('eventlogAcks', ack);
  }
});
