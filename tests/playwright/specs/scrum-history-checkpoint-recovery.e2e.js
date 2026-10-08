'use strict';
// A Scrum History undo that stopped on a conflict blocks the board's Scrum
// edits; the History recovery notice lets a board administrator roll it back
// or keep the board as it is (server/lib/scrumHistoryRecovery.js), and tells an
// ordinary member who can. docs/Features/Right-Sidebar/Board-Settings/Board-View/Scrum-History-Recovery.md
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const en = require('../../../imports/i18n/data/en.i18n.json');

const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return await Meteor.callAsync(method, ...args); } catch (e) { throw new Error(`${e.error}: ${e.reason || e.message}`); }
}, { method, args });
function dates(value) {
  if (typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return new Date(value);
  if (Array.isArray(value)) return value.map(dates);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, dates(v)]));
  return value;
}
function clean(boardId) {
  for (const collection of ['scrumSprints', 'scrumHistoryCompletions', 'scrumHistoryRequests']) db.deleteMany(collection, { boardId });
  db.deleteOne('scrumHistoryPending', { _id: boardId });
  db.deleteMany('recoveryEvents', { boardIds: boardId });
}
// The user's Scrum edit of a card, and an undo of it that stopped: its
// checkpoint, as server/lib/scrumHistory.js saves it, with the failure its
// retries keep meeting. `state` is what happened to the card since.
async function stoppedUndo(page, user, board, state) {
  const card = db.find('cards', { boardId: board.boardId })[0];
  await call(page, 'scrum.updateCard', board.boardId, card._id, { issueType: 'Story' }, 0);
  const row = db.findOne('changeHistory', { boardId: board.boardId, entityType: 'scrum' });
  const revision = db.findOne('cards', { _id: card._id }).scrumRevision;
  if (state === 'applied') db.updateOne('cards', { _id: card._id }, { $set: { scrum: {}, scrumRevision: revision + 1 } });
  if (state === 'conflict') db.updateOne('cards', { _id: card._id }, { $set: { scrum: { issueType: 'Bug' }, scrumRevision: revision + 5 } });
  db.insertOne('scrumHistoryPending', dates({ _id: board.boardId, rowId: row._id, direction: 'undo', userId: user.id,
    operationId: `op-${board.boardId}`, content: row.previousContent, before: row.newContent, revisions: [revision],
    worker: 'gone', lastFailure: { error: 'scrum-conflict', at: new Date().toISOString() } }));
  return { card, revision, row, key: `op-${board.boardId}` };
}

test('a board admin rolls back a stopped Scrum undo from the recovery notice', async ({ page, user, board }) => {
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const { card, revision, row } = await stoppedUndo(page, user, board, 'applied');
    // Blocked, as before.
    await expect(call(page, 'scrum.configure', board.boardId, { productGoal: 'Must wait' })).rejects.toThrow(/scrum-history-pending/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const notice = page.locator('.js-history-checkpoint-notice');
    await expect(notice).toBeVisible();
    await expect(notice.locator('p').first()).toHaveText(en['scrum-history-checkpoint-stuck']);
    await expect(notice.locator('.js-history-checkpoint-counts')).toContainText('1 of 1');
    await notice.locator('.js-history-checkpoint-rollback').click();
    await expect(notice).toHaveCount(0);
    expect(db.findOne('scrumHistoryPending', { _id: board.boardId })).toBeNull();
    const saved = db.findOne('cards', { _id: card._id });
    expect(saved.scrum).toEqual(row.newContent.records[0].document.scrum);
    expect(saved.scrum.issueType).toBe('Story');
    expect(saved.scrumRevision).toBe(revision);
    const event = db.findOne('recoveryEvents', { type: 'scrum-history-checkpoint-resolved', boardIds: board.boardId });
    expect(event.done).toBe(true);
    expect(event.detail).toContain('rolled back 1 of 1 records');
    // The board's Scrum edits work again, and a repeat is a no-op.
    await call(page, 'scrum.configure', board.boardId, { productGoal: 'Works again' });
    expect((await call(page, 'scrum.resolveHistoryCheckpoint', board.boardId, `op-${board.boardId}`, 'rollback')).changed).toBe(false);
  } finally { clean(board.boardId); }
});

test('a record changed by someone else leaves only "keep the board as it is"', async ({ page, user, board }) => {
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const { card } = await stoppedUndo(page, user, board, 'conflict');
    await page.reload({ waitUntil: 'domcontentloaded' });
    const notice = page.locator('.js-history-checkpoint-notice');
    await expect(notice).toBeVisible();
    await expect(notice.locator('.js-history-checkpoint-rollback')).toHaveCount(0);
    await expect(call(page, 'scrum.resolveHistoryCheckpoint', board.boardId, `op-${board.boardId}`, 'rollback'))
      .rejects.toThrow(/scrum-history-recovery/);
    // Declining the confirmation changes nothing.
    page.once('dialog', dialog => dialog.dismiss());
    await notice.locator('.js-history-checkpoint-discard').click();
    expect(db.findOne('scrumHistoryPending', { _id: board.boardId })).not.toBeNull();
    page.once('dialog', dialog => dialog.accept());
    await notice.locator('.js-history-checkpoint-discard').click();
    await expect(notice).toHaveCount(0);
    expect(db.findOne('scrumHistoryPending', { _id: board.boardId })).toBeNull();
    expect(db.findOne('cards', { _id: card._id }).scrum).toEqual({ issueType: 'Bug' });
  } finally { clean(board.boardId); }
});

test('an ordinary member sees the board is blocked but cannot resolve it', async ({ page, user, user2, board }) => {
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const { key } = await stoppedUndo(page, user, board, 'applied');
    await loginWithToken(page, user2.id, user2.token);
    await openBoard(page, board.boardId, board.slug);
    const notice = page.locator('.js-history-checkpoint-notice');
    await expect(notice).toBeVisible();
    await expect(notice.locator('p.quiet')).toHaveText(en['scrum-history-checkpoint-ask-admin']);
    await expect(notice.locator('button')).toHaveCount(0);
    for (const action of ['rollback', 'discard']) {
      await expect(call(page, 'scrum.resolveHistoryCheckpoint', board.boardId, key, action)).rejects.toThrow(/not-authorized/);
    }
    const inspected = await call(page, 'scrum.inspectHistoryCheckpoint', board.boardId);
    expect(inspected.canResolve).toBe(false);
    expect(inspected.targets).toBeUndefined();
    expect(db.findOne('scrumHistoryPending', { _id: board.boardId })).not.toBeNull();
  } finally { clean(board.boardId); }
});
