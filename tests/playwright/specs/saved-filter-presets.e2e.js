'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard, loginWithToken } = require('../helpers/auth');
async function openFilter(page) {
  // The board header can still be re-rendering (the language was just set),
  // and a click on the old toggle opens nothing (WebKit under a full run).
  // Click until the filter is really open.
  const field = page.locator('.js-field-card-filter');
  for (let attempt = 0; attempt < 3 && !(await field.isVisible()); attempt++) {
    if (!(await page.locator('.js-filter-preset-name').isVisible())) await page.locator('.js-open-filter-view').click();
    await field.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }
}
const method = (page, name, ...args) => page.evaluate(async ({ name, args }) => {
  try { return { value: await Meteor.callAsync(name, ...args) }; }
  catch (error) { return { error: error.error }; }
}, { name, args });

for (const language of ['en', 'ku', 'ckb', 'tt', 'so', 'ny', 'mi', 'sm', 'tk_TM', 'yi', 'bho', 'mai', 'or_IN', 'kok', 'pap', 'ary', 'st', 'tn', 'nso', 'zu', 'zu-ZA', 'xh', 'ss', 'nd', 'ts', 've', 'bi', 'tpi', 'fj', 'to', 'haw', 'om', 'rw', 'rn', 'lg', 'wa', 'wa-RR', 'ace', 'gv', 'se', 've-CC', 'rup', 'ak', 'bm', 'ee', 'wo', 'ff', 'ks', 'bua', 'cv', 'sah', 'bo', 'dz', 'ti', 'qu', 'ay', 'gn', 've-PP', 'vo', 'tlh', 'nah', 'wal', 'zgh', 'kl', 'chr', 'iu', 'tig']) {
const locale = require(`../../../imports/i18n/data/${language}.i18n.json`);
test(`save, reload, apply, replace and delete a private board filter combination (${language})`, async ({ loggedInPage: page, board, user }) => {
  expect((await method(page, 'setLanguage', language)).error).toBeUndefined();
  const cards = db.find('cards', { boardId: board.boardId });
  const due = await page.evaluate(() => { const now = new Date(); return +new Date(now.getFullYear(), now.getMonth() + 1, 2, 12); });
  db.updateOne('cards', { _id: cards[0]._id }, { $set: { dueAt: new Date(due) } });
  await openBoard(page, board.boardId, board.slug); await openFilter(page);
  await expect(page.locator('.js-field-card-filter')).toHaveAttribute('aria-label', locale['filter-card-text-label']);
  await expect(page.locator('.js-save-filter-preset')).toContainText(locale['filter-preset-replace-hint']);
  await expect(page.locator('.js-save-filter-preset [type="submit"]')).toHaveText(locale['filter-preset-save']);
  await page.locator('.js-field-card-filter').fill('Alpha');
  await page.locator('.js-toggle-due-next-month-filter').click();
  await page.locator('.js-filter-preset-name').fill('My upcoming cards');
  await page.locator('.js-save-filter-preset [type="submit"]').click();
  await expect(page.locator('.js-filter-preset-message')).toHaveText(locale['filter-preset-saved']);
  const stored = db.findOne('savedCardFilters', { boardId: board.boardId, ownerId: user.id });
  expect(stored.state.texts.text).toBe('Alpha'); expect(stored.state.due).toBe('nextmonth');
  await page.reload(); await openBoard(page, board.boardId, board.slug); await openFilter(page);
  await expect(page.locator('.js-field-card-filter')).toHaveValue('');
  await page.locator('.js-filter-preset-select').selectOption(stored._id);
  await page.locator('.js-apply-filter-preset').click();
  await expect(page.locator('.js-filter-preset-message')).toHaveText(locale['filter-preset-applied']);
  await expect(page.locator('.js-field-card-filter')).toHaveValue('Alpha');
  await expect.poll(() => page.locator('.board-canvas .js-minicard').evaluateAll(rows => rows.map(row => row.dataset.cardId))).toEqual([cards[0]._id]);
  await page.locator('.js-due-unrestricted').check();
  await page.locator('.js-field-card-filter').fill('Beta');
  await page.locator('.js-save-filter-preset [type="submit"]').click();
  await expect(page.locator('.js-filter-preset-message')).toHaveText(locale['filter-preset-saved']);
  const replaced = db.find('savedCardFilters', { boardId: board.boardId, ownerId: user.id });
  expect(replaced).toHaveLength(1); expect(replaced[0]._id).toBe(stored._id); expect(replaced[0].state.texts.text).toBe('Beta');
  expect(replaced[0].state.due).toBeNull();
  await page.locator('.js-filter-preset-select').selectOption(stored._id);
  await page.locator('.js-remove-filter-preset').click();
  await expect(page.locator('.js-filter-preset-message')).toHaveText(locale['filter-preset-deleted']);
  expect(db.find('savedCardFilters', { boardId: board.boardId, ownerId: user.id })).toEqual([]);
  await expect(page.locator(`.js-filter-preset-select option[value="${stored._id}"]`)).toHaveCount(0);
});

}

