import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import CardComments from '/models/cardComments';

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
  await CardComments._collection.createIndexAsync({ modifiedAt: -1 });
  await CardComments._collection.createIndexAsync({ cardId: 1, createdAt: -1 });
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
    Authentication.checkBoardAccess(req.userId, paramBoardId);
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
      code: 200,
      data: error,
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
      Authentication.checkBoardAccess(req.userId, paramBoardId);
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
        code: 200,
        data: error,
      });
    }
  },
);

WebApp.handlers.post('/api/boards/:boardId/cards/:cardId/comments', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    const id = await CardComments.direct.insertAsync({
      userId: req.userId,
      text: req.body.comment,
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
      code: 200,
      data: error,
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
      Authentication.checkBoardAccess(req.userId, paramBoardId);
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
        code: 200,
        data: error,
      });
    }
  },
);
