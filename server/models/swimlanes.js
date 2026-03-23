import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Swimlanes from '/models/swimlanes';
import Activities from '/models/activities';
import Cards from '/models/cards';

Meteor.methods({
  async ensureDefaultSwimlane(boardId) {
    check(boardId, String);

    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    if (!board.isPublic?.() && (!this.userId || !board.isMember?.(this.userId))) {
      throw new Meteor.Error('not-authorized');
    }

    const existingSwimlane = await Swimlanes.findOneAsync(
      { boardId, archived: false },
      { sort: { sort: 1 } },
    );
    if (existingSwimlane?._id) {
      return existingSwimlane._id;
    }

    return await Swimlanes.insertAsync({
      title: 'Default',
      boardId,
    });
  },
});

Meteor.startup(async () => {
  await Swimlanes._collection.createIndexAsync({ modifiedAt: -1 });
  await Swimlanes._collection.createIndexAsync({ boardId: 1 });
});

Swimlanes.after.insert(async (userId, doc) => {
  await Activities.insertAsync({
    userId,
    type: 'swimlane',
    activityType: 'createSwimlane',
    boardId: doc.boardId,
    swimlaneId: doc._id,
  });

  Meteor.setTimeout(() => {
    Swimlanes.findOneAsync(doc._id)
      .then(swimlane => swimlane?.trackOriginalPosition())
      .catch(error => {
        if (process.env.DEBUG === 'true') {
          console.error('Failed to track original swimlane position:', error);
        }
      });
  }, 100);
});

Swimlanes.before.remove(async function(userId, doc) {
  const lists = await ReactiveCache.getLists(
    {
      boardId: doc.boardId,
      swimlaneId: { $in: [doc._id, ''] },
      archived: false,
    },
    { sort: ['sort'] },
  );

  if (lists.length < 2) {
    for (const list of lists) {
      await list.remove();
    }
  } else {
    await Cards.removeAsync({ swimlaneId: doc._id });
  }

  await Activities.insertAsync({
    userId,
    type: 'swimlane',
    activityType: 'removeSwimlane',
    boardId: doc.boardId,
    swimlaneId: doc._id,
    title: doc.title,
  });
});

Swimlanes.after.update(async (userId, doc, fieldNames) => {
  if (fieldNames.includes('title')) {
    await Activities.insertAsync({
      userId,
      type: 'swimlane',
      activityType: 'changedSwimlaneTitle',
      listId: doc._id,
      boardId: doc.boardId,
      title: doc.title,
    });
  } else if (doc.archived) {
    await Activities.insertAsync({
      userId,
      type: 'swimlane',
      activityType: 'archivedSwimlane',
      listId: doc._id,
      boardId: doc.boardId,
      title: doc.title,
    });
  } else if (fieldNames.includes('archived')) {
    await Activities.insertAsync({
      userId,
      type: 'swimlane',
      activityType: 'restoredSwimlane',
      listId: doc._id,
      boardId: doc.boardId,
      title: doc.title,
    });
  }
});

WebApp.handlers.get('/api/boards/:boardId/swimlanes', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    const swimlanes = await ReactiveCache.getSwimlanes({ boardId: paramBoardId, archived: false });
    sendJsonResult(res, {
      code: 200,
      data: swimlanes.map(function(doc) {
        return {
          _id: doc._id,
          title: doc.title,
        };
      }),
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.get('/api/boards/:boardId/swimlanes/:swimlaneId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramSwimlaneId = req.params.swimlaneId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    sendJsonResult(res, {
      code: 200,
      data: await ReactiveCache.getSwimlane({
        _id: paramSwimlaneId,
        boardId: paramBoardId,
        archived: false,
      }),
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.post('/api/boards/:boardId/swimlanes', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

    const board = await ReactiveCache.getBoard(paramBoardId);
    const id = await Swimlanes.insertAsync({
      title: req.body.title,
      boardId: paramBoardId,
      sort: board.swimlanes().length,
    });
    sendJsonResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.put('/api/boards/:boardId/swimlanes/:swimlaneId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramSwimlaneId = req.params.swimlaneId;
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    await ReactiveCache.getBoard(paramBoardId);
    const swimlane = await ReactiveCache.getSwimlane({
      _id: paramSwimlaneId,
      boardId: paramBoardId,
    });
    if (!swimlane) {
      throw new Meteor.Error('not-found', 'Swimlane not found');
    }
    await Swimlanes.direct.updateAsync(
      { _id: paramSwimlaneId },
      { $set: { title: req.body.title } },
    );
    sendJsonResult(res, {
      code: 200,
      data: {
        _id: paramSwimlaneId,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.delete('/api/boards/:boardId/swimlanes/:swimlaneId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramSwimlaneId = req.params.swimlaneId;
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    await Swimlanes.removeAsync({ _id: paramSwimlaneId, boardId: paramBoardId });
    sendJsonResult(res, {
      code: 200,
      data: {
        _id: paramSwimlaneId,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});
