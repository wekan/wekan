import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
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
import Boards from '/models/boards';
import Cards from '/models/cards';
import { ensureIndex } from '/server/lib/mongoStartup';
import { backfillBoardIdFromCard } from '/server/lib/denormalizeBoardId';
import { allowIsBoardMemberWithWriteAccessByCard } from '/server/lib/utils';
import { getFeatureFlags } from '/models/lib/featureFlags';
const {
  normalizeChecklistWorkMetadata,
} = require('/models/lib/checklistItemWork');

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
  await ensureIndex(ChecklistItems, { assigneeId: 1, isFinished: 1, dueAt: 1 });
  await ensureIndex(ChecklistItems, { remindAt: 1, reminderSentAt: 1 });
  // Backfill existing rows in the background (memory-safe, idempotent).
  Meteor.defer(() => {
    backfillBoardIdFromCard(ChecklistItems, { label: 'checklistItems' });
  });
});

function workMetadataModifier(value) {
  const modifier = { $set: {}, $unset: { reminderSentAt: 1 } };
  for (const field of ['assigneeId', 'dueAt', 'remindAt']) {
    if (value[field]) modifier.$set[field] = value[field];
    else modifier.$unset[field] = 1;
  }
  if (Object.keys(modifier.$set).length === 0) delete modifier.$set;
  return modifier;
}

Meteor.methods({
  async 'checklistItems.setWorkMetadata'(itemId, payload) {
    check(itemId, String);
    check(payload, Match.ObjectIncluding({}));
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const item = await ChecklistItems.findOneAsync(itemId);
    const card = item ? await Cards.findOneAsync(item.cardId) : null;
    if (
      !item ||
      !card ||
      !(await allowIsBoardMemberWithWriteAccessByCard(this.userId, card))
    ) {
      throw new Meteor.Error('not-authorized');
    }

    const normalized = normalizeChecklistWorkMetadata(payload);
    if (normalized.error) throw new Meteor.Error(normalized.error);
    const { assigneeId, dueAt, remindAt } = normalized.value;
    const board = await Boards.findOneAsync(card.boardId);
    const activeMember = assigneeId && board && (board.members || []).find(
      member => member.userId === assigneeId && member.isActive === true,
    );
    if (assigneeId && !activeMember) {
      throw new Meteor.Error('checklist-item-assignee-not-board-member');
    }

    await ChecklistItems.direct.updateAsync(
      { _id: itemId, cardId: card._id, boardId: card.boardId },
      workMetadataModifier({ assigneeId, dueAt, remindAt }),
    );

    if (assigneeId && assigneeId !== item.assigneeId) {
      await Activities.insertAsync({
        userId: this.userId,
        activityType: 'checklistItemAssigned',
        assigneeId,
        boardId: card.boardId,
        cardId: card._id,
        checklistId: item.checklistId,
        checklistItemId: item._id,
        listId: card.listId,
        swimlaneId: card.swimlaneId,
      });
    }

    return { itemId, assigneeId, dueAt, remindAt };
  },
});

export async function processChecklistItemReminders(now = new Date()) {
  const flags = getFeatureFlags();
  if (flags.disableNotifications || flags.disableActivities) return 0;

  const items = await ChecklistItems.find(
    {
      isFinished: false,
      assigneeId: { $exists: true, $nin: [null, ''] },
      remindAt: { $lte: now },
      $or: [
        { reminderSentAt: { $exists: false } },
        { reminderSentAt: null },
      ],
    },
    { sort: { remindAt: 1 }, limit: 200 },
  ).fetchAsync();

  let delivered = 0;
  for (const item of items) {
    const card = await Cards.findOneAsync({ _id: item.cardId, archived: false });
    const board = card ? await Boards.findOneAsync(card.boardId) : null;
    const assigneeIsActive = board && (board.members || []).some(
      member => member.userId === item.assigneeId && member.isActive === true,
    );
    if (!card || !assigneeIsActive) continue;

    const claimed = await ChecklistItems.direct.updateAsync(
      {
        _id: item._id,
        isFinished: false,
        $or: [
          { reminderSentAt: { $exists: false } },
          { reminderSentAt: null },
        ],
      },
      { $set: { reminderSentAt: now } },
    );
    if (!claimed) continue;

    await Activities.insertAsync({
      userId: item.assigneeId,
      activityType: 'checklistItemReminder',
      reminderForUserId: item.assigneeId,
      boardId: card.boardId,
      cardId: card._id,
      checklistId: item.checklistId,
      checklistItemId: item._id,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
      timeValue: item.dueAt,
    });
    delivered += 1;
  }
  return delivered;
}

Meteor.startup(() => {
  Meteor.setInterval(() => {
    processChecklistItemReminders().catch(error => {
      console.error('Checklist item reminder scan failed:', error);
    });
  }, 60 * 1000);
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
        // Append, like the UI does. Every item created over REST used to be given
        // `sort: 0`, so a checklist filled through the API came out in an order
        // nobody chose - and every item after the first shared the first one's
        // position. An explicit `sort` in the body still wins, for a caller that
        // is rebuilding a checklist in a known order (#6544).
        let sort = Number(req.body.sort);
        if (!Number.isFinite(sort)) {
          const last = await ReactiveCache.getChecklistItems(
            { checklistId: paramChecklistId },
            { sort: { sort: -1 }, limit: 1 },
          );
          sort = last && last.length && Number.isFinite(last[0].sort) ? last[0].sort + 1 : 0;
        }

        const id = await ChecklistItems.insertAsync({
          cardId: paramCardId,
          checklistId: paramChecklistId,
          title: req.body.title,
          isFinished: false,
          sort,
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
