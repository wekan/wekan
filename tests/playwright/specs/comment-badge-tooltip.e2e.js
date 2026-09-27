'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const english = require('../../../imports/i18n/data/en.i18n.json');
const { openBoard, loginWithToken } = require('../helpers/auth');

for (const readOnly of [false, true]) test(`#1933: comment tooltips for ${readOnly ? 'read-only members' : 'admins'} are plain text and respect publication scope`, async ({ page, board, user, user2 }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  const alpha = cards.find(c => c.title === 'Alpha Card');
  const beta = cards.find(c => c.title === 'Beta Card');
  const gamma = cards.find(c => c.title === 'Gamma Card');
  const text = 'First line\n"quoted" <img src=x onerror="window.tooltipInjected=true"> & **Markdown**';
  const foreign = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private card']] });
  const comments = [
    { cardId: alpha._id, text },
    { cardId: beta._id, text: 'First comment' },
    { cardId: beta._id, text: 'Second comment' },
  ].map(c => ({ ...c, _id: db.uid('comment'), boardId: board.boardId, userId: user.id, createdAt: new Date(), modifiedAt: new Date() }));
  const secret = { ...comments[0], _id: db.uid('secret'), boardId: foreign.boardId, cardId: db.find('cards', { boardId: foreign.boardId })[0]._id, text: 'Private comment must stay private' };
  db.insertMany('card_comments', [...comments, secret]);
  if (readOnly) db.updateOne('boards', { _id: board.boardId }, { $set: { members: db.getBoard(board.boardId).members.map(m => m.userId === user.id ? { ...m, isAdmin: false, isReadOnly: true } : m) } });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const badge = id => page.locator(`.js-minicard[data-card-id="${id}"] .badge`).filter({ has: page.locator('.badge-comment') });
    await expect(badge(alpha._id)).toHaveAttribute('title', text);
    await expect(badge(alpha._id)).toHaveText('1');
    await expect(badge(beta._id)).toHaveAttribute('title', english['card-comments-title'].replace('%s', '2'));
    await expect(badge(beta._id)).toHaveText('2');
    await expect(badge(gamma._id)).toHaveCount(0);
    await expect(badge(alpha._id).locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => window.tooltipInjected)).toBeUndefined();
    expect(await page.evaluate(id => Meteor.connection._stores.card_comments._getCollection().findOne(id), secret._id)).toBeUndefined();
    await expect(page.locator('[title="Private comment must stay private"]')).toHaveCount(0);
  } finally {
    db.deleteMany('card_comments', { _id: { $in: [...comments, secret].map(c => c._id) } });
    db.cleanup({ boardIds: [foreign.boardId] });
  }
});
