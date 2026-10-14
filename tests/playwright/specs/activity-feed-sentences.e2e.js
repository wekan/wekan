'use strict';
// The all-boards activity feed (#2026) said "checked __checklistItem__ of
// checklist __checklist__", "from list __oldList__ at swimlane __oldSwimlane__"
// and "removedChecklistItem": it filled only the card, list and board. Now
// every name the sentence has is filled, a name it cannot know is left out,
// and every kind of activity has a sentence.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');

test('the activity feed names the checklist, the item and the lists, and shows no __placeholder__', async ({ loggedInPage: page, user }) => {
  const { boardId, swimlaneId, listIds } = db.seedBoard({ ownerId: user.id, title: 'Feed sentences', cardTitlesPerList: [['Release card']] });
  try {
    const cardId = db.findCardIdByTitle({ boardId, title: 'Release card' });
    const checklistId = db.uid('checklist');
    const itemId = db.uid('item');
    db.insertOne('checklists', { _id: checklistId, cardId, title: 'Release steps', sort: 0, createdAt: new Date() });
    db.insertOne('checklistItems', { _id: itemId, checklistId, cardId, title: 'Tag the version', sort: 0, isFinished: true });
    const at = n => new Date(Date.now() - n * 1000);
    db.insertMany('activities', [
      { _id: db.uid('act'), userId: user.id, activityType: 'checkedItem', boardId, cardId, listId: listIds[0], swimlaneId,
        checklistId, checklistItemId: itemId, createdAt: at(3) },
      { _id: db.uid('act'), userId: user.id, activityType: 'moveCard', boardId, cardId, listId: listIds[1], oldListId: listIds[0],
        swimlaneId, oldSwimlaneId: swimlaneId, createdAt: at(2) },
      // The checklist item is gone by now: its name is left out, not shown as __checklistItem__.
      { _id: db.uid('act'), userId: user.id, activityType: 'removedChecklistItem', boardId, cardId, listId: listIds[0],
        checklistId, checklistItemId: 'deleted-item', createdAt: at(1) },
    ]);
    await navigateInApp(page, '/activity');
    const feed = page.locator('.activity-feed');
    await expect(feed).toContainText('checked Tag the version of checklist Release steps at card Release card');
    await expect(feed).toContainText('from list List A at swimlane Default to list List B');
    await expect(feed).toContainText('removed checklist item from checklist Release steps');
    // Negative: nothing unfilled, no raw activity name.
    expect(await feed.innerText()).not.toMatch(/__[A-Za-z]+__/);
    expect(await feed.innerText()).not.toContain('removedChecklistItem');
  } finally {
    db.deleteMany('activities', { boardId });
    db.deleteMany('checklists', { cardId: { $exists: true }, title: 'Release steps' });
    db.deleteMany('checklistItems', { title: 'Tag the version' });
    db.cleanup({ boardIds: [boardId] });
  }
});
