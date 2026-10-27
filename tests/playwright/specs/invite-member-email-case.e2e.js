'use strict';
// #6788: adding a colleague to a board failed when the email was typed in a
// different case than the directory stores it ("Jan.Jansen@Example.com"), and
// the member search could hide the colleague behind five other matches and
// offered disabled accounts. Drives the two server methods the Members dialog
// calls, as the logged-in board member.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { smtpSink } = require('../helpers/smtpSink');
// The same escape-string-regexp the server matches addresses with. Escaping
// only "." left a backslash in the address free to cancel it (CodeQL alert 590).
const escapeModule = require('escape-string-regexp');
const escapeRegExp = escapeModule.default || escapeModule;

const call = (page, name, ...args) =>
  page.evaluate(async ({ name, args }) => {
    try { return { ok: await Meteor.callAsync(name, ...args) }; }
    catch (error) { return { error: `${error.error}: ${error.reason || error.message}` }; }
  }, { name, args });
const isMember = (boardId, userId) =>
  (db.findOne('boards', { _id: boardId }).members || []).some(m => m.userId === userId && m.isActive);

test('an existing colleague is invited by email in any letter case', async ({ boardPage: page, board, user2 }) => {
  const stored = user2.email.replace(/^e2e_/, 'E2E_').replace('@wekan-test.invalid', '@WeKan-Test.INVALID');
  db.updateOne('users', { _id: user2.id }, { $set: { 'emails.0.address': stored } });
  // The invitation is mailed, and a mail that cannot be sent is reported to
  // the inviter as email-fail - deliberately, so they know the colleague was
  // not told. The test app sends to the local capture port (build.sh
  // MAIL_URL=smtp://127.0.0.1:$WEKAN_TEST_SMTP_PORT), so listen on it: with
  // nothing there the call answered "email-fail: connect ECONNREFUSED".
  const sink = process.env.WEKAN_TEST_SMTP_PORT ? await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT)) : null;
  let result;
  try {
    result = await call(page, 'inviteUserToBoard', stored.toLowerCase(), board.boardId);
  } finally { if (sink) await sink.close(); }
  expect(result.error).toBeUndefined();
  expect(isMember(board.boardId, user2.id)).toBe(true);
  // The invitation went to the address as the directory stores it.
  if (sink) expect(sink.messages.some(mail => mail.recipients.includes(stored.toLowerCase()))).toBe(true);
  // negative: no second account was created for the same address
  expect(db.countDocuments('users', { 'emails.address': { $regex: `^${escapeRegExp(stored)}$`, $options: 'i' } })).toBe(1);
});

test('negative: a similar but different address is not taken for the colleague', async ({ boardPage: page, board, user2 }) => {
  const other = `x${user2.email}`;
  await call(page, 'inviteUserToBoard', other, board.boardId);
  expect(isMember(board.boardId, user2.id)).toBe(false);
});

test('search offers no disabled account, and finds a colleague behind five others', async ({ boardPage: page, board, user2 }) => {
  const tag = `zz${Date.now()}`;
  const disabled = [];
  for (let i = 0; i < 6; i += 1) {
    const { id } = db.seedUser();
    db.updateOne('users', { _id: id }, { $set: { username: `${tag}_off${i}`, loginDisabled: true } });
    disabled.push(id);
  }
  db.updateOne('users', { _id: user2.id }, { $set: { username: `${tag}_colleague` } });
  const result = await call(page, 'searchUsers', tag, board.boardId);
  expect(result.error).toBeUndefined();
  const names = result.ok.map(u => u.username);
  expect(names).toContain(`${tag}_colleague`);
  expect(names.some(n => n.includes('_off'))).toBe(false);
  expect(names.length).toBeLessThanOrEqual(5);
  db.deleteMany('users', { _id: { $in: disabled } });
});
