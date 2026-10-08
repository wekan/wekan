'use strict';
// A board import that stopped before finishing is listed in Admin Panel ->
// Problems -> Recovery, where an administrator keeps its partial board or
// discards exactly what it created (server/lib/importRuns.js,
// docs/Features/ImportExport/Import-Run-Recovery.md). Non-administrators are
// refused, another board is never touched, a second discard is a no-op, and a
// finished import is never listed.
const { randomUUID } = require('node:crypto');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

// A partial board, stamped by its run, and the run as the scan leaves it.
function seedInterrupted(ownerId, { state = 'interrupted' } = {}) {
  const partial = db.seedBoard({ ownerId, title: `Partial import ${db.uniqueSuffix()}`,
    cardTitlesPerList: [['Imported one', 'Imported two'], ['Imported three']] });
  const runId = randomUUID();
  db.updateOne('boards', { _id: partial.boardId }, { $set: { importRunId: runId } });
  const at = new Date(Date.now() - 60 * 60 * 1000);
  db.insertOne('importRuns', { _id: runId, version: 1, state, userId: ownerId, source: 'trello',
    boardId: partial.boardId, startedAt: at, touchedAt: at, stage: 'createCards',
    ...(state === 'interrupted' ? { interruptedAt: new Date(), interruptedFrom: 'running' } : { finishedAt: at }) });
  return { ...partial, runId };
}
function cleanup(seeded) {
  for (const { runId, boardId } of seeded) {
    db.deleteMany('importRuns', { _id: runId });
    db.deleteMany('recoveryEvents', { detail: { $regex: runId } });
    db.cleanup({ boardIds: [boardId] });
  }
}

test('only administrators can list, keep or discard interrupted imports', async ({ page, user }) => {
  const seeded = seedInterrupted(user.id);
  try {
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(async runId => Promise.all([
      Meteor.callAsync('importRunsInterrupted').then(() => 'accepted', error => error.error),
      Meteor.callAsync('importRunDiscard', { runId }).then(() => 'accepted', error => error.error),
      Meteor.callAsync('importRunKeep', { runId }).then(() => 'accepted', error => error.error),
    ]), seeded.runId);
    expect(denied).toEqual(['not-authorized', 'not-authorized', 'not-authorized']);
    expect(db.findOne('importRuns', { _id: seeded.runId }).state).toBe('interrupted');
    expect(db.findOne('boards', { _id: seeded.boardId })).not.toBeNull();
    expect(db.countDocuments('cards', { boardId: seeded.boardId })).toBe(3);
  } finally { cleanup([seeded]); }
});

test('administrator discards an interrupted import in Recovery, once, and nothing else', async ({ page, adminUser, board }) => {
  const seeded = seedInterrupted(adminUser.id);
  const otherCards = db.countDocuments('cards', { boardId: board.boardId });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.interrupted-imports');
    await expect(panel.getByRole('heading', { name: 'Board imports that stopped before finishing' })).toBeVisible();
    const row = panel.locator(`tr[data-run="${seeded.runId}"]`);
    await expect(row).toContainText('Imported from trello');
    await expect(row).toContainText('Stopped without finishing, at createCards');
    await expect(row).toContainText('1 swimlanes, 3 lists, 3 cards');
    await expect(row.locator('.js-interrupted-import-discard')).toBeEnabled();
    page.once('dialog', dialog => dialog.accept());
    await row.locator('.js-interrupted-import-discard').click();
    await expect(row).toHaveCount(0);
    expect(db.findOne('boards', { _id: seeded.boardId })).toBeNull();
    for (const name of ['cards', 'lists', 'swimlanes']) expect(db.countDocuments(name, { boardId: seeded.boardId })).toBe(0);
    expect(db.findOne('importRuns', { _id: seeded.runId })).toMatchObject({ state: 'discarded', decision: 'discard' });
    // Another board, even one of the same people, is untouched.
    expect(db.findOne('boards', { _id: board.boardId })).not.toBeNull();
    expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(otherCards);
    // Discarding again changes nothing and records nothing more.
    const again = await page.evaluate(runId => Meteor.callAsync('importRunDiscard', { runId }), seeded.runId);
    expect(again.status).toBe('already-discarded');
    expect(db.countDocuments('recoveryEvents', { type: 'import-discarded', detail: { $regex: seeded.runId } })).toBe(1);
  } finally { cleanup([seeded]); }
});

test('administrator keeps an interrupted import as it is', async ({ page, adminUser }) => {
  const seeded = seedInterrupted(adminUser.id);
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const row = page.locator(`.interrupted-imports tr[data-run="${seeded.runId}"]`);
    await expect(row.locator('.js-interrupted-import-keep')).toBeEnabled();
    page.once('dialog', dialog => dialog.accept());
    await row.locator('.js-interrupted-import-keep').click();
    await expect(row).toHaveCount(0);
    expect(db.findOne('importRuns', { _id: seeded.runId })).toMatchObject({ state: 'kept', decision: 'keep' });
    expect(db.countDocuments('cards', { boardId: seeded.boardId })).toBe(3);
    expect(db.countDocuments('recoveryEvents', { type: 'import-kept', detail: { $regex: seeded.runId } })).toBe(1);
    // A kept import is not discarded afterwards.
    const refused = await page.evaluate(runId => Meteor.callAsync('importRunDiscard', { runId })
      .then(() => 'accepted', error => error.error), seeded.runId);
    expect(refused).toBe('import-run-not-interrupted');
    expect(db.findOne('boards', { _id: seeded.boardId })).not.toBeNull();
  } finally { cleanup([seeded]); }
});

test('a finished import is recorded with its board, never listed and never discarded', async ({ page, adminUser }) => {
  const seeded = seedInterrupted(adminUser.id, { state: 'finished' });
  const ids = [];
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    // A real import: its run names the board it created, and the board names the run.
    const source = { board: { name: `Run record ${db.uniqueSuffix()}` },
      issues: [{ key: 'RUN-1', fields: { summary: 'Recorded card', status: { name: 'Todo' } } }] };
    const boardId = await page.evaluate(value => Meteor.callAsync('importBoard', value, {}, 'jira'), source);
    ids.push(boardId);
    const run = db.findOne('importRuns', { boardId });
    expect(run).toMatchObject({ state: 'finished', source: 'jira', userId: adminUser.id });
    expect(db.findOne('boards', { _id: boardId }).importRunId).toBe(run._id);
    const listed = await page.evaluate(() => Meteor.callAsync('importRunsInterrupted'));
    expect(listed.rows.map(row => row.runId)).not.toContain(seeded.runId);
    expect(listed.rows.map(row => row.runId)).not.toContain(run._id);
    const refused = await page.evaluate(runId => Meteor.callAsync('importRunDiscard', { runId })
      .then(() => 'accepted', error => error.error), run._id);
    expect(refused).toBe('import-run-not-interrupted');
    expect(db.countDocuments('cards', { boardId })).toBe(1);
    db.deleteMany('importRuns', { _id: run._id });
  } finally {
    cleanup([seeded]);
    for (const id of ids) db.cleanup({ boardIds: [id] });
  }
});
