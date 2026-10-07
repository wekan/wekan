'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

for (const language of ['en', 'ku', 'ckb', 'tt', 'so', 'ny', 'mi', 'sm', 'tk_TM', 'yi', 'bho', 'mai', 'or_IN', 'kok', 'pap', 'ary', 'st', 'tn', 'nso', 'zu', 'zu-ZA', 'xh', 'ss', 'nd', 'ts', 've', 'bi', 'tpi', 'fj', 'to', 'haw', 'om', 'rw', 'rn', 'lg', 'wa', 'wa-RR', 'ace', 'gv', 'se', 've-CC', 'rup', 'ak', 'bm', 'ee', 'wo', 'ff', 'ks', 'bua', 'cv', 'sah', 'bo', 'dz', 'ti', 'qu', 'ay', 'gn', 've-PP', 'vo', 'tlh', 'nah', 'wal', 'zgh', 'kl', 'chr', 'iu', 'tig']) {
  const locale = require(`../../../imports/i18n/data/${language}.i18n.json`);
  test(`String Template help preserves literal examples and is hidden for other field types (${language})`, async ({ loggedInPage: page, board }) => {
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-minicard .minicard-title').first().click();
    await page.locator('.js-open-custom-fields-settings').click();
    await page.locator('.js-open-create-custom-field').click();
    await page.locator('.js-field-type').selectOption('stringtemplate');
    const hint = page.locator('.js-field-settings-stringtemplate p.quiet');
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText(locale['custom-field-stringtemplate-context-hint']);
    await page.locator('.js-field-type').selectOption('text');
    await expect(hint).toBeHidden();
  });
}

function seedField(board, format, values) {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFieldsOnMinicard: true } });
  const card = db.find('cards', { boardId: board.boardId })[0];
  const id = db.uid('stringTemplate');
  db.insertOne('customFields', {
    _id: id, boardIds: [board.boardId], name: 'Context template', type: 'stringtemplate',
    settings: { stringtemplateFormat: format, stringtemplateSeparator: ' / ' },
    showOnCard: true, showLabelOnMiniCard: true, automaticallyOnCard: false,
    alwaysOnCard: false, showSumAtTopOfList: false, createdAt: new Date(), modifiedAt: new Date(),
  });
  db.updateOne('cards', { _id: card._id }, { $push: { customFields: { _id: id, value: values } } });
  return { card, id };
}

test('String Template context updates on minicards and open details after titles, location and format change', async ({ loggedInPage: page, board }) => {
  const { card, id } = seedField(board,
    'C=%{card.title}; B=%{board.title}; L=%{list.title}; S={%swimlane.title}; V=%{value}', ['x']);
  try {
    await openBoard(page, board.boardId, board.slug);
    const mini = page.locator(`.js-minicard[data-card-id="${card._id}"]`);
    await expect(mini).toContainText(`C=${card.title};`);
    await mini.click();
    const detail = page.locator('.js-card-details .card-details-item-customfield').filter({ hasText: 'Context template' });
    const expected = (title, listId) => `C=${title}; B=${db.findOne('boards', { _id: board.boardId }).title}; L=${db.findOne('lists', { _id: listId }).title}; S=${db.findOne('swimlanes', { _id: card.swimlaneId }).title}; V=x`;
    await expect(detail).toContainText(expected(card.title, card.listId));
    db.updateOne('cards', { _id: card._id }, { $set: { title: 'Renamed & card', listId: board.listIds[1] } });
    db.updateOne('swimlanes', { _id: card.swimlaneId }, { $set: { title: 'Renamed lane' } });
    for (const view of [mini, detail]) await expect(view).toContainText(expected('Renamed & card', board.listIds[1]));
    db.updateOne('customFields', { _id: id }, { $set: { 'settings.stringtemplateFormat': 'NEW=%{card.title|urlencode}:%{value}' } });
    for (const view of [mini, detail]) await expect(view).toContainText('NEW=Renamed%20%26%20card:x');
  } finally { db.deleteMany('customFields', { _id: id }); }
});

