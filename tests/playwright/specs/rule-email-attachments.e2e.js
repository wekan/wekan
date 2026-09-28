'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { smtpSink } = require('../helpers/smtpSink');
const fs = require('node:fs');
const { ObjectId, Binary } = require('bson');
const path = require('node:path');
const call = (page, method, ...args) => page.evaluate(({ method, args }) => Meteor.callAsync(method, ...args), { method, args });

for (const backend of ['fs', 'gridfs']) {
test(`email rule form and SMTP carry only live triggering-card bytes from ${backend}`, async ({ boardPage: page, board }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT || !process.env.WEKAN_FILES_PATH, 'requires isolated SMTP capture and local file storage');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  const id = db.uid('mailattachment'), bytes = Buffer.from([0, 255, 128, 10, 13, 65, 66, 67]);
  const filename = path.join(process.env.WEKAN_FILES_PATH, 'attachments', `${id}.bin`);
  fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, bytes);
  const gridId = new ObjectId();
  const foreignId = db.uid('foreignattachment');
  const card = db.findOne('cards', { boardId: board.boardId });
  try {
    if (backend === 'gridfs') {
      db.insertOne('attachments.files', { _id: gridId, filename: 'report.bin', length: bytes.length, chunkSize: 255 * 1024, uploadDate: new Date() });
      db.insertOne('attachments.chunks', { files_id: gridId, n: 0, data: new Binary(bytes) });
    }
    db.insertOne('attachments', { _id: foreignId, name: 'foreign-secret.bin', meta: { cardId: 'another-card' } });
    db.insertOne('attachments', { _id: id, name: 'report.bin', extension: 'bin', type: 'application/octet-stream', size: bytes.length,
      meta: { boardId: board.boardId, cardId: card._id },
      versions: { original: { storage: backend, meta: backend === 'gridfs' ? { gridFsFileId: gridId.toHexString() } : {}, path: filename, size: bytes.length, extension: 'bin', type: 'application/octet-stream' } } });
    db.insertOne('checklists', { _id: `${id}-checklist`, cardId: card._id, title: 'Email checklist', sort: 0 });
    db.insertOne('checklistItems', { _id: `${id}-item`, cardId: card._id, checklistId: `${id}-checklist`, title: 'Reviewed task', isFinished: true, sort: 0 });
    db.insertOne('card_comments', { _id: `${id}-comment`, cardId: card._id, boardId: board.boardId, text: 'Public email comment', createdAt: new Date(), modifiedAt: new Date(), webhookResponsePending: 'NEVER-MAIL-PRIVATE-STATE' });
    db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date('2027-02-01'), spentTime: 0,
      customFields: [{ _id: `${id}-field`, value: 'high' }] } });
    db.insertOne('customFields', { _id: `${id}-field`, boardIds: [board.boardId], name: 'Mail priority', type: 'dropdown',
      settings: { dropdownItems: [{ _id: 'high', name: 'High priority' }] } });
    db.insertOne('card_text_notes', { _id: `${id}-note`, cardId: card._id, boardId: board.boardId, title: 'Mail note', text: 'Visible note content', createdAt: new Date() });
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    await page.locator('#ruleTitle').fill('Email card files');
    await page.locator('.js-goto-trigger').click();
    await page.locator('.js-set-button-triggers').click();
    await page.locator('.js-add-button-trigger').click();
    await page.locator('.js-set-mail-actions').click();
    await page.locator('#email-to').fill('attachments@example.invalid');
    await page.locator('#email-subject').fill('Card files');
    await page.locator('#email-msg').fill('Requested card content');
    await expect(page.locator('#email-attachments')).not.toBeChecked();
    await expect(page.locator('#email-discussion')).not.toBeChecked();
    await page.locator('#email-discussion').check();
    await expect(page.locator('#email-card-details')).not.toBeChecked();
    await page.locator('#email-card-details').check();
    await page.locator('#email-attachments').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#email-attachments')).toBeChecked();
    await page.locator('.js-mail-action').click();
    await expect(page.locator('.rules-lists-item').filter({ hasText: 'Email card files' })).toBeVisible();
    const rule = db.findOne('rules', { boardId: board.boardId, title: 'Email card files' });
    const action = db.findOne('actions', { _id: rule.actionId });
    expect(action.includeAttachments).toBe(true);
    expect(action.includeChecklistsAndComments).toBe(true);
    expect(action.includeCardDetails).toBe(true);
    expect(action.desc.toLowerCase()).toContain('attachments');
    await call(page, 'rules.runButton', rule._id, card._id);
    const mails = () => sink.messages.filter(mail => mail.recipients.includes('attachments@example.invalid'));
    await expect.poll(() => mails().length).toBe(1);
    expect(mails()[0].data).toContain('filename=report.bin');
    expect(mails()[0].data).toContain(bytes.toString('base64'));
    expect(mails()[0].data).toContain('Requested card content');
    expect(mails()[0].data).toContain('Email checklist');
    expect(mails()[0].data).toContain('[x] Reviewed task');
    expect(mails()[0].data).toContain('Public email comment');
    expect(mails()[0].data).toContain('Due: 2027-02-01T00:00:00.000Z');
    expect(mails()[0].data).toContain('Mail priority: High priority');
    expect(mails()[0].data).toContain('Mail note: Visible note content');
    expect(mails()[0].data).not.toContain('NEVER-MAIL-PRIVATE-STATE');
    db.updateOne('attachments', { _id: id }, { $set: { deletedAt: new Date() } });
    await call(page, 'rules.runButton', rule._id, card._id);
    await expect.poll(() => mails().length).toBe(2);
    expect(mails()[1].data).not.toContain('report.bin');
    db.updateOne('attachments', { _id: id }, { $unset: { deletedAt: '' } });
    db.updateOne('actions', { _id: rule.actionId }, { $set: { includeChecklistsAndComments: false, includeCardDetails: false } });
    await call(page, 'rules.runButton', rule._id, card._id);
    await expect.poll(() => mails().length).toBe(3);
    expect(mails()[2].data).toContain('Requested card content');
    expect(mails()[2].data).not.toContain('Email checklist');
    expect(mails()[2].data).not.toContain('Public email comment');
    expect(mails()[2].data).not.toContain('Mail priority');
    fs.unlinkSync(filename);
    if (backend === 'gridfs') { db.deleteMany('attachments.files', { _id: gridId }); db.deleteMany('attachments.chunks', { files_id: gridId }); }
    const error = await page.evaluate(async ({ ruleId, cardId }) => {
      try { await Meteor.callAsync('rules.runButton', ruleId, cardId); return null; }
      catch (error) { return error.error; }
    }, { ruleId: rule._id, cardId: card._id });
    expect(error).not.toBeNull(); expect(mails()).toHaveLength(3);
  } finally {
    db.deleteOne('customFields', { _id: `${id}-field` });
    db.deleteMany('attachments', { _id: { $in: [id, foreignId] } });
    db.deleteMany('attachments.files', { _id: gridId }); db.deleteMany('attachments.chunks', { files_id: gridId });
    fs.rmSync(filename, { force: true }); await sink.close();
  }
});

}
