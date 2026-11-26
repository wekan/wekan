'use strict';

// #6943 (comment 7190880990): the minicards of a board were less compact than
// before - empty space at the top of every card, and more space between two
// cards. The top was the keyboard move buttons' line (#459), visually hidden
// but still a line of the card; the space between cards was two margins, the
// wrapper's 8px and the card's own 9px. These measure the board as it is
// drawn, with the collapse caret and the card actions menu shown and hidden,
// on cards with badges and without: badges are inside the card under the
// title and clear of the controls, and a card without badges has no empty
// badge line - its content takes the room.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

function addCards(board) {
  const existing = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const add = (title, sort, extra = {}) => db.insertOne('cards', {
    ...existing, _id: db.uid('card'), title, labelIds: [], sort,
    createdAt: new Date(), modifiedAt: new Date(), dateLastActivity: new Date(), ...extra,
  });
  add('Plain One', existing.sort + 10);
  add('With Badge', existing.sort + 20, { description: 'A description shows its badge on the minicard.' });
  add('Plain Two', existing.sort + 30);
}

// The minicard's geometry, as the browser lays it out.
async function geometry(mini) {
  return mini.locator('.minicard').evaluate(card => {
    const box = el => (el ? el.getBoundingClientRect() : null);
    const style = getComputedStyle(card);
    const visible = el => el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
    return {
      card: box(card),
      padTop: parseFloat(style.paddingTop),
      padBottom: parseFloat(style.paddingBottom),
      padEnd: parseFloat(style.paddingRight),
      title: box(card.querySelector('.minicard-title')),
      caret: box(card.querySelector('.js-collapse-minicard')),
      menu: box(card.querySelector('.js-open-minicard-details-menu')),
      moveGroup: box(card.querySelector('.minicard-move-buttons')),
      badgeStrips: [...card.querySelectorAll('.badges')].filter(visible).map(box),
      badges: [...card.querySelectorAll('.badges .badge')].filter(visible).map(box),
    };
  });
}

const overlaps = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

async function checkLayout(page, board, { controls }) {
  const bp = new BoardPage(page);
  const list = board.listIds[0];
  const titles = ['Alpha Card', 'Plain One', 'With Badge', 'Plain Two'];
  for (const t of titles) await expect(bp.minicard(list, t)).toBeVisible();
  const g = {};
  for (const t of titles) g[t] = await geometry(bp.minicard(list, t));

  for (const t of titles) {
    const { card, padTop, title } = g[t];
    // No line above the title: it starts right under the card's padding.
    expect(title.top - card.top - padTop, `${t}: the title starts at the top`).toBeLessThanOrEqual(3);
    // The move buttons are out of the flow: they add no height.
    expect(g[t].moveGroup ? g[t].moveGroup.height : 0, `${t}: the move buttons take no line`).toBeLessThanOrEqual(1);
  }
  // A card without badges ends under its title: no empty badge line.
  for (const t of ['Plain One', 'Plain Two']) {
    const { card, padBottom, title, badgeStrips } = g[t];
    expect(badgeStrips, `${t}: no badge strip drawn`).toHaveLength(0);
    expect(card.bottom - title.bottom - padBottom, `${t}: nothing under the title`).toBeLessThanOrEqual(6);
  }
  // A card with badges shows them inside the card, under the title, clear of
  // the caret and the menu.
  const withBadge = g['With Badge'];
  expect(withBadge.badges.length, 'the description badge is drawn').toBeGreaterThan(0);
  for (const b of withBadge.badges) {
    expect(b.width).toBeGreaterThan(0);
    expect(b.left).toBeGreaterThanOrEqual(withBadge.card.left - 0.5);
    expect(b.right).toBeLessThanOrEqual(withBadge.card.right + 0.5);
    expect(b.bottom).toBeLessThanOrEqual(withBadge.card.bottom + 0.5);
    expect(b.top).toBeGreaterThanOrEqual(withBadge.title.bottom - 1);
    expect(overlaps(b, withBadge.menu), 'a badge is not under the menu').toBeFalsy();
    expect(overlaps(b, withBadge.caret), 'a badge is not under the caret').toBeFalsy();
  }
  expect(withBadge.card.height, 'the badge line makes that card taller')
    .toBeGreaterThan(g['Plain One'].card.height + 4);
  // One margin between two cards, not the wrapper's 8px on top of the card's 9px.
  const order = [...titles].sort((a, b) => g[a].card.top - g[b].card.top);
  for (let i = 1; i < order.length; i++) {
    const gap = g[order[i]].card.top - g[order[i - 1]].card.bottom;
    expect(gap, `gap above ${order[i]}`).toBeGreaterThanOrEqual(3);
    expect(gap, `gap above ${order[i]}`).toBeLessThanOrEqual(12);
  }
  // The controls are where they were, or gone; the title takes the menu's
  // corner when the menu is hidden, and leaves it when it is shown.
  const plain = g['Plain One'];
  const titleEndRoom = plain.card.right - plain.padEnd - plain.title.right;
  if (controls) {
    expect(plain.caret && plain.menu, 'caret and menu are shown').toBeTruthy();
    expect(plain.caret.top).toBeGreaterThanOrEqual(plain.card.top - 0.5);
    expect(plain.menu.right).toBeLessThanOrEqual(plain.card.right + 0.5);
    expect(titleEndRoom, 'the title keeps room beside the menu').toBeGreaterThanOrEqual(20);
  } else {
    expect(plain.caret || plain.menu, 'caret and menu are hidden').toBeFalsy();
    expect(titleEndRoom, 'the title reaches the corner the menu kept').toBeLessThanOrEqual(1);
  }
}