test('String Template URLs encode parameters, retain regex formatting and leave unknown fields visible', async ({ loggedInPage: page, board }) => {
  const { card, id } = seedField(board,
    '[Print](https://example.org/?v=%{value|urlencode}&c=%{card.title|urlencode}) REGEX=${"regex":"a{2}","replace":"X"} UNKNOWN=%{card.secret}', ['aa & ö']);
  try {
    await openBoard(page, board.boardId, board.slug);
    const mini = page.locator(`.js-minicard[data-card-id="${card._id}"]`);
    await expect(mini).toContainText('REGEX=X & ö UNKNOWN=%{card.secret}');
    await mini.locator('.minicard-title').click();
    const detail = page.locator('.js-card-details .card-details-item-customfield').filter({ hasText: 'Context template' });
    for (const view of [mini, detail]) {
      await expect(view.getByRole('link', { name: 'Print', exact: true })).toHaveAttribute('href',
        `https://example.org/?v=aa%20%26%20%C3%B6&c=${encodeURIComponent(card.title)}`);
      await expect(view).toContainText('REGEX=X & ö UNKNOWN=%{card.secret}');
    }
    db.updateOne('customFields', { _id: id }, { $set: { 'settings.stringtemplateFormat': '${"regex":"[","replace":"x"} %{card.title}' } });
    // The Markdown viewer applies typographic quotes to ordinary prose.
    for (const view of [mini, detail]) {
      await expect.poll(async () => (await view.innerText()).replace(/[“”]/g, '"'))
        .toContain('${"regex":"[","replace":"x"}');
    }
  } finally { db.deleteMany('customFields', { _id: id }); }
});


test('linked String Templates use the source card context rather than the viewing board', async ({ loggedInPage: page, board, user, user2 }) => {
  const hidden = db.seedBoard({ ownerId: user2.id, title: 'Private template board', listCount: 1, cardTitlesPerList: [['Secret title']] });
  const hiddenCard = db.find('cards', { boardId: hidden.boardId })[0];
  const source = db.seedBoard({ ownerId: user.id, title: 'Source template board', listCount: 1, cardTitlesPerList: [['Source title']] });
  const { card, id } = seedField(source, '%{card.title} / %{board.title} / %{list.title} / %{swimlane.title}', ['x']);
  const linkedId = db.uid('linkedTemplate');
  const targetCard = db.find('cards', { boardId: board.boardId })[0];
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFieldsOnMinicard: true } });
  db.insertOne('cards', { ...card, _id: linkedId, linkedId: card._id, type: 'cardType-linkedCard',
    title: 'Stale copied title', boardId: board.boardId, listId: targetCard.listId, swimlaneId: targetCard.swimlaneId });
  try {
    await openBoard(page, board.boardId, board.slug);
    const mini = page.locator(`.js-minicard[data-card-id="${linkedId}"]`);
    const expected = `Source title / Source template board / ${db.findOne('lists', { _id: card.listId }).title} / ${db.findOne('swimlanes', { _id: card.swimlaneId }).title}`;
    await expect(mini).toContainText(expected);
    await mini.locator('.minicard-title').click();
    const detail = page.locator('.js-card-details .card-details-item-customfield').filter({ hasText: 'Context template' });
    await expect(detail).toContainText(expected);
    db.updateOne('cards', { _id: card._id }, { $set: { title: 'Changed source title' } });
    for (const view of [mini, detail]) await expect(view).toContainText(expected.replace('Source title', 'Changed source title'));
    // A forged source placement must not publish private-board titles.
    db.updateOne('cards', { _id: card._id }, { $set: { listId: hiddenCard.listId, swimlaneId: hiddenCard.swimlaneId } });
    for (const view of [mini, detail]) await expect(view).toContainText('%{list.title} / %{swimlane.title}');
    expect(await page.evaluate(card => ({
      list: !!Meteor.connection._stores.lists?._getCollection?.().findOne(card.listId),
      swimlane: !!Meteor.connection._stores.swimlanes?._getCollection?.().findOne(card.swimlaneId),
    }), hiddenCard)).toEqual({ list: false, swimlane: false });
  } finally {
    db.deleteMany('customFields', { _id: id });
    db.cleanup({ boardIds: [source.boardId, hidden.boardId] });
  }
});
