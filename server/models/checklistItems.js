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

Meteor.startup(async () => {
  await ChecklistItems._collection.createIndexAsync({ modifiedAt: -1 });
  await ChecklistItems._collection.createIndexAsync({ checklistId: 1 });
  await ChecklistItems._collection.createIndexAsync({ cardId: 1 });
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
  await itemRemover(userId, doc);
  const card = await ReactiveCache.getCard(doc.cardId);
  const boardId = card.boardId;
  await Activities.insertAsync({
    userId,
    activityType: 'removedChecklistItem',
    cardId: doc.cardId,
    boardId,
    checklistId: doc.checklistId,
    checklistItemId: doc._id,
    checklistItemName: doc.title,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
});

WebApp.handlers.get(
  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramChecklistId = req.params.checklistId;
    const paramItemId = req.params.itemId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
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
    Authentication.checkBoardAccess(req.userId, paramBoardId);
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
    Authentication.checkBoardAccess(req.userId, paramBoardId);

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
    Authentication.checkBoardAccess(req.userId, paramBoardId);

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