test('preset storage and publication enforce owner, board access and state validation', async ({ loggedInPage: page, board, user, user2 }) => {
  test.setTimeout(150000);
  await openBoard(page, board.boardId, board.slug); await openFilter(page);
  await page.locator('.js-filter-preset-name').fill('Private choice');
  await page.locator('.js-save-filter-preset [type="submit"]').click();
  await expect(page.locator('.js-filter-preset-message')).toHaveText('Filters saved.');
  const owned = db.findOne('savedCardFilters', { boardId: board.boardId, ownerId: user.id });
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  await loginWithToken(page, user2.id, user2.token); await openBoard(page, board.boardId, board.slug); await openFilter(page);
  await expect(page.locator('.js-filter-preset-select')).not.toContainText('Private choice');
  expect((await method(page, 'filterPresets.remove', board.boardId, owned._id)).error).toBe('preset-not-found');
  expect((await method(page, 'filterPresets.save', board.boardId, 'Invalid', { ...owned.state, version: 99 })).error).toBe('invalid-filter-preset');
  const direct = await method(page, '/savedCardFilters/update', { _id: owned._id }, { $set: { name: 'Stolen' } });
  expect(direct.error).toBeTruthy();
  expect(db.findOne('savedCardFilters', { _id: owned._id }).name).toBe('Private choice');
  const own = await method(page, 'filterPresets.save', board.boardId, 'Private choice', owned.state);
  expect(own.value).not.toBe(owned._id);
  await expect.poll(() => page.evaluate(() => Meteor.connection._stores.savedCardFilters?._getCollection().find().fetch().map(row => row._id) || [])).toEqual([own.value]);
  // Corrupt stored input must not reset the current filters when applying it.
  db.updateOne('savedCardFilters', { _id: own.value }, { $set: { 'state.version': 99 } });
  await expect.poll(() => page.evaluate(id => Meteor.connection._stores.savedCardFilters._getCollection().findOne(id)?.state.version, own.value)).toBe(99);
  await page.locator('.js-field-card-filter').fill('Alpha');
  await page.locator('.js-filter-preset-select').selectOption(own.value); await page.locator('.js-apply-filter-preset').click();
  await expect(page.locator('.js-filter-preset-message')).toContainText('Could not');
  await expect(page.locator('.js-field-card-filter')).toHaveValue('Alpha');
  const boardDoc = db.findOne('boards', { _id: board.boardId });
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: boardDoc.members.filter(member => member.userId !== user2.id) } });
  await expect.poll(() => page.evaluate(() => Meteor.connection._stores.savedCardFilters?._getCollection().find().count() || 0)).toBe(0);
  expect((await method(page, 'filterPresets.save', board.boardId, 'Denied', owned.state)).error).toBe('not-authorized');
});


for (const language of ['en', 'ku', 'ckb', 'tt', 'so', 'ny', 'mi', 'sm', 'tk_TM', 'yi', 'bho', 'mai', 'or_IN', 'kok', 'pap', 'ary', 'st', 'tn', 'nso', 'zu', 'zu-ZA', 'xh', 'ss', 'nd', 'ts', 've', 'bi', 'tpi', 'fj', 'to', 'haw', 'om', 'rw', 'rn', 'lg', 'wa', 'wa-RR', 'ace', 'gv', 'se', 've-CC', 'rup', 'ak', 'bm', 'ee', 'wo', 'ff', 'ks', 'bua', 'cv', 'sah', 'bo', 'dz', 'ti', 'qu', 'ay', 'gn', 've-PP', 'vo', 'tlh', 'nah', 'wal', 'zgh', 'kl', 'chr', 'iu', 'tig']) {
const locale = require(`../../../imports/i18n/data/${language}.i18n.json`);
test(`invalid advanced expressions cannot replace the active filter selection (${language})`, async ({ loggedInPage: page, board, user }) => {
  expect((await method(page, 'setLanguage', language)).error).toBeUndefined();
  await openBoard(page, board.boardId, board.slug); await openFilter(page);
  await page.locator('.js-field-card-filter').fill('Alpha');
  await page.locator('.js-filter-preset-name').fill('Valid');
  await page.locator('.js-save-filter-preset [type="submit"]').click();
  await expect(page.locator('.js-filter-preset-message')).toHaveText(locale['filter-preset-saved']);
  const stored = db.findOne('savedCardFilters', { boardId: board.boardId, ownerId: user.id });
  const invalid = { ...stored.state, texts: { ...stored.state.texts, text: 'Beta', advanced: "@unknown = '2026-01-01'" } };
  const saved = await method(page, 'filterPresets.save', board.boardId, 'Invalid expression', invalid);
  await page.locator('.js-filter-preset-select').selectOption(saved.value);
  await page.locator('.js-apply-filter-preset').click();
  await expect(page.locator('.js-filter-preset-message')).toHaveText(locale['filter-preset-error']);
  await expect(page.locator('.js-field-card-filter')).toHaveValue('Alpha');
  await expect(page.locator('.js-field-advanced-filter')).toHaveValue('');
  await page.locator('.js-field-advanced-filter').fill(invalid.texts.advanced);
  await page.locator('.js-field-advanced-filter').blur();
  await page.locator('.js-filter-preset-name').fill('Do not save');
  await page.locator('.js-save-filter-preset [type="submit"]').click();
  await expect(page.locator('.js-filter-preset-message')).toHaveText(locale['filter-preset-error']);
  expect(db.find('savedCardFilters', { boardId: board.boardId, name: 'Do not save' })).toEqual([]);
});
}
