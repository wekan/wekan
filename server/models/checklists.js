import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import { allowIsBoardMemberByCard, allowIsBoardMemberCommentOnly } from '/server/lib/utils';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Activities from '/models/activities';
import { ensureIndex } from '/server/lib/mongoStartup';
import { backfillBoardIdFromCard } from '/server/lib/denormalizeBoardId';

Meteor.methods({
  async moveChecklist(checklistId, newCardId) {
    check(checklistId, String);
    check(newCardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const checklist = await ReactiveCache.getChecklist(checklistId);
    if (!checklist) {
      throw new Meteor.Error('checklist-not-found', 'Checklist not found');
    }

    const newCard = await ReactiveCache.getCard(newCardId);
    if (!newCard) {
      throw new Meteor.Error('card-not-found', 'Target card not found');
    }

    // allowIsBoardMemberByCard is async; it was previously both unimported and
    // un-awaited, so the membership check never actually ran. Import + await it.
    const sourceCard = await ReactiveCache.getCard(checklist.cardId);
    if (!(await allowIsBoardMemberByCard(this.userId, sourceCard))) {
      throw new Meteor.Error('not-authorized', 'Not authorized to move checklist from source card');
    }
    if (!(await allowIsBoardMemberByCard(this.userId, newCard))) {
      throw new Meteor.Error('not-authorized', 'Not authorized to move checklist to target card');
    }

    const activities = await ReactiveCache.getActivities({ checklistId });
    for (const activity of activities) {
      await Activities.updateAsync(activity._id, {
        $set: {
          cardId: newCardId,
        },
      });
    }

    const checklistItems = await ReactiveCache.getChecklistItems({ checklistId });
    for (const checklistItem of checklistItems) {
      await ChecklistItems.updateAsync(checklistItem._id, {
        $set: {
          cardId: newCardId,
        },
      });
    }

    await Checklists.updateAsync(checklistId, {
      $set: {
        cardId: newCardId,
      },
    });

    return checklistId;
  },
});

// --- Denormalized boardId (see models/checklists.js schema) -----------------
// Set boardId from the card on insert, and re-sync it whenever the checklist is
// moved to another card, so the board publication can filter checklists by a
// single reactive cursor on boardId and still see checklists on newly added
// cards. Server-authoritative: the board publication runs on the server, so the
// server document carrying boardId is what matters.
Checklists.before.insert(async (userId, doc) => {
  if (!doc.boardId && doc.cardId) {
    const card = await ReactiveCache.getCard(doc.cardId);
    if (card) {
      doc.boardId = card.boardId;
    }
  }
});

Checklists.before.update(async (userId, doc, fieldNames, modifier) => {
  const newCardId = modifier && modifier.$set && modifier.$set.cardId;
  if (newCardId && newCardId !== doc.cardId) {
    const card = await ReactiveCache.getCard(newCardId);
    if (card) {
      modifier.$set.boardId = card.boardId;
    }
  }
});

Meteor.startup(async () => {
  await ensureIndex(Checklists, { modifiedAt: -1 });
  await ensureIndex(Checklists, { cardId: 1, createdAt: 1 });
  await ensureIndex(Checklists, { boardId: 1 });
  // Backfill existing rows in the background (memory-safe, idempotent) so it
  // never blocks or OOMs startup. New checklists already get boardId on insert.
  Meteor.defer(() => {
    backfillBoardIdFromCard(Checklists, { label: 'checklists' });
  });
});

Checklists.after.insert(async (userId, doc) => {
  const card = await ReactiveCache.getCard(doc.cardId);
  if (!card) {
    console.warn('[Checklists.after.insert] Card not found for cardId:', doc.cardId, '— skipping addChecklist activity.');
    return;
  }
  await Activities.insertAsync({
    userId,
    activityType: 'addChecklist',
    cardId: doc.cardId,
    boardId: card.boardId,
    checklistId: doc._id,
    checklistName: doc.title,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
});

Checklists.before.remove(async (userId, doc) => {
  try {
    const activities = await ReactiveCache.getActivities({ checklistId: doc._id });
    if (activities) {
      for (const activity of activities) {
        await Activities.removeAsync(activity._id);
      }
    }
    // When a whole list/card is deleted, the parent card may already be gone by
    // the time its checklists are removed (cascade delete). Skip the activity
    // then instead of dereferencing an undefined card, which would throw an
    // unhandled rejection and crash SyncedCron.
    const card = await ReactiveCache.getCard(doc.cardId);
    if (!card) {
      console.warn('[Checklists.before.remove] Card not found for cardId:', doc.cardId, '— skipping removeChecklist activity.');
      return;
    }
    await Activities.insertAsync({
      userId,
      activityType: 'removeChecklist',
      cardId: doc.cardId,
      boardId: card.boardId,
      checklistId: doc._id,
      checklistName: doc.title,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    });
  } catch (e) {
    console.error('[Checklists.before.remove] Error while processing checklist deletion for doc._id:', doc._id, e);
  }
});

WebApp.handlers.get(
  '/api/boards/:boardId/cards/:cardId/checklists',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

    const card = await ReactiveCache.getCard({
      _id: paramCardId,
      boardId: paramBoardId,
    });
    if (!card) {
      sendJsonResult(res, {
        code: 404,
        data: { error: 'Card not found or does not belong to the specified board' },
      });
      return;
    }

    const checklists = (await ReactiveCache.getChecklists({ cardId: paramCardId })).map(function(
      doc,
    ) {
      return {
        _id: doc._id,
        title: doc.title,
      };
    });
    if (checklists) {
      sendJsonResult(res, {
        code: 200,
        data: checklists,
      });
    } else {
      sendJsonResult(res, {
        code: 500,
      });
    }
  },
);

WebApp.handlers.get(
  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramChecklistId = req.params.checklistId;
    const paramCardId = req.params.cardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

    const card = await ReactiveCache.getCard({
      _id: paramCardId,
      boardId: paramBoardId,
    });
    if (!card) {
      sendJsonResult(res, {
        code: 404,
        data: { error: 'Card not found or does not belong to the specified board' },
      });
      return;
    }

    const checklist = await ReactiveCache.getChecklist({
      _id: paramChecklistId,
      cardId: paramCardId,
    });
    if (checklist) {
      checklist.items = (await ReactiveCache.getChecklistItems({
        checklistId: checklist._id,
      })).map(function(doc) {
        return {
          _id: doc._id,
          title: doc.title,
          isFinished: doc.isFinished,
        };
      });
      sendJsonResult(res, {
        code: 200,
        data: checklist,
      });
    } else {
      sendJsonResult(res, {
        code: 500,
      });
    }
  },
);

WebApp.handlers.post(
  '/api/boards/:boardId/cards/:cardId/checklists',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    const board = await ReactiveCache.getBoard(paramBoardId);
    const addPermission = allowIsBoardMemberCommentOnly(req.userId, board);
    await Authentication.checkAdminOrCondition(req.userId, addPermission);
    const paramCardId = req.params.cardId;

    const card = await ReactiveCache.getCard({
      _id: paramCardId,
      boardId: paramBoardId,
    });
    if (!card) {
      sendJsonResult(res, {
        code: 404,
        data: { error: 'Card not found or does not belong to the specified board' },
      });
      return;
    }

    const id = await Checklists.insertAsync({
      title: req.body.title,
      cardId: paramCardId,
      sort: 0,
    });
    if (id) {
      let items = req.body.items || [];
      if (typeof items === 'string') {
        if (items === '') {
          items = [];
        } else {
          items = [items];
        }
      }
      for (const [idx, item] of items.entries()) {
        await ChecklistItems.insertAsync({
          cardId: paramCardId,
          checklistId: id,
          title: item,
          sort: idx,
        });
      }
      sendJsonResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    } else {
      sendJsonResult(res, {
        code: 400,
      });
    }
  },
);

WebApp.handlers.delete(
  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramChecklistId = req.params.checklistId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

    const card = await ReactiveCache.getCard({
      _id: paramCardId,
      boardId: paramBoardId,
    });
    if (!card) {
      sendJsonResult(res, {
        code: 404,
        data: { error: 'Card not found or does not belong to the specified board' },
      });
      return;
    }

    const checklist = await ReactiveCache.getChecklist({
      _id: paramChecklistId,
      cardId: paramCardId,
    });
    if (!checklist) {
      sendJsonResult(res, {
        code: 404,
        data: { error: 'Checklist not found or does not belong to the specified card' },
      });
      return;
    }

    await Checklists.removeAsync({ _id: paramChecklistId });
    sendJsonResult(res, {
      code: 200,
      data: {
        _id: paramChecklistId,
      },
    });
  },
);
