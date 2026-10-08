'use strict';

// Email report (2026-10-08, Swedish): "Man ser inte hela kommentaren på
// minikortet ... så lägger sig den typ bakom de som är tilldelade kortet." -
// with Board Settings / Card / Comments "Show on Minicard" on, a card with
// seven assignees showed its comment as "Någr…" on the same line as the row
// of avatars, which covered the rest.
//
// The avatar row is `float: inline-end` and each .minicard-comment was
// `overflow: hidden; white-space: nowrap` - a block formatting context the
// float narrowed to a few characters. The comments now clear the floats and
// wrap (client/components/cards/minicard.css). This reproduces the screenshot:
// one comment, seven assignees, and asserts the comment is below every avatar,
// not beside it, and that its words are visible rather than cut to four
// characters. tests/minicardCommentsOnMinicard.test.cjs pins the CSS.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

const COMMENT = 'Några i arbetsgruppen har påbörjat detta arbetssätt.';

test.describe('Minicard comment preview beside many assignees', () => {
  test('the comment has its own full-width line, not covered by the avatars', async ({
    loggedInPage: page,
    user,
    board,
  }) => {
    const others = Array.from({ length: 6 }, () => db.seedUser());
    try {
      const assignees = [user.id, ...others.map(u => u.id)];
      const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
      for (const u of others) db.addBoardMember({ boardId: board.boardId, userId: u.id });
      db.updateOne('boards', { _id: board.boardId }, {
        $set: {
          allowsCommentsOnMinicard: true,
          allowsAssignee: true,
          allowsAssigneeOnMinicard: true,
        },
      });
      db.updateOne('cards', { _id: card._id }, { $set: { assignees } });
      db.insertOne('card_comments', {
        _id: db.uid('cmt'),
        boardId: board.boardId,
        cardId: card._id,
        userId: user.id,
        text: COMMENT,
        createdAt: new Date(),
        modifiedAt: new Date(),
      });

      await openBoard(page, board.boardId, board.slug);
      const minicard = page.locator('.js-minicard').filter({ hasText: 'Alpha Card' }).first();
      await expect(minicard).toBeVisible();

      const avatars = minicard.locator('.minicard-assignees .member');
      await expect(avatars).toHaveCount(7);
      const comment = minicard.locator('.minicard-comment-text').first();
      await expect(comment).toBeVisible();
      await expect(comment).toHaveText(COMMENT);

      const c = await comment.boundingBox();
      expect(c).not.toBeNull();
      // Not squeezed to a few characters: wider than the old "Någr…".
      expect(c.width).toBeGreaterThan(120);

      // Negative: no avatar box intersects the comment's box.
      for (const box of await avatars.evaluateAll(els =>
        els.map(el => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }))) {
        const intersects =
          box.x < c.x + c.width && c.x < box.x + box.width &&
          box.y < c.y + c.height && c.y < box.y + box.height;
        expect(intersects, `avatar ${JSON.stringify(box)} overlaps comment ${JSON.stringify(c)}`)
          .toBe(false);
      }

      // The words are rendered, not clipped: this comment wraps to at most
      // two lines at the minicard's width, inside the three-line clamp, so
      // nothing overflows its box and no ellipsis is needed.
      const clipped = await comment.evaluate(el =>
        el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
      expect(clipped).toBe(false);
      expect(await comment.evaluate(el => getComputedStyle(el).whiteSpace)).toBe('normal');
    } finally {
      db.cleanup({ userIds: others.map(u => u.id) });
    }
  });
});
