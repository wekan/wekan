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
test(`email rule form and SMTP carry only live triggering-card bytes from ${backend}`, async ({ boardPage: page, board, user, user2, request }) => {
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
    db.insertOne('attachments', { _id: id, name: 'report.bin', uploadedAt: new Date('2027-01-10'), userId: 'missing-uploader', extension: 'bin', type: 'application/octet-stream', size: bytes.length,
      meta: { boardId: board.boardId, cardId: card._id },
      versions: { original: { storage: backend, meta: backend === 'gridfs' ? { gridFsFileId: gridId.toHexString() } : {}, path: filename, size: bytes.length, extension: 'bin', type: 'application/octet-stream' } } });
    db.insertOne('cards', { _id: `${id}-converted`, boardId: board.boardId, title: 'Converted item target' });
    db.insertOne('checklists', { _id: `${id}-checklist`, cardId: card._id, title: 'Email checklist', sort: 0, dueAt: new Date('2027-06-01'), resetInterval: 'weekly' });
    db.insertOne('checklistItems', { _id: `${id}-item`, cardId: card._id, checklistId: `${id}-checklist`, title: 'Reviewed task', isFinished: true, sort: 0, linkedCardId: `${id}-converted`, dueAt: new Date('2027-05-01') });
    db.insertOne('card_comments', { _id: `${id}-comment`, cardId: card._id, boardId: board.boardId, text: 'Public email comment', userId: 'missing-comment-author', createdAt: new Date(), modifiedAt: new Date(), webhookResponsePending: 'NEVER-MAIL-PRIVATE-STATE' });
    db.insertOne('card_comment_reactions', { _id: `${id}-reaction`, cardId: card._id, boardId: board.boardId,
      cardCommentId: `${id}-comment`, reactions: [{ reactionCodepoint: '&#128077;', userIds: ['PRIVATE-REACTOR', 'second-reactor'] }] });
    db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date('2027-02-01'), spentTime: 0,
      targetId_gantt: [`${id}-converted`], linkType_gantt: [0], linkId_gantt: ['PRIVATE-LINK-ID'],
      cardDependencies: [{ cardId: `${id}-converted`, type: 'blocks' }],
      coverId: id, userId: 'missing-card-author', stickers: [{ name: 'Approved', icon: 'check', position: 0 }],
      vote: { question: 'Release vote', public: false, positive: ['PRIVATE-VOTER'], negative: [] },
      poker: { question: true, end: new Date('2020-01-01'), one: ['MISSING-POKER-VOTER'], estimation: 1 },
      recurrenceInterval: 'weekly', lastRecurrenceAt: new Date('2027-01-01'),
      flowStartAt: new Date('2027-02-01'), flowInterruptions: 2,
      pomodoroStartAt: new Date('2027-02-01'), pomodoroPhase: 'work', pomodoroCount: 3, pomodoroWorkMinutes: 25,
      customFields: [{ _id: `${id}-field`, value: 'high' }] } });
    db.insertOne('customFields', { _id: `${id}-field`, boardIds: [board.boardId], name: 'Mail priority', type: 'dropdown',
      settings: { dropdownItems: [{ _id: 'high', name: 'High priority' }] } });
    db.updateOne('boards', { _id: board.boardId }, { $set: { 'scrum.visibility': {
      cardSprint: true, cardRelease: true, cardAcceptanceCriteria: true, cardBacklogRank: true,
    } } });
    db.insertOne('scrumSprints', { _id: `${id}-sprint`, boardId: board.boardId, name: 'Mail sprint' });
    db.insertOne('scrumReleases', { _id: `${id}-release`, boardId: board.boardId, name: 'Mail release' });
    db.updateOne('cards', { _id: card._id }, { $set: { scrum: { sprintId: `${id}-sprint`, releaseId: `${id}-release`,
      acceptanceCriteria: 'Ready for review', backlogRank: 0, issueType: 'HIDDEN-SCRUM-TYPE' } } });
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
    for (const text of ['Recurrence: weekly', 'Last recurrence: 2027-01-01T00:00:00.000Z',
      'Flowtime started: 2027-02-01T00:00:00.000Z', 'Flowtime interruptions: 2',
      'Pomodoro phase: work', 'Pomodoro completed intervals: 3', 'Pomodoro work interval (minutes): 25']) {
      // Quoted-printable can wrap these fields with a soft line break.
      expect(mails()[0].data.replace(/=\r?\n/g, '')).toContain(text);
    }
    const votingText = mails()[0].data.replace(/=\r?\n/g, '');
    for (const text of ['Vote question: Release vote', 'Votes for: 1', 'Votes against: 0',
      'Poker 1 votes: 1', 'Poker 1 voters: Unknown user', 'Poker estimation: 1']) expect(votingText).toContain(text);
    expect(votingText).not.toContain('For voters');
    expect(votingText).not.toContain('PRIVATE-VOTER');
    expect(votingText).toContain('Reactions: =F0=9F=91=8D 2'); // UTF-8 thumbs-up in quoted-printable SMTP.
    expect(votingText).not.toContain('PRIVATE-REACTOR');
    for (const text of ['File: report.bin', 'Size (bytes): 8', 'Type: application/octet-stream',
      'Cover: true', 'Uploaded: 2027-01-10T00:00:00.000Z', 'Uploaded by: Unknown user']) expect(votingText).toContain(text);
    expect(votingText).not.toContain(filename);
    expect(votingText).toContain('Converted subtask: Converted item target');
    expect(votingText).toContain('blocks / Gantt finish-to-start: Converted item target');
    expect(votingText).not.toContain('PRIVATE-LINK-ID');
    for (const text of ['Scrum sprint: Mail sprint', 'Scrum release: Mail release',
      'Scrum acceptance criteria: Ready for review', 'Scrum backlog rank: 0']) expect(votingText).toContain(text);
    expect(votingText).not.toContain('HIDDEN-SCRUM-TYPE');
    for (const text of ['Created by: Unknown user', 'Sticker: Approved, check, 0',
      'Due: 2027-06-01T00:00:00.000Z', 'Reset interval: weekly', 'Due: 2027-05-01T00:00:00.000Z',
      'Author: Unknown user']) expect(votingText).toContain(text);
    expect(mails()[0].data).not.toContain('NEVER-MAIL-PRIVATE-STATE');
    // Exercise the original #2713 activity trigger through a real card move,
    // independently of the manual button's mail preparation path.
    const destination = db.findOne('lists', { _id: board.listIds.find(listId => listId !== card.listId) });
    const movedRule = await call(page, 'rules.createRule', board.boardId, 'Email moved card', {
      activityType: 'moveCard', listName: destination.title, oldListName: '*',
      swimlaneName: '*', cardTitle: '*', userId: '*',
    }, { ...action, emailTo: 'moved@example.invalid' });
    const movedMails = () => sink.messages.filter(mail => mail.recipients.includes('moved@example.invalid'));
    const move = (from, to, token = user.token) => request.put(
      `/api/boards/${board.boardId}/lists/${from}/cards/${card._id}`,
      { headers: { Authorization: `Bearer ${token}` }, data: { listId: to } },
    );
    const denied = await move(card.listId, destination._id, user2.token);
    expect(denied.ok()).toBe(false);
    expect(db.getCard(card._id).listId).toBe(card.listId);
    expect(movedMails()).toHaveLength(0);
    expect((await move(card.listId, destination._id)).status()).toBe(200);
    await expect.poll(() => movedMails().length).toBe(1);
    expect(db.getCard(card._id).listId).toBe(destination._id);
    expect(db.find('activities', { cardId: card._id, activityType: 'moveCard', listId: destination._id })).toHaveLength(1);
    const movedText = movedMails()[0].data.replace(/=\r?\n/g, '');
    for (const text of ['Requested card content', 'Email checklist', '[x] Reviewed task',
      'Public email comment', 'Mail priority: High priority', 'Mail note: Visible note content',
      'Scrum sprint: Mail sprint', 'blocks / Gantt finish-to-start: Converted item target',
      'File: report.bin', 'Size (bytes): 8', 'filename=report.bin']) {
      expect(movedText).toContain(text);
    }
    // Check the raw MIME part: quoted-printable soft-break removal would also
    // remove a base64 padding '=' at the end of its own line.
    expect(movedMails()[0].data).toContain(bytes.toString('base64'));
    expect(movedText).not.toMatch(/NEVER-MAIL-PRIVATE-STATE|PRIVATE-VOTER|PRIVATE-LINK-ID|foreign-secret/);
    // Moving away from the selected destination must not run this rule.
    expect((await move(destination._id, card.listId)).status()).toBe(200);
    expect(db.getCard(card._id).listId).toBe(card.listId);
    await call(page, 'rules.deleteRule', movedRule._id);
    expect(movedMails()).toHaveLength(1);
    db.updateOne('attachments', { _id: id }, { $set: { deletedAt: new Date() } });
    db.updateOne('cards', { _id: card._id }, { $set: { 'vote.public': true, 'poker.end': new Date('2999-01-01') } });
    await call(page, 'rules.runButton', rule._id, card._id);
    await expect.poll(() => mails().length).toBe(2);
    expect(mails()[1].data).not.toContain('report.bin');
    const reopenedText = mails()[1].data.replace(/=\r?\n/g, '');
    expect(reopenedText).toContain('For voters: Unknown user');
    expect(reopenedText).not.toMatch(/Poker 1 votes|Poker 1 voters/);
    db.updateOne('attachments', { _id: id }, { $unset: { deletedAt: '' } });
    db.updateOne('actions', { _id: rule.actionId }, { $set: { includeChecklistsAndComments: false, includeCardDetails: false } });
    await call(page, 'rules.runButton', rule._id, card._id);
    await expect.poll(() => mails().length).toBe(3);
    expect(mails()[2].data).toContain('Requested card content');
    expect(mails()[2].data).not.toContain('Email checklist');
    expect(mails()[2].data).not.toContain('Public email comment');
    expect(mails()[2].data).not.toContain('Mail priority');
    expect(mails()[2].data).not.toMatch(/Flowtime|Pomodoro|Recurrence|Vote question|Poker|Scrum|Sticker|Created by|Author:|Reset interval|Reactions:|Gantt finish-to-start/);
    db.updateOne('actions', { _id: rule.actionId }, { $set: { includeChecklistsAndComments: true } });
    await call(page, 'rules.runButton', rule._id, card._id);
    await expect.poll(() => mails().length).toBe(4);
    const discussionOnly = mails()[3].data.replace(/=\r?\n/g, '');
    expect(discussionOnly).toContain('Converted subtask: Converted item target');
    expect(discussionOnly).not.toContain('Mail priority');
    db.updateOne('actions', { _id: rule.actionId }, { $set: { includeAttachments: false } });
    await call(page, 'rules.runButton', rule._id, card._id);
    await expect.poll(() => mails().length).toBe(5);
    expect(mails()[4].data).not.toMatch(/File: report.bin|Cover: true|Uploaded by:|filename=report.bin/);
    db.updateOne('actions', { _id: rule.actionId }, { $set: { includeAttachments: true } });
    fs.unlinkSync(filename);
    if (backend === 'gridfs') { db.deleteMany('attachments.files', { _id: gridId }); db.deleteMany('attachments.chunks', { files_id: gridId }); }
    const error = await page.evaluate(async ({ ruleId, cardId }) => {
      try { await Meteor.callAsync('rules.runButton', ruleId, cardId); return null; }
      catch (error) { return error.error; }
    }, { ruleId: rule._id, cardId: card._id });
    expect(error).not.toBeNull(); expect(mails()).toHaveLength(5);
  } finally {
    db.deleteOne('cards', { _id: `${id}-converted` });
    db.deleteOne('card_comment_reactions', { _id: `${id}-reaction` });
    db.deleteOne('scrumSprints', { _id: `${id}-sprint` });
    db.deleteOne('scrumReleases', { _id: `${id}-release` });
    db.deleteOne('customFields', { _id: `${id}-field` });
    db.deleteMany('attachments', { _id: { $in: [id, foreignId] } });
    db.deleteMany('attachments.files', { _id: gridId }); db.deleteMany('attachments.chunks', { files_id: gridId });
    fs.rmSync(filename, { force: true }); await sink.close();
  }
});

}
