'use strict';

// UploadBleed and StampBleed, against the running server: an upload onto a
// card of a board one is not a member of is refused by the upload pipeline
// itself (it never asked the allow rules), and a checklist stamped with
// another board's id is refused - both recorded in Admin Panel / Problems.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return { value: await Meteor.callAsync(method, ...args) }; }
  catch (error) { return { error: String(error.error || ''), reason: error.reason || error.message }; }
}, { method, args });
const startUpload = (page, meta, fileId) => call(page, '_FilesCollectionStart_attachments', {
  file: { name: 'x.txt', type: 'text/plain', size: 4, meta }, fileId, chunkSize: 4, fileLength: 1,
});

// A signed-in account that attempts a vulnerability is blocked
// (server/lib/blockOnSecurityEvent.js): loginDisabled, and its session ends. So
// each test does the legitimate thing FIRST and the attempt last - run the
// other way round, the legitimate call ran signed out and failed for that
// reason, not for the guard's - and then checks that the attempt blocked it.
const blockedFor = userId => db.findOne('users', { _id: userId })?.services?.securityBlock;

test('UploadBleed: an upload onto another board\'s card is refused by the upload pipeline', async ({ boardPage: page, board, user }) => {
  const other = db.seedBoard({ ownerId: db.uid('owner'), cardTitlesPerList: [['Private card']] });
  const otherCard = db.findOne('cards', { boardId: other.boardId });
  db.deleteMany('eventlog', { bleed: 'UploadBleed' });

  // Negative first: one's own card starts an upload.
  const own = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const ok = await startUpload(page, { cardId: own._id, boardId: board.boardId }, db.uid('f').slice(0, 17));
  expect(ok.error).toBeUndefined();

  // The attempt: refused, nothing stored, recorded - and the account blocked.
  const refused = await startUpload(page, { cardId: otherCard._id, boardId: other.boardId }, db.uid('f').slice(0, 17));
  expect(refused.error).toBe('403');
  expect(db.countDocuments('attachments', { 'meta.cardId': otherCard._id })).toBe(0);
  await expect.poll(() => db.countDocuments('eventlog', { bleed: 'UploadBleed' })).toBeGreaterThan(0);
  await expect.poll(() => blockedFor(user.id)?.bleed).toBe('UploadBleed');
});

test('StampBleed: an upload or a checklist on one\'s own card stamped with another board is refused', async ({ boardPage: page, board, user }) => {
  const other = db.seedBoard({ ownerId: db.uid('owner'), cardTitlesPerList: [['Private card']] });
  const own = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.deleteMany('eventlog', { bleed: 'StampBleed' });

  // Negative first: a checklist without a foreign stamp is fine, on the card's board.
  const id = db.uid('cl').slice(0, 17);
  const fine = await call(page, '/checklists/insert', { _id: id, cardId: own._id, title: 'Mine', sort: 0 });
  expect(fine.error).toBeUndefined();
  await expect.poll(() => db.findOne('checklists', { _id: id })?.boardId).toBe(board.boardId);

  // A stamped checklist: refused and recorded. Its refusal names no account, so
  // the user is still signed in for the upload below.
  const checklist = await call(page, '/checklists/insert', { _id: db.uid('cl').slice(0, 17), cardId: own._id, boardId: other.boardId, title: 'Stamped', sort: 0 });
  expect(checklist.error).toBeTruthy();
  expect(db.countDocuments('checklists', { boardId: other.boardId })).toBe(0);
  await expect.poll(() => db.countDocuments('eventlog', { bleed: 'StampBleed' })).toBeGreaterThan(0);

  // A stamped upload: refused, and as a signed-in attempt it blocks the account.
  const upload = await startUpload(page, { cardId: own._id, boardId: other.boardId }, db.uid('f').slice(0, 17));
  expect(upload.error).toBe('403');
  await expect.poll(() => blockedFor(user.id)?.bleed).toBe('StampBleed');
});
