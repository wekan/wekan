import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Integrations from '/models/integrations';

Meteor.startup(async () => {
  await Integrations._collection.createIndexAsync({ modifiedAt: -1 });
  await Integrations._collection.createIndexAsync({ boardId: 1 });
});

WebApp.handlers.get('/api/boards/:boardId/integrations', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    const data = (await ReactiveCache.getIntegrations(
      { boardId: paramBoardId },
      { fields: { token: 0 } },
    )).map(function(doc) {
      return doc;
    });

    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.get('/api/boards/:boardId/integrations/:intId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramIntId = req.params.intId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    sendJsonResult(res, {
      code: 200,
      data: await ReactiveCache.getIntegration(
        { _id: paramIntId, boardId: paramBoardId },
        { fields: { token: 0 } },
      ),
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.post('/api/boards/:boardId/integrations', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    await Authentication.checkBoardAdmin(req.userId, paramBoardId);

    const id = await Integrations.insertAsync({
      userId: req.userId,
      boardId: paramBoardId,
      url: req.body.url,
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

WebApp.handlers.put('/api/boards/:boardId/integrations/:intId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramIntId = req.params.intId;
    await Authentication.checkBoardAdmin(req.userId, paramBoardId);

    if (req.body.hasOwnProperty('enabled')) {
      await Integrations.direct.updateAsync(
        { _id: paramIntId, boardId: paramBoardId },
        { $set: { enabled: req.body.enabled } },
      );
    }
    if (req.body.hasOwnProperty('title')) {
      await Integrations.direct.updateAsync(
        { _id: paramIntId, boardId: paramBoardId },
        { $set: { title: req.body.title } },
      );
    }
    if (req.body.hasOwnProperty('url')) {
      await Integrations.direct.updateAsync(
        { _id: paramIntId, boardId: paramBoardId },
        { $set: { url: req.body.url } },
      );
    }
    if (req.body.hasOwnProperty('token')) {
      await Integrations.direct.updateAsync(
        { _id: paramIntId, boardId: paramBoardId },
        { $set: { token: req.body.token } },
      );
    }
    if (req.body.hasOwnProperty('activities')) {
      await Integrations.direct.updateAsync(
        { _id: paramIntId, boardId: paramBoardId },
        { $set: { activities: req.body.activities } },
      );
    }

    sendJsonResult(res, {
      code: 200,
      data: {
        _id: paramIntId,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.delete(
  '/api/boards/:boardId/integrations/:intId/activities',
  async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramIntId = req.params.intId;
      const newActivities = req.body.activities;
      await Authentication.checkBoardAdmin(req.userId, paramBoardId);

      await Integrations.direct.updateAsync(
        { _id: paramIntId, boardId: paramBoardId },
        { $pullAll: { activities: newActivities } },
      );

      sendJsonResult(res, {
        code: 200,
        data: await ReactiveCache.getIntegration(
          { _id: paramIntId, boardId: paramBoardId },
          { fields: { _id: 1, activities: 1 } },
        ),
      });
    } catch (error) {
      sendJsonResult(res, {
        code: 200,
        data: error,
      });
    }
  },
);

WebApp.handlers.post(
  '/api/boards/:boardId/integrations/:intId/activities',
  async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramIntId = req.params.intId;
      const newActivities = req.body.activities;
      await Authentication.checkBoardAdmin(req.userId, paramBoardId);

      await Integrations.direct.updateAsync(
        { _id: paramIntId, boardId: paramBoardId },
        { $addToSet: { activities: { $each: newActivities } } },
      );

      sendJsonResult(res, {
        code: 200,
        data: await ReactiveCache.getIntegration(
          { _id: paramIntId, boardId: paramBoardId },
          { fields: { _id: 1, activities: 1 } },
        ),
      });
    } catch (error) {
      sendJsonResult(res, {
        code: 200,
        data: error,
      });
    }
  },
);

WebApp.handlers.delete('/api/boards/:boardId/integrations/:intId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramIntId = req.params.intId;
    await Authentication.checkBoardAdmin(req.userId, paramBoardId);

    await Integrations.direct.removeAsync({ _id: paramIntId, boardId: paramBoardId });
    sendJsonResult(res, {
      code: 200,
      data: {
        _id: paramIntId,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});
