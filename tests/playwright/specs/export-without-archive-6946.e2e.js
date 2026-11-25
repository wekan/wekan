'use strict';
// #6946: "JSON without archived items" leaves the board's archive behind -
// archived cards, lists and swimlanes, the live cards on an archived list, and
// the archived cards' attachments - and the ordinary export still has them all.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

test('?archived=false exports the board without its archive', async ({ request, user, board }) => {
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const beta = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const gamma = db.findOne('cards', { boardId: board.boardId, title: 'Gamma Card' });
  db.updateOne('cards', { _id: beta._id }, { $set: { archived: true } });
  // Gamma stays live, but its list is archived.
  db.updateOne('lists', { _id: gamma.listId }, { $set: { archived: true } });
  const lane = db.uid('swim');
  db.insertOne('swimlanes', { _id: lane, title: 'Old lane', boardId: board.boardId, archived: true, sort: 9, type: 'swimlane' });
  const att = db.uid('att');
  db.insertOne('attachments', { _id: att, name: 'old.txt', type: 'text/plain', size: 1,
    meta: { boardId: board.boardId, cardId: beta._id }, versions: {} });

  const get = async q => {
    const res = await request.get(`/api/boards/${board.boardId}/export?authToken=${encodeURIComponent(user.token)}&attachments=false${q}`);
    expect(res.status()).toBe(200);
    return res.json();
  };
  const live = await get('&archived=false');
  expect(live.cards.map(c => c._id)).toEqual([alpha._id]);
  expect(live.lists.map(l => l._id)).not.toContain(gamma.listId);
  expect(live.lists.map(l => l._id)).toContain(alpha.listId);
  expect(live.swimlanes.map(s => s._id)).not.toContain(lane);
  expect(live.attachments.map(a => a._id)).not.toContain(att);

  // Negative: the ordinary export is still the whole board, archive and all.
  const full = await get('');
  expect(full.cards.map(c => c._id).sort()).toEqual([alpha._id, beta._id, gamma._id].sort());
  expect(full.lists.map(l => l._id)).toContain(gamma.listId);
  expect(full.swimlanes.map(s => s._id)).toContain(lane);
  expect(full.attachments.map(a => a._id)).toContain(att);
  db.deleteOne('attachments', { _id: att });
});

test('the export popup offers JSON without archived items', async ({ boardPage: page }) => {
  await new BoardPage(page).openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-export-board').click();
  const link = page.locator('.js-pop-over a[href*="archived=false"]');
  await expect(link).toHaveCount(1);
  await expect(link).toContainText('without archived items');
  // Negative: the other JSON entries do not leave the archive out.
  await expect(page.locator('.js-pop-over a[href*="/export?"]:not([href*="archived=false"])').first()).toBeVisible();
});
