import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import {
  validateCommentBody,
  httpStatusForError,
  extractErrorMessage,
} from '/server/lib/apiResponseHelpers';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import CardComments from '/models/cardComments';
import { ensureIndex } from '/server/lib/mongoStartup';

async function commentCreation(userId, doc) {
  const card = await ReactiveCache.getCard(doc.cardId);
  if (!card) {
    console.warn('[commentCreation] Card not found for cardId:', doc.cardId, '— skipping activity insert.');
    return;
  }
  await Activities.insertAsync({
    userId,
    activityType: 'addComment',
    boardId: doc.boardId,
    cardId: doc.cardId,
    commentId: doc._id,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
}

Meteor.startup(async () => {
  await ensureIndex(CardComments, { modifiedAt: -1 });
  await ensureIndex(CardComments, { cardId: 1, createdAt: -1 });
  // The board publication now publishes all of a board's comments with one cursor on
  // the denormalized boardId (replacing a per-card N+1, #6480); index it so that
  // board-level query is not a full collection scan.
  await ensureIndex(CardComments, { boardId: 1 });
});

CardComments.after.insert(async (userId, doc) => {
  await commentCreation(userId, doc);
});

CardComments.after.update(async (userId, doc) => {
  const card = await ReactiveCache.getCard(doc.cardId);
  if (!card) {
    console.warn('[CardComments.after.update] Card not found for cardId:', doc.cardId, '— skipping activity insert.');
    return;
  }
  await Activities.insertAsync({
    userId,
    activityType: 'editComment',
    boardId: doc.boardId,
    cardId: doc.cardId,
    commentId: doc._id,
    // #3606: store the comment text so the activity feed shows it instead of
    // "undefined" (the id was passed before, and a deleted comment cannot be
    // looked up live).
    commentText: doc.text,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
});

CardComments.before.remove(async (userId, doc) => {
  try {
    const card = await ReactiveCache.getCard(doc.cardId);
    if (!card) {
      console.warn('[CardComments.before.remove] Card not found for cardId:', doc.cardId, '— skipping deleteComment activity.');
    } else {
      await Activities.insertAsync({
        userId,
        activityType: 'deleteComment',
        boardId: doc.boardId,
        cardId: doc.cardId,
        commentId: doc._id,
        // #3606: capture the text before the comment doc is removed, so the
        // feed shows the deleted comment instead of "undefined".
        commentText: doc.text,
        listId: card.listId,
        swimlaneId: card.swimlaneId,
      });
    }
    const activity = await ReactiveCache.getActivity({ commentId: doc._id });
    if (activity) {
      await Activities.removeAsync(activity._id);
    }
  } catch (e) {
    console.error('[CardComments.before.remove] Error while processing comment deletion for doc._id:', doc._id, e);
  }
});

WebApp.handlers.get('/api/boards/:boardId/cards/:cardId/comments', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    sendJsonResult(res, {
      code: 200,
      data: (await ReactiveCache.getCardComments({
        boardId: paramBoardId,
        cardId: paramCardId,
      })).map(doc => ({
        _id: doc._id,
        comment: doc.text,
        authorId: doc.userId,
      })),
    });
  } catch (error) {
    sendJsonResult(res, {
      code: httpStatusForError(error),
      data: { error: extractErrorMessage(error) },
    });
  }
});

WebApp.handlers.get(
  '/api/boards/:boardId/cards/:cardId/comments/:commentId',
  async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramCommentId = req.params.commentId;
      const paramCardId = req.params.cardId;
      await Authentication.checkBoardAccess(req.userId, paramBoardId);
      sendJsonResult(res, {
        code: 200,
        data: await ReactiveCache.getCardComment({
          _id: paramCommentId,
          cardId: paramCardId,
          boardId: paramBoardId,
        }),
      });
    } catch (error) {
      sendJsonResult(res, {
        code: httpStatusForError(error),
        data: { error: extractErrorMessage(error) },
      });
    }
  },
);

WebApp.handlers.post('/api/boards/:boardId/cards/:cardId/comments', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

    // Validate the required `comment` parameter before inserting. Without this
    // an empty/missing comment reaches the schema-validated insert and throws a
    // circular validation error that previously surfaced as HTTP 500. See #5804.
    const validation = validateCommentBody(req.body);
    if (!validation.valid) {
      sendJsonResult(res, {
        code: 400,
        data: { error: validation.error },
      });
      return;
    }

    const id = await CardComments.direct.insertAsync({
      userId: req.userId,
      text: validation.comment,
      cardId: paramCardId,
      boardId: paramBoardId,
    });

    sendJsonResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });

    const cardComment = await ReactiveCache.getCardComment({
      _id: id,
      cardId: paramCardId,
      boardId: paramBoardId,
    });
    await commentCreation(req.userId, cardComment);
  } catch (error) {
    sendJsonResult(res, {
      code: httpStatusForError(error),
      data: { error: extractErrorMessage(error) },
    });
  }
});

WebApp.handlers.delete(
  '/api/boards/:boardId/cards/:cardId/comments/:commentId',
  async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramCommentId = req.params.commentId;
      const paramCardId = req.params.cardId;
      await Authentication.checkBoardAccess(req.userId, paramBoardId);
      await CardComments.removeAsync({
        _id: paramCommentId,
        cardId: paramCardId,
        boardId: paramBoardId,
      });
      sendJsonResult(res, {
        code: 200,
        data: {
          _id: paramCardId,
        },
      });
    } catch (error) {
      sendJsonResult(res, {
        code: httpStatusForError(error),
        data: { error: extractErrorMessage(error) },
      });
    }
  },
);
