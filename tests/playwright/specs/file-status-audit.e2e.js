'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('File status audit reports incomplete upload metadata and restricts checks to administrators', async ({ page, adminUser, user, board }) => {
  const id = db.uid('auditpartial');
  db.insertOne('attachments', { _id: id, name: 'unfinished.xlsx', meta: { boardId: board.boardId, cardId: 'missing-card' } });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    for (const pane of ['recovery', 'integrity', 'files']) {
      await navigateInApp(page, `/admin/problems/${pane}`);
      await expect(page.locator('.js-file-audit-all')).toBeVisible();
    }
    // A previous browser's completed scan has a deliberate server cooldown.
    await expect.poll(async () => page.evaluate(async () => {
      const status = await window.Meteor.callAsync('getFileStatusAudit');
      return !status || status.state === 'running' || Date.now() - new Date(status.startedAt).getTime() >= 30000;
    }), { timeout: 35000 }).toBe(true);
    const previous = await page.evaluate(() => window.Meteor.callAsync('getFileStatusAudit'));
    await page.locator('.js-file-audit-inventory').click();
    await expect.poll(() => page.evaluate(id => window.Meteor.callAsync('getFileStatusAudit').then(r => r?.id !== id && ['completed', 'partial'].includes(r?.state)), previous?.id || null), { timeout: 150000 }).toBe(true);
    await expect(page.locator('.file-status-audit-result')).toContainText(/completed|partial/, { timeout: 150000 });
    const report = await page.evaluate(() => window.Meteor.callAsync('getFileStatusAudit'));
    expect(report.totals['missing-versions']).toBeGreaterThan(0);
    expect(report.findings.some(row => row.id === id && row.kind === 'missing-versions')).toBe(true);
    expect(db.findOne('attachments', { _id: id }).versions).toBeUndefined();
    await expect(page.locator('.file-status-audit')).toContainText('missing-versions');
    const downloaded = page.waitForEvent('download');
    await page.locator('.js-file-audit-download').click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe('wekan-file-status.json');
    const parts = [];
    for await (const chunk of await download.createReadStream()) parts.push(chunk);
    expect(JSON.parse(Buffer.concat(parts).toString()).id).toBe(report.id);
    await loginWithToken(page, user.id, user.token);
    const error = await page.evaluate(async () => {
      try { await window.Meteor.callAsync('startFileStatusAudit', 'all'); return null; }
      catch (error) { return error.error; }
    });
    expect(error).toBe('not-authorized');
  } finally { db.deleteOne('attachments', { _id: id }); }
});

for (const format of ['png', 'html']) {
test(`File status content checks detect ${format} with a wrong extension without modifying the upload`, async ({ page, adminUser, board }) => {
  const fs = require('node:fs'), path = require('node:path');
  const id = db.uid('audittype');
  const directory = path.join(process.env.WEKAN_FILES_PATH, 'attachments');
  const filename = path.join(directory, `${id}.txt`);
  const bytes = format === 'html' ? Buffer.from('<!doctype html><html><body>MIME regression</body></html>') : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
  fs.mkdirSync(directory, { recursive: true }); fs.writeFileSync(filename, bytes);
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const paths = await page.evaluate(() => window.Meteor.callAsync('getAttachmentStoragePaths'));
    const serverFilename = `${paths.attachments}/${id}.txt`;
    db.insertOne('attachments', { _id: id, name: `${id}.txt`, extension: 'txt', type: 'text/plain', size: bytes.length,
      meta: { boardId: board.boardId }, versions: { original: { storage: 'fs', path: serverFilename, size: bytes.length, extension: 'txt', type: 'text/plain' } } });
    await navigateInApp(page, '/admin/problems/files');
    await expect(page.locator('.js-file-audit-types')).toBeVisible();
    await expect.poll(async () => page.evaluate(async () => {
      const status = await window.Meteor.callAsync('getFileStatusAudit');
      return !status || status.state === 'running' || Date.now() - new Date(status.startedAt).getTime() >= 30000;
    }), { timeout: 35000 }).toBe(true);
    const previous = await page.evaluate(() => window.Meteor.callAsync('getFileStatusAudit'));
    await page.locator('.js-file-audit-types').click();
    await expect.poll(() => page.evaluate(id => window.Meteor.callAsync('getFileStatusAudit').then(r => r?.id !== id && ['completed', 'partial'].includes(r?.state)), previous?.id || null), { timeout: 150000 }).toBe(true);
    await expect(page.locator('.file-status-audit-result')).toContainText(/completed|partial/, { timeout: 150000 });
    const report = await page.evaluate(() => window.Meteor.callAsync('getFileStatusAudit'));
    expect(report.mode).toBe('types');
    expect(report.findings.some(row => row.id === id && row.kind === 'extension-mismatch' && row.detected === format)).toBe(true);
    expect(report.findings.some(row => row.id === id && row.kind === 'mime-mismatch' && row.detected === (format === 'png' ? 'image/png' : 'text/html'))).toBe(true);
    expect(db.findOne('attachments', { _id: id }).extension).toBe('txt');
    expect(fs.readFileSync(filename).equals(bytes)).toBe(true);
  } finally { db.deleteOne('attachments', { _id: id }); fs.rmSync(filename, { force: true }); }
});
}