test('#6943: minicards are compact with the collapse caret and the menu shown', async ({ boardPage: page, board }) => {
  addCards(board);
  await checkLayout(page, board, { controls: true });
  // Negative: out of the flow is not out of reach - the move buttons still
  // show while focused (#6521) and still move the card (#459).
  const bp = new BoardPage(page);
  const down = bp.minicard(board.listIds[0], 'Plain One').locator('.js-card-move-down');
  await down.focus();
  await expect.poll(() => down.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(10);
  const before = db.findOne('cards', { boardId: board.boardId, title: 'Plain One' }).sort;
  await page.keyboard.press('Enter');
  await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Plain One' }).sort).not.toBe(before);
});

test('#6943: minicards are compact with the caret and the menu hidden, and the content widens', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsMinicardCollapse: false, allowsMinicardMenu: false } });
  addCards(board);
  const bp = new BoardPage(page);
  await expect(bp.minicard(board.listIds[0], 'Alpha Card').locator('.js-open-minicard-details-menu')).toHaveCount(0);
  await expect(bp.minicard(board.listIds[0], 'Alpha Card').locator('.js-collapse-minicard')).toHaveCount(0);
  await checkLayout(page, board, { controls: false });
});

// The desktop drag handle sat under the menu, inside the card only because the
// move buttons' line made every card taller: a one-line card must still hold
// it, with the menu shown (under it) and hidden (in its corner).
test('#6943: the desktop drag handle stays inside a compact minicard', async ({ boardPage: page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': true } });
  try {
    await page.reload();
    const bp = new BoardPage(page);
    const mini = bp.minicard(board.listIds[0], 'Alpha Card');
    const inside = () => mini.locator('.minicard').evaluate(card => {
      const c = card.getBoundingClientRect();
      const h = card.querySelector('.handle').getBoundingClientRect();
      return h.height > 0 && h.top >= c.top - 0.5 && h.bottom <= c.bottom + 0.5 && h.right <= c.right + 0.5;
    });
    await expect(mini.locator('.handle')).toBeVisible();
    await expect.poll(inside, 'with the menu').toBe(true);
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsMinicardMenu: false } });
    await expect(mini.locator('.js-open-minicard-details-menu')).toHaveCount(0);
    await expect.poll(inside, 'without the menu').toBe(true);
    // Without the menu the card stays one line high: the handle is in the corner.
    const height = await mini.locator('.minicard').evaluate(card => card.getBoundingClientRect().height);
    expect(height).toBeLessThan(45);
  } finally {
    db.updateOne('users', { _id: user.id }, { $unset: { 'profile.showDesktopDragHandles': '' } });
  }
});
