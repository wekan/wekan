import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Activities from '/models/activities';

Meteor.methods({
  async moveChecklist(checklistId, newCardId) {
    check(checklistId, String);
    check(newCardId, String);

    const checklist = await ReactiveCache.getChecklist(checklistId);
    if (!checklist) {
      throw new Meteor.Error('checklist-not-found', 'Checklist not found');
    }

    const newCard = await ReactiveCache.getCard(newCardId);
    if (!newCard) {
      throw new Meteor.Error('card-not-found', 'Target card not found');
    }

    const sourceCard = await ReactiveCache.getCard(checklist.cardId);
    if (!allowIsBoardMemberByCard(this.userId, sourceCard)) {
      throw new Meteor.Error('not-authorized', 'Not authorized to move checklist from source card');
    }
    if (!allowIsBoardMemberByCard(this.userId, newCard)) {
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

Meteor.startup(async () => {
  await Checklists._collection.createIndexAsync({ modifiedAt: -1 });
  await Checklists._collection.createIndexAsync({ cardId: 1, createdAt: 1 });
});

Checklists.after.insert(async (userId, doc) => {
  const card = await ReactiveCache.getCard(doc.cardId);
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
  const activities = await ReactiveCache.getActivities({ checklistId: doc._id });
  const card = await ReactiveCache.getCard(doc.cardId);
  if (activities) {
    for (const activity of activities) {
      await Activities.removeAsync(activity._id);
    }
  }
  await Activities.insertAsync({
    userId,
    activityType: 'removeChecklist',
    cardId: doc.cardId,
    boardId: (await ReactiveCache.getCard(doc.cardId)).boardId,
    checklistId: doc._id,
    checklistName: doc.title,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
});

WebApp.handlers.get(
  '/api/boards/:boardId/cards/:cardId/checklists',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

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
    Authentication.checkBoardAccess(req.userId, paramBoardId);

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
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    const board = await ReactiveCache.getBoard(paramBoardId);
    const addPermission = allowIsBoardMemberCommentOnly(req.userId, board);
    Authentication.checkAdminOrCondition(req.userId, addPermission);
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
    Authentication.checkBoardAccess(req.userId, paramBoardId);

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
