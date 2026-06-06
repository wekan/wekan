import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import ChecklistItems, {
  itemCreation,
  itemRemover,
  publishCheckActivity,
  publishChekListCompleted,
  publishChekListUncompleted,
} from '/models/checklistItems';
import Activities from '/models/activities';
import { ensureIndex } from '/server/lib/mongoStartup';
import { backfillBoardIdFromCard } from '/server/lib/denormalizeBoardId';

// --- Denormalized boardId (see models/checklistItems.js schema) -------------
// Set boardId from the card on insert, and re-sync it whenever the item is
// moved to another card (its move helper sets a new cardId), so the board
// publication can filter checklist items with a single reactive cursor on
// boardId and still see items on newly added cards. Server-authoritative.
ChecklistItems.before.insert(async (userId, doc) => {
  if (!doc.boardId && doc.cardId) {
    const card = await ReactiveCache.getCard(doc.cardId);
    if (card) {
      doc.boardId = card.boardId;
    }
  }
});

ChecklistItems.before.update(async (userId, doc, fieldNames, modifier) => {
  const newCardId = modifier && modifier.$set && modifier.$set.cardId;
  if (newCardId && newCardId !== doc.cardId) {
    const card = await ReactiveCache.getCard(newCardId);
    if (card) {
      modifier.$set.boardId = card.boardId;
    }
  }
});

Meteor.startup(async () => {
  await ensureIndex(ChecklistItems, { modifiedAt: -1 });
  await ensureIndex(ChecklistItems, { updatedAt: 1, deleted: 1 });
  await ensureIndex(ChecklistItems, { checklistId: 1 });
  await ensureIndex(ChecklistItems, { cardId: 1 });
  await ensureIndex(ChecklistItems, { boardId: 1 });
  // Backfill existing rows in the background (memory-safe, idempotent).
  Meteor.defer(() => {
    backfillBoardIdFromCard(ChecklistItems, { label: 'checklistItems' });
  });
});

ChecklistItems.after.update(async (userId, doc, fieldNames) => {
  await publishCheckActivity(userId, doc);
  await publishChekListCompleted(userId, doc, fieldNames);
});

ChecklistItems.before.update(async (userId, doc, fieldNames) => {
  await publishChekListUncompleted(userId, doc, fieldNames);
});

ChecklistItems.after.insert(async (userId, doc) => {
  await itemCreation(userId, doc);
});

ChecklistItems.before.remove(async (userId, doc) => {
  try {
    await itemRemover(userId, doc);
    // When a whole list/card is deleted, the parent card may already be gone
    // by the time its checklist items are removed (cascade delete). Skip the
    // activity then instead of dereferencing an undefined card, which would
    // throw an unhandled rejection and crash SyncedCron.
    const card = await ReactiveCache.getCard(doc.cardId);
    if (!card) {
      console.warn('[ChecklistItems.before.remove] Card not found for cardId:', doc.cardId, '— skipping removedChecklistItem activity.');
      return;
    }
    await Activities.insertAsync({
      userId,
      activityType: 'removedChecklistItem',
      cardId: doc.cardId,
      boardId: card.boardId,
      checklistId: doc.checklistId,
      checklistItemId: doc._id,
      checklistItemName: doc.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    });
  } catch (e) {
    console.error('[ChecklistItems.before.remove] Error while processing checklist item deletion for doc._id:', doc._id, e);
  }
});

WebApp.handlers.get(
  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramChecklistId = req.params.checklistId;
    const paramItemId = req.params.itemId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    const checklistItem = await ReactiveCache.getChecklistItem(paramItemId);
    if (checklistItem && checklistItem.cardId === paramCardId && checklistItem.checklistId === paramChecklistId) {
      const card = await ReactiveCache.getCard(checklistItem.cardId);
      if (card && card.boardId === paramBoardId) {
        sendJsonResult(res, {
          code: 200,
          data: checklistItem,
        });
      } else {
        sendJsonResult(res, {
          code: 404,
        });
      }
    } else {
      sendJsonResult(res, {
        code: 404,
      });
    }
  },
);

WebApp.handlers.post(
  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramChecklistId = req.params.checklistId;
    const paramCardId = req.params.cardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    const checklist = await ReactiveCache.getChecklist({
      _id: paramChecklistId,
      cardId: paramCardId,
    });
    if (checklist) {
      const card = await ReactiveCache.getCard(paramCardId);
      if (card && card.boardId === paramBoardId) {
        const id = await ChecklistItems.insertAsync({
          cardId: paramCardId,
          checklistId: paramChecklistId,
          title: req.body.title,
          isFinished: false,
          sort: 0,
        });
        sendJsonResult(res, {
          code: 200,
          data: {
            _id: id,
          },
        });
      } else {
        sendJsonResult(res, {
          code: 404,
        });
      }
    } else {
      sendJsonResult(res, {
        code: 404,
      });
    }
  },
);

WebApp.handlers.put(
  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramChecklistId = req.params.checklistId;
    const paramItemId = req.params.itemId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

    const checklistItem = await ReactiveCache.getChecklistItem(paramItemId);
    if (!checklistItem || checklistItem.cardId !== paramCardId || checklistItem.checklistId !== paramChecklistId) {
      sendJsonResult(res, {
        code: 404,
      });
      return;
    }
    const card = await ReactiveCache.getCard(checklistItem.cardId);
    if (!card || card.boardId !== paramBoardId) {
      sendJsonResult(res, {
        code: 404,
      });
      return;
    }

    function isTrue(data) {
      try {
        return data.toLowerCase() === 'true';
      } catch (error) {
        return data;
      }
    }

    if (req.body.hasOwnProperty('isFinished')) {
      await ChecklistItems.direct.updateAsync(
        { _id: paramItemId },
        { $set: { isFinished: isTrue(req.body.isFinished) } },
      );
    }
    if (req.body.hasOwnProperty('title')) {
      await ChecklistItems.direct.updateAsync(
        { _id: paramItemId },
        { $set: { title: req.body.title } },
      );
    }

    sendJsonResult(res, {
      code: 200,
      data: {
        _id: paramItemId,
      },
    });
  },
);

WebApp.handlers.delete(
  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramChecklistId = req.params.checklistId;
    const paramItemId = req.params.itemId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

    const checklistItem = await ReactiveCache.getChecklistItem(paramItemId);
    if (!checklistItem || checklistItem.cardId !== paramCardId || checklistItem.checklistId !== paramChecklistId) {
      sendJsonResult(res, {
        code: 404,
      });
      return;
    }
    const card = await ReactiveCache.getCard(checklistItem.cardId);
    if (!card || card.boardId !== paramBoardId) {
      sendJsonResult(res, {
        code: 404,
      });
      return;
    }

    await ChecklistItems.direct.removeAsync({ _id: paramItemId });
    sendJsonResult(res, {
      code: 200,
      data: {
        _id: paramItemId,
      },
    });
  },
);
