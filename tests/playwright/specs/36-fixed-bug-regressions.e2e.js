'use strict';

/**
 * Spec 36 — regression guards for recently fixed bugs.
 *
 *  - #3907 (data-loss): moving a card within the same board must NOT delete its
 *          "added label" activity history. Card.move() always re-sets boardId
 *          (even for a same-board move), and the activities hook used to remove
 *          all addedLabel activities whenever boardId appeared in the update.
 *          Fixed by gating the removal on an actual board change.
 *  - #5886: the chosen card sort (e.g. by due date) is kept only in an in-memory
 *          Session var and was lost on reload. It is now persisted to
 *          localStorage and restored into Session when the board header loads.
 *  - #5892: a collapsed list must shrink to the 30px rail even when it carries a
 *          custom --list-width (the width rework's !important rule used to keep
 *          it full width). Guarded here by asserting the computed CSS.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard, waitForMeteor } = require('../helpers/auth');

// Run a Meteor method / built-in collection write in the page context over DDP
// and return { err, result }. Built-in collection methods ('/cards/update', ...)
// run the server allow/deny rules AND the before/after update hooks, which is
// exactly the path that exercises the #3907 activities hook.
async function ddp(page, name, args) {
  return page.evaluate(
    ({ name, args }) =>
      new Promise(resolve => {
        // eslint-disable-next-line no-undef
        Meteor.apply(name, args, (err, result) =>
          resolve({
            err: err ? { error: err.error, reason: err.reason } : null,
            result,
          }),
        );
      }),
    { name, args },
  );
}

test.describe('Fixed-bug regressions', () => {
  test('#3907 same-board card move keeps the addedLabel activity history', async ({
    loggedInPage,
    board,
  }) => {
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    expect(cardId, 'seeded card should exist').toBeTruthy();

    const labelId = db.uid('label');
    db.updateOne(
      'boards',
      { _id: board.boardId },
      { $push: { labels: { _id: labelId, name: 'Urgent', color: 'red' } } },
    );
    db.updateOne('cards', { _id: cardId }, { $set: { labelIds: [labelId] } });

    // The "label added" activity whose history must survive the move.
    const activityId = db.uid('act');
    db.insertOne('activities', {
      _id: activityId,
      activityType: 'addedLabel',
      cardId,
      labelId,
      boardId: board.boardId,
      createdAt: new Date(),
      modifiedAt: new Date(),
    });

    await openBoard(loggedInPage, board.boardId, board.slug);
    await waitForMeteor(loggedInPage);

    // Move the card to the second list of the SAME board. Card.move() re-sets
    // boardId to the same value, which is the exact trigger for #3907.
    const targetList = board.listIds[1];
    const res = await ddp(loggedInPage, '/cards/update', [
      { _id: cardId },
      { $set: { listId: targetList, boardId: board.boardId, swimlaneId: board.swimlaneId } },
    ]);
    expect(res.err, 'owner same-board move must be allowed').toBeNull();

    // The card moved...
    expect(db.findOne('cards', { _id: cardId }, { listId: 1 }).listId).toBe(targetList);
    // ...and its addedLabel history is still there (the data-loss guard).
    expect(
      db.countDocuments('activities', { _id: activityId }),
      'addedLabel activity must survive a same-board move (#3907)',
    ).toBe(1);
    expect(
      db.countDocuments('activities', { cardId, activityType: 'addedLabel' }),
    ).toBe(1);
  });

  test('#5886 chosen card sort is restored after a page reload', async ({ boardPage }) => {
    // Persisted sort (as written by the cards-sort popup) present, Session empty:
    // mimics the state right after a reload.
    await boardPage.evaluate(() => {
      window.localStorage.setItem('wekan-cards-sortBy', JSON.stringify({ dueAt: 1 }));
      // eslint-disable-next-line no-undef
      Session.set('sortBy', '');
    });

    await boardPage.reload({ waitUntil: 'networkidle' });
    await waitForMeteor(boardPage);

    // The board header onCreated must restore the persisted sort into Session.
    await expect
      .poll(async () =>
        boardPage.evaluate(() => {
          // eslint-disable-next-line no-undef
          const s = Session.get('sortBy');
          return s && s.dueAt ? s.dueAt : null;
        }),
      )
      .toBe(1);
  });

  test('#5892 a collapsed list with a custom width still shrinks to the rail', async ({
    boardPage,
    board,
  }) => {
    const listId = board.listIds[0];
    const list = boardPage.locator(`#js-list-${listId}`).first();
    await expect(list).toBeVisible();

    // Give the list a custom width and collapse it, the way the width feature
    // and the collapse toggle do.
    await boardPage.evaluate((id) => {
      const el = document.getElementById(`js-list-${id}`);
      if (el) {
        el.style.setProperty('--list-width', '420px');
        el.classList.add('list-collapsed');
      }
    }, listId);

    // The collapsed rail must win over the custom --list-width (#5892): ~30px,
    // not the 420px custom width.
    await expect
      .poll(async () =>
        boardPage.evaluate((id) => {
          const el = document.getElementById(`js-list-${id}`);
          return el ? Math.round(el.getBoundingClientRect().width) : null;
        }, listId),
      )
      .toBeLessThanOrEqual(40);
  });
});
