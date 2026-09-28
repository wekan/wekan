'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { smtpSink } = require('../helpers/smtpSink');
const fs = require('node:fs');
const path = require('node:path');
const call = (page, method, ...args) => page.evaluate(({ method, args }) => Meteor.callAsync(method, ...args), { method, args });
test('linked-card mail uses current authorized source content and stops after source access is revoked', async ({ loggedInPage: page, user }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT || !process.env.WEKAN_FILES_PATH, 'requires local SMTP and file storage');
  const local = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Mail link']] });
  const source = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Live source card']] });
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  const id = db.uid('linkedmail'), bytes = Buffer.from('current source attachment');
  const filename = path.join(process.env.WEKAN_FILES_PATH, 'attachments', `${id}.txt`);
  fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, bytes);
  try {
    const target = db.findOne('cards', { boardId: source.boardId });
    const wrapper = db.findOne('cards', { boardId: local.boardId });
    db.updateOne('cards', { _id: target._id }, { $set: { description: 'Current source description', archived: false, dueAt: new Date('2027-04-01'), parentId: `${id}-parent` } });
    db.updateOne('boards', { _id: local.boardId }, { $set: { 'scrum.visibility.cardBacklogRank': true } });
    db.updateOne('cards', { _id: wrapper._id }, { $set: { type: 'cardType-linkedCard', linkedId: target._id, description: 'STALE-WRAPPER-DESCRIPTION',
      archived: true, archivedAt: new Date('2027-02-01'), recurrenceInterval: 'weekly', lastRecurrenceAt: new Date('2027-01-01'), flowInterruptions: 7, pomodoroPhase: 'break', scrum: { backlogRank: 42 }, stickers: [{ name: 'STALE-WRAPPER-STICKER' }] } });
    db.insertOne('cards', { _id: `${id}-parent`, boardId: source.boardId, type: 'cardType-linkedCard',
      title: 'STALE-PARENT-TITLE', linkedId: `${id}-parent-source` });
    db.insertOne('cards', { _id: `${id}-parent-source`, boardId: local.boardId, title: 'Current related parent' });
    db.insertOne('card_text_notes', { _id: `${id}-note`, boardId: source.boardId, cardId: target._id, title: 'Source note', text: 'Current source note', createdAt: new Date() });
    db.insertOne('card_comments', { _id: `${id}-comment`, boardId: source.boardId, cardId: target._id, text: 'Current source comment', createdAt: new Date(), modifiedAt: new Date() });
    db.insertOne('attachments', { _id: id, name: 'source.txt', size: bytes.length, extension: 'txt', type: 'text/plain',
      meta: { boardId: source.boardId, cardId: target._id },
      versions: { original: { storage: 'fs', path: filename, size: bytes.length, extension: 'txt', type: 'text/plain' } } });
    const rule = await call(page, 'rules.createRule', local.boardId, 'Mail linked source',
      { activityType: 'button', buttonType: 'card', buttonLabel: 'Mail' },
      { actionType: 'sendEmail', emailTo: 'linked-source@example.invalid', emailSubject: 'Linked source', emailMsg: '{description}',
        includeCardDetails: true, includeChecklistsAndComments: true, includeAttachments: true });
    await call(page, 'rules.runButton', rule._id, wrapper._id);
    const mails = () => sink.messages.filter(mail => mail.recipients.includes('linked-source@example.invalid'));
    await expect.poll(() => mails().length).toBe(1);
    for (const text of ['Live source card', 'Current source description', 'Current source note', 'Current source comment', 'Due: 2027-04-01', bytes.toString('base64')]) expect(mails()[0].data).toContain(text);
    const wrapperText = mails()[0].data.replace(/=\r?\n/g, '').split('Linked card local details:')[1];
    expect(wrapperText).toBeTruthy();
    expect(wrapperText).toContain('Archived: true');
    expect(wrapperText).toContain('Archived at: 2027-02-01T00:00:00.000Z');
    expect(mails()[0].data.replace(/=\r?\n/g, '').split('Linked card local details:')[0]).toContain('Archived: false');
    for (const text of ['Recurrence: weekly', 'Last recurrence: 2027-01-01T00:00:00.000Z', 'Flowtime interruptions: 7', 'Pomodoro phase: break', 'Scrum backlog rank: 42']) expect(wrapperText).toContain(text);
    expect(mails()[0].data).not.toContain('STALE-WRAPPER');
    expect(mails()[0].data.replace(/=\r?\n/g, '')).toContain('Parent: Current related parent');
    expect(mails()[0].data).not.toContain('STALE-PARENT');
    const members = db.findOne('boards', { _id: source.boardId }).members;
    db.updateOne('boards', { _id: source.boardId }, { $set: { members: [] } });
    const denied = await page.evaluate(async ({ ruleId, cardId }) => {
      try { await Meteor.callAsync('rules.runButton', ruleId, cardId); return false; } catch (_) { return true; }
    }, { ruleId: rule._id, cardId: wrapper._id });
    expect(denied).toBe(true); expect(mails()).toHaveLength(1);
    db.updateOne('boards', { _id: source.boardId }, { $set: { members, title: 'Live source board', description: 'Current board description', dueAt: new Date('2027-05-01'),
      archived: false, dueComplete: true, isOvertime: true, spentTime: 3,
      vote: { question: 'Current board vote', public: true, positive: ['missing-voter'], negative: [] },
      poker: { question: true, end: new Date('2020-01-01'), two: ['missing-voter'], estimation: 2 } } });
    db.insertOne('customFields', { _id: `${id}-local-field`, boardIds: [local.boardId], name: 'Local priority', type: 'text' });
    db.updateOne('cards', { _id: wrapper._id }, { $set: { type: 'cardType-linkedBoard', linkedId: source.boardId,
      stickers: [{ name: 'Local board sticker' }], locations: [{ name: 'Local office' }],
      customFields: [{ _id: `${id}-local-field`, value: 'Local value' }], parentId: `${id}-parent-source` } });
    await call(page, 'rules.runButton', rule._id, wrapper._id);
    await expect.poll(() => mails().length).toBe(2);
    expect(mails()[1].data).toContain('Live source board');
    expect(mails()[1].data).toContain('Current board description');
    expect(mails()[1].data).toContain('Due: 2027-05-01');
    expect(mails()[1].data).not.toContain('STALE-WRAPPER');
    expect(mails()[1].data).toContain('Current source comment');
    expect(mails()[1].data).toContain('Linked board discussion:');
    expect(mails()[1].data).not.toContain(bytes.toString('base64'));
    const boardMail = mails()[1].data.replace(/=\r?\n/g, '');
    expect(boardMail).toContain('Linked card local details:');
    expect(boardMail).toContain('Scrum backlog rank: 42');
    expect(boardMail).toContain('Recurrence: weekly');
    for (const text of ['Local priority: Local value', 'Sticker: Local board sticker',
      'Location: Local office', 'Parent: Current related parent']) expect(boardMail).toContain(text);
    for (const text of ['Archived: false', 'Due complete: true', 'Overtime: true', 'Spent time (hours): 3',
      'Members: E2E Test User', 'Assignees: E2E Test User']) expect(boardMail).toContain(text);
    for (const text of ['Vote question: Current board vote', 'Votes for: 1', 'For voters: Unknown user',
      'Poker 2 votes: 1', 'Poker 2 voters: Unknown user']) expect(boardMail).toContain(text);
    db.updateOne('boards', { _id: source.boardId }, { $set: { 'vote.public': false, 'poker.end': new Date('2999-01-01') } });
    await call(page, 'rules.runButton', rule._id, wrapper._id);
    await expect.poll(() => mails().length).toBe(3);
    const privateMail = mails()[2].data.replace(/=\r?\n/g, '');
    expect(privateMail).toContain('Votes for: 1');
    expect(privateMail).not.toMatch(/For voters|Poker 2 votes|Poker 2 voters/);
    // Board read access does not grant access to every card's discussion.
    db.updateOne('boards', { _id: source.boardId }, { $set: { members: [
      { userId: user.id, isActive: true, isReadAssignedOnly: true },
    ] } });
    db.updateOne('cards', { _id: target._id }, { $set: { assignees: [user.id] } });
    db.insertOne('cards', { _id: `${id}-hidden`, boardId: source.boardId, title: 'UNASSIGNED-CARD-TITLE', assignees: [] });
    db.insertOne('card_comments', { _id: `${id}-hidden-comment`, boardId: source.boardId,
      cardId: `${id}-hidden`, text: 'UNASSIGNED-CARD-COMMENT', createdAt: new Date() });
    await call(page, 'rules.runButton', rule._id, wrapper._id);
    await expect.poll(() => mails().length).toBe(4);
    expect(mails()[3].data).toContain('Current source comment');
    expect(mails()[3].data).not.toMatch(/UNASSIGNED-CARD-TITLE|UNASSIGNED-CARD-COMMENT/);
    db.updateOne('cards', { _id: target._id }, { $set: { assignees: [] } });
    await call(page, 'rules.runButton', rule._id, wrapper._id);
    await expect.poll(() => mails().length).toBe(5);
    expect(mails()[4].data).not.toMatch(/Current source comment|UNASSIGNED-CARD-COMMENT|Linked board discussion:/);
    db.updateOne('actions', { _id: rule.actionId }, { $set: { includeChecklistsAndComments: false } });
    db.updateOne('cards', { _id: target._id }, { $set: { assignees: [user.id] } });
    await call(page, 'rules.runButton', rule._id, wrapper._id);
    await expect.poll(() => mails().length).toBe(6);
    expect(mails()[5].data).not.toMatch(/Current source comment|Linked board discussion:/);



  } finally {
    db.deleteOne('customFields', { _id: `${id}-local-field` });
    db.deleteOne('attachments', { _id: id }); db.cleanup({ boardIds: [local.boardId, source.boardId] });
    fs.rmSync(filename, { force: true }); await sink.close();
  }
});
