'use strict';
// #5681: linked custom fields. From a card's Custom Fields menu, "Link fields
// to another card" finds another card of the board by its title (or takes a
// pasted card link), links it in the chosen direction, lists the fields that
// match by name, and unlinks it. A changed value then reaches the other card;
// a card the user cannot read is refused as not found.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

for (const language of ['en', 'haw', 'lt', 'yi', 'wuu-Hans', 'xh', 'zu', 'zu-ZA', 'pap', 'eo', 'fi', 'sv', 'nb', 'da', 'it']) {
test(`a card's custom fields are linked, carry a change, and are unlinked in ${language} (#5681)`, async ({ boardPage: page, board }) => {
  await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
  const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
  const card = db.findOne('cards', { boardId: board.boardId });
  const mainId = db.uid('card');
  const operation = db.uid('cf'), status = db.uid('cf'), remarks = db.uid('cf'), approved = db.uid('cf');
  db.insertOne('customFields', { _id: operation, boardIds: [board.boardId], name: 'Operation', type: 'text',
    settings: {}, showOnCard: true });
  db.insertOne('customFields', { _id: remarks, boardIds: [board.boardId], name: 'Remarks', type: 'text',
    settings: {}, showOnCard: true });
  db.insertOne('customFields', { _id: status, boardIds: [board.boardId], name: 'Status', type: 'text',
    settings: {}, showOnCard: true });
  db.insertOne('customFields', { _id: approved, boardIds: [board.boardId], name: 'Approved', type: 'checkbox',
    settings: {}, showOnCard: true });
  db.updateOne('cards', { _id: card._id }, { $set: { customFields: [
    { _id: operation, value: null }, { _id: status, value: null }, { _id: approved, value: false }] } });
  db.insertOne('cards', { ...card, _id: mainId, title: 'Main Processing Card', sort: 900, customFieldLinks: [],
    customFields: [{ _id: operation, value: null }, { _id: status, value: null }, { _id: approved, value: false },
      { _id: remarks, value: 'Keep me' }] });
  const hidden = db.seedBoard({ ownerId: db.uid('user'), title: 'Somebody else', cardTitlesPerList: [['Secret card']] });
  const hiddenCard = db.findOne('cards', { boardId: hidden.boardId });
  try {
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.minicard', { hasText: card.title }).first().locator('.minicard-title').click();
    await page.locator('.card-details .js-open-custom-fields-settings').click();
    await page.locator('.js-pop-over .js-open-custom-field-links').click();
    const pop = page.locator('.js-pop-over');
    await expect(pop.locator('.js-custom-field-links-empty')).toHaveText(strings['custom-field-links-none']);
    await expect(pop.locator('.js-custom-field-link-mode option[value="both"]')).toHaveText(strings['custom-field-link-both']);
    await expect(pop.locator('.js-custom-field-link-mode option[value="send"]')).toHaveText(strings['custom-field-link-send']);

    // Negative: a card the user cannot read is refused, and nothing is linked.
    await pop.locator('.js-custom-field-link-input')
      .fill(`${new URL(page.url()).origin}/b/${hidden.boardId}/x/${hiddenCard._id}`);
    await pop.locator('.js-link-custom-fields-submit').click();
    await expect(pop.locator('.js-custom-field-link-error')).toHaveText(strings['field-link-not-found']);
    expect(db.findOne('cards', { _id: card._id }).customFieldLinks || []).toEqual([]);

    // One way, to the main card, picked by its title.
    await pop.locator('.js-custom-field-link-input').fill('Main Proc');
    await pop.locator('.js-custom-field-link-match', { hasText: 'Main Processing Card' }).click();
    await pop.locator('.js-custom-field-link-mode').selectOption('send');
    await pop.locator('.js-link-custom-fields-submit').click();
    const row = pop.locator('.custom-field-link', { hasText: 'Main Processing Card' });
    await expect(row).toBeVisible();
    await expect(row.locator('.custom-field-link-fields')).toContainText('Operation');
    await expect(row.locator('.custom-field-link-fields')).toContainText('Status');
    await expect(row.locator('.custom-field-link-fields')).not.toContainText('Remarks');
    await expect.poll(() => (db.findOne('cards', { _id: mainId }).customFieldLinks || []).map(l => l.mode))
      .toEqual(['receive']);

    // A value set on this card reaches the main card; Remarks is untouched.
    await page.evaluate(([cardId, fieldId]) => Meteor.callAsync('setCardCustomFieldCheckbox', cardId, fieldId, true),
      [card._id, approved]);
    await expect.poll(() => db.findOne('cards', { _id: mainId }).customFields.find(f => f._id === approved).value)
      .toBe(true);
    expect(db.findOne('cards', { _id: mainId }).customFields.find(f => f._id === remarks).value).toBe('Keep me');

    // Unlinked from both cards.
    await row.locator('.js-unlink-custom-fields').click();
    await expect(pop.locator('.custom-field-link', { hasText: 'Main Processing Card' })).toHaveCount(0);
    await expect.poll(() => (db.findOne('cards', { _id: mainId }).customFieldLinks || []).length).toBe(0);
    expect(db.findOne('cards', { _id: card._id }).customFieldLinks || []).toEqual([]);
  } finally {
    db.deleteMany('cards', { _id: mainId });
    db.deleteMany('customFields', { _id: { $in: [operation, status, remarks, approved] } });
    db.cleanup({ boardIds: [hidden.boardId] });
  }
});

}
