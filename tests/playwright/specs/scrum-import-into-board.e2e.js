'use strict';
// A board export's Scrum planning imported INTO an existing board from the
// Scrum view (scrum.importIntoBoard, server/lib/scrumTransferMerge.js): the
// preview writes nothing, the import links matched cards and creates the
// sprint and release once, a second import changes nothing, an unmatched card
// is reported, and a board member who is not an administrator is refused.
// Needs WITH_API=true for the board export.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return await Meteor.callAsync(method, ...args); }
  catch (error) { throw new Error(`${error.error}: ${error.reason || error.message}`); }
}, { method, args });

for (const language of ['mg', 'ht', 'la', 'st', 'sw', 'en', 'mt']) {
test(`Scrum planning imports into an existing board once, matching its cards in ${language}`, async ({ page, browser, request, user, board }) => {
  const destination = db.seedBoard({ ownerId: user.id, title: 'Scrum import destination',
    cardTitlesPerList: [['Alpha Card'], ['Beta Card'], ['Not the same card']] });
  const member = db.seedUser();
  try {
    await loginWithToken(page, user.id, user.token);
    await call(page, 'setLanguage', language);
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    const sprint = await call(page, 'scrum.saveSprint', board.boardId, null,
      { name: 'Imported sprint', plannedStart: '2026-10-01', plannedEnd: '2026-10-14' }, null);
    const release = await call(page, 'scrum.saveRelease', board.boardId, null, { name: 'Imported release' }, null);
    const sourceCards = db.find('cards', { boardId: board.boardId });
    const byTitle = title => sourceCards.find(card => card.title === title);
    await call(page, 'scrum.updateCard', board.boardId, byTitle('Alpha Card')._id,
      { sprintId: sprint._id, releaseId: release._id, acceptanceCriteria: 'Imported criterion' }, 0);
    await call(page, 'scrum.updateCard', board.boardId, byTitle('Beta Card')._id, { issueType: 'Bug' }, 0);
    await call(page, 'scrum.updateCard', board.boardId, byTitle('Gamma Card')._id, { sprintId: sprint._id }, 0);
    const response = await request.get(`/api/boards/${board.boardId}/export?authToken=${encodeURIComponent(user.token)}`);
    expect(response.status()).toBe(200);
    const exported = await response.json();
    expect(exported.scrumTransfer.format).toBe('wekan-scrum-2');

    // Not an administrator of the destination: refused, nothing written.
    db.addBoardMember({ boardId: destination.boardId, userId: member.id });
    const context = await browser.newContext();
    try {
      const other = await context.newPage();
      await loginWithToken(other, member.id, member.token);
      await expect(call(other, 'scrum.importIntoBoard', destination.boardId, exported, {})).rejects.toThrow(/not-authorized/);
    } finally { await context.close(); }
    expect(db.find('scrumSprints', { boardId: destination.boardId })).toHaveLength(0);

    await openBoard(page, destination.boardId, destination.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-sprints-view').click();
    const panel = page.locator('details.scrum-transfer-import');
    await panel.locator('summary').click();
    if (language === 'ht') {
      await expect(panel).toContainText('Gade apèsi a anvan');
      await expect(panel).not.toContainText('aperçu');
    }
    await panel.locator('.js-scrum-transfer-file').setInputFiles({ name: 'board.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exported)) });
    await panel.locator('.js-scrum-transfer-preview').click();
    await expect(panel.locator('.scrum-transfer-preview')).toContainText(strings['scrum-import-preview-sprints'].replace('__created__', '1').replace('__matched__', '0').replace('__skipped__', '0'));
    await expect(panel.locator('.scrum-transfer-preview')).toContainText(strings['scrum-import-preview-cards'].replace('__updated__', '2').replace('__unchanged__', '0').replace('__unmatched__', '1'));
    await expect(panel.locator('.scrum-transfer-loss')).toContainText(byTitle('Gamma Card')._id);
    expect(db.find('scrumSprints', { boardId: destination.boardId })).toHaveLength(0);

    await panel.locator('.js-scrum-transfer-apply').click();
    await expect(panel.locator('.js-scrum-transfer-done')).toBeVisible();
    const created = db.findOne('scrumSprints', { boardId: destination.boardId });
    expect(created.name).toBe('Imported sprint');
    expect(created.provenance).toEqual({ system: 'wekan', projectId: board.boardId, recordId: sprint._id });
    const createdRelease = db.findOne('scrumReleases', { boardId: destination.boardId });
    const alpha = db.findOne('cards', { boardId: destination.boardId, title: 'Alpha Card' });
    expect(alpha.scrum.sprintId).toBe(created._id);
    expect(alpha.scrum.releaseIds).toEqual([createdRelease._id]);
    expect(alpha.scrum.acceptanceCriteria).toBe('Imported criterion');
    expect(db.findOne('cards', { boardId: destination.boardId, title: 'Beta Card' }).scrum.issueType).toBe('Bug');
    expect(db.findOne('cards', { boardId: destination.boardId, title: 'Not the same card' }).scrum).toBeUndefined();
    expect(db.find('scrumImportPending', { _id: destination.boardId })).toHaveLength(0);
    // The source board is untouched.
    expect(db.find('scrumSprints', { boardId: board.boardId })).toHaveLength(1);

    // The same file again: nothing to change.
    await panel.locator('.js-scrum-transfer-preview').click();
    await expect(panel.locator('.js-scrum-transfer-nothing')).toHaveText(strings['scrum-import-preview-nothing']);
    await expect(panel.locator('.js-scrum-transfer-apply')).toHaveCount(0);
    expect(db.find('scrumSprints', { boardId: destination.boardId })).toHaveLength(1);
    expect(db.find('scrumReleases', { boardId: destination.boardId })).toHaveLength(1);
  } finally {
    for (const collection of ['scrumSprints', 'scrumReleases', 'scrumEvents', 'scrumDailySnapshots', 'changeHistory']) {
      db.deleteMany(collection, { boardId: { $in: [board.boardId, destination.boardId] } });
    }
    db.cleanup({ boardIds: [destination.boardId], userIds: [member.id] });
  }
});
}
