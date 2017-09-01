Integrations = new Mongo.Collection('integrations');

Integrations.attachSchema(new SimpleSchema({
  enabled: {
    type: Boolean,
    defaultValue: true,
  },
  title: {
    type: String,
    optional: true,
  },
  type: {
    type: String,
    defaultValue: 'outgoing-webhooks',
  },
  activities: {
    type: [String],
    defaultValue: ['all'],
  },
  url: { // URL validation regex (https://mathiasbynens.be/demo/url-regex)
    type: String,
  },
  token: {
    type: String,
    optional: true,
  },
  boardId: {
    type: String,
  },
  createdAt: {
    type: Date,
    denyUpdate: false,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
  userId: {
    type: String,
  },
}));

Integrations.allow({
  insert(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

//INTEGRATIONS REST API
if (Meteor.isServer) {
  // Get all integrations in board
  JsonRoutes.add('GET', '/api/boards/:boardId/integrations', function(req, res, next) {
    const paramBoardId = req.params.boardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    const data = Integrations.find({ boardId: paramBoardId }, { fields: { token: 0 } }).map(function(doc) {
      return doc;
    });

    JsonRoutes.sendResult(res, {code: 200, data});
  });

  // Get a single integration in board
  JsonRoutes.add('GET', '/api/boards/:boardId/integrations/:intId', function(req, res, next) {
    const paramBoardId = req.params.boardId;
    const paramIntId = req.params.intId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    JsonRoutes.sendResult(res, {
      code: 200,
      data: Integrations.findOne({ _id: paramIntId, boardId: paramBoardId }, { fields: { token: 0 } }),
    });
  });

  // Create a new integration
  JsonRoutes.add('POST', '/api/boards/:boardId/integrations', function(req, res, next) {
    const paramBoardId = req.params.boardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    const id = Integrations.insert({
      userId: req.userId,
      boardId: paramBoardId,
      url: req.body.url,
    });

    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  });

  // Edit integration data
  JsonRoutes.add('PUT', '/api/boards/:boardId/integrations/:intId', function (req, res, next) {
    const paramBoardId = req.params.boardId;
    const paramIntId = req.params.intId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    if (req.body.hasOwnProperty('enabled')) {
      const newEnabled = req.body.enabled;
      Integrations.direct.update({_id: paramIntId, boardId: paramBoardId},
        {$set: {enabled: newEnabled}});
    }
    if (req.body.hasOwnProperty('title')) {
      const newTitle = req.body.title;
      Integrations.direct.update({_id: paramIntId, boardId: paramBoardId},
        {$set: {title: newTitle}});
    }
    if (req.body.hasOwnProperty('url')) {
      const newUrl = req.body.url;
      Integrations.direct.update({_id: paramIntId, boardId: paramBoardId},
        {$set: {url: newUrl}});
    }
    if (req.body.hasOwnProperty('token')) {
      const newToken = req.body.token;
      Integrations.direct.update({_id: paramIntId, boardId: paramBoardId},
        {$set: {token: newToken}});
    }
    if (req.body.hasOwnProperty('activities')) {
      const newActivities = req.body.activities;
      Integrations.direct.update({_id: paramIntId, boardId: paramBoardId},
        {$set: {activities: newActivities}});
    }

    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramIntId,
      },
    });
  });

  // Delete subscribed activities
  JsonRoutes.add('DELETE', '/api/boards/:boardId/integrations/:intId/activities', function (req, res, next) {
    const paramBoardId = req.params.boardId;
    const paramIntId = req.params.intId;
    const newActivities = req.body.activities;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    Integrations.direct.update({_id: paramIntId, boardId: paramBoardId},
      {$pullAll: {activities: newActivities}});

    JsonRoutes.sendResult(res, {
      code: 200,
      data: Integrations.findOne({_id: paramIntId, boardId: paramBoardId}, { fields: {_id: 1, activities: 1}}),
    });
  });

  // Add subscribed activities
  JsonRoutes.add('POST', '/api/boards/:boardId/integrations/:intId/activities', function (req, res, next) {
    const paramBoardId = req.params.boardId;
    const paramIntId = req.params.intId;
    const newActivities = req.body.activities;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    Integrations.direct.update({_id: paramIntId, boardId: paramBoardId},
      {$addToSet: {activities: { $each: newActivities}}});

    JsonRoutes.sendResult(res, {
      code: 200,
      data: Integrations.findOne({_id: paramIntId, boardId: paramBoardId}, { fields: {_id: 1, activities: 1}}),
    });
  });

  // Delete integration
  JsonRoutes.add('DELETE', '/api/boards/:boardId/integrations/:intId', function (req, res, next) {
    const paramBoardId = req.params.boardId;
    const paramIntId = req.params.intId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    Integrations.direct.remove({_id: paramIntId, boardId: paramBoardId});
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramIntId,
      },
    });
  });
}
