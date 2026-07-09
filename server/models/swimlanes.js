import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Swimlanes from '/models/swimlanes';
import Activities from '/models/activities';
import Cards from '/models/cards';
import { ensureIndex } from '/server/lib/mongoStartup';
import { computeSortForIndex } from '/server/lib/utils';
import { nextSwimlaneSort } from '/models/lib/swimlaneSort';

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
  await ensureIndex(Swimlanes, { modifiedAt: -1 });
  await ensureIndex(Swimlanes, { boardId: 1 });
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
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

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
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

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
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

    const board = await ReactiveCache.getBoard(paramBoardId);
    // #3624: append reliably at max(existing sort)+1 (a plain count misordered
    // the new swimlane when sorts were non-contiguous), and honor an optional
    // explicit `sort` from the request body. board.swimlanes() is ASYNC on the
    // server (ReactiveCache.getSwimlanes returns a Promise), so it must be
    // awaited before mapping — the old `.length` read tolerated the Promise by
    // silently yielding undefined, but `.map` on a Promise throws.
    const existingSwimlanes = (await board.swimlanes()) || [];
    const existingSorts = existingSwimlanes.map(s => s.sort);
    const id = await Swimlanes.insertAsync({
      title: req.body.title,
      boardId: paramBoardId,
      sort: nextSwimlaneSort(existingSorts, req.body.sort),
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
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
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
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
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

// Reposition a freshly copied/moved swimlane at a 0-based `position` counted
// from the top of the destination board, by setting its sort between siblings.
async function repositionSwimlane(swimlaneId, toBoardId, position) {
  if (position === undefined || position === null) {
    return;
  }
  const siblings = await ReactiveCache.getSwimlanes(
    { boardId: toBoardId, archived: false, _id: { $ne: swimlaneId } },
    { sort: { sort: 1 } },
  );
  const newSort = computeSortForIndex(siblings, Number(position));
  await Swimlanes.direct.updateAsync({ _id: swimlaneId }, { $set: { sort: newSort } });
}

// Copy a swimlane (deep copy: its lists and cards) to the same or a different
// board, at a 0-based `position` from the top. Body: { toBoardId?, position?, title? }
WebApp.handlers.post(
  '/api/boards/:boardId/swimlanes/:swimlaneId/copy',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramSwimlaneId = req.params.swimlaneId;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    const toBoardId = req.body.toBoardId || paramBoardId;
    await Authentication.checkBoardWriteAccess(req.userId, toBoardId);
    const swimlane = await ReactiveCache.getSwimlane({ _id: paramSwimlaneId, boardId: paramBoardId });
    if (!swimlane) {
      sendJsonResult(res, { code: 404, data: { error: 'Swimlane not found' } });
      return;
    }
    const newId = await swimlane.copy(toBoardId, null, 'below', req.body.title || '');
    await repositionSwimlane(newId, toBoardId, req.body.position);
    sendJsonResult(res, { code: 200, data: { _id: newId } });
  },
);

// Move a swimlane (with its lists and cards) to the same or a different board,
// at a 0-based `position` from the top. Body: { toBoardId?, position?, title? }
WebApp.handlers.post(
  '/api/boards/:boardId/swimlanes/:swimlaneId/move',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramSwimlaneId = req.params.swimlaneId;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    const toBoardId = req.body.toBoardId || paramBoardId;
    await Authentication.checkBoardWriteAccess(req.userId, toBoardId);
    const swimlane = await ReactiveCache.getSwimlane({ _id: paramSwimlaneId, boardId: paramBoardId });
    if (!swimlane) {
      sendJsonResult(res, { code: 404, data: { error: 'Swimlane not found' } });
      return;
    }
    await swimlane.move(toBoardId, null, 'below', req.body.title || '');
    await repositionSwimlane(paramSwimlaneId, toBoardId, req.body.position);
    sendJsonResult(res, { code: 200, data: { _id: paramSwimlaneId } });
  },
);
