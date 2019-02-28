Integrations = new Mongo.Collection('integrations');

/**
 * Integration with third-party applications
 */
Integrations.attachSchema(new SimpleSchema({
  enabled: {
    /**
     * is the integration enabled?
     */
    type: Boolean,
    defaultValue: true,
  },
  title: {
    /**
     * name of the integration
     */
    type: String,
    optional: true,
  },
  type: {
    /**
     * type of the integratation (Default to 'outgoing-webhooks')
     */
    type: String,
    defaultValue: 'outgoing-webhooks',
  },
  activities: {
    /**
     * activities the integration gets triggered (list)
     */
    type: [String],
    defaultValue: ['all'],
  },
  url: { // URL validation regex (https://mathiasbynens.be/demo/url-regex)
    /**
     * URL validation regex (https://mathiasbynens.be/demo/url-regex)
     */
    type: String,
  },
  token: {
    /**
     * token of the integration
     */
    type: String,
    optional: true,
  },
  boardId: {
    /**
     * Board ID of the integration
     */
    type: String,
  },
  createdAt: {
    /**
     * Creation date of the integration
     */
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
    /**
     * user ID who created the interation
     */
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
  Meteor.startup(() => {
    Integrations._collection._ensureIndex({ boardId: 1 });
  });

  /**
   * @operation get_all_integrations
   * @summary Get all integrations in board
   *
   * @param {string} boardId the board ID
   * @return_type [Integrations]
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/integrations', function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      const data = Integrations.find({ boardId: paramBoardId }, { fields: { token: 0 } }).map(function(doc) {
        return doc;
      });

      JsonRoutes.sendResult(res, {code: 200, data});
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation get_integration
   * @summary Get a single integration in board
   *
   * @param {string} boardId the board ID
   * @param {string} intId the integration ID
   * @return_type Integrations
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/integrations/:intId', function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramIntId = req.params.intId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: Integrations.findOne({ _id: paramIntId, boardId: paramBoardId }, { fields: { token: 0 } }),
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation new_integration
   * @summary Create a new integration
   *
   * @param {string} boardId the board ID
   * @param {string} url the URL of the integration
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/integrations', function(req, res) {
    try {
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
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation edit_integration
   * @summary Edit integration data
   *
   * @param {string} boardId the board ID
   * @param {string} intId the integration ID
   * @param {string} [enabled] is the integration enabled?
   * @param {string} [title] new name of the integration
   * @param {string} [url] new URL of the integration
   * @param {string} [token] new token of the integration
   * @param {string} [activities] new list of activities of the integration
   * @return_type {_id: string}
   */
  JsonRoutes.add('PUT', '/api/boards/:boardId/integrations/:intId', function (req, res) {
    try {
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
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation delete_integration_activities
   * @summary Delete subscribed activities
   *
   * @param {string} boardId the board ID
   * @param {string} intId the integration ID
   * @param {string} newActivities the activities to remove from the integration
   * @return_type Integrations
   */
  JsonRoutes.add('DELETE', '/api/boards/:boardId/integrations/:intId/activities', function (req, res) {
    try {
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
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation new_integration_activities
   * @summary Add subscribed activities
   *
   * @param {string} boardId the board ID
   * @param {string} intId the integration ID
   * @param {string} newActivities the activities to add to the integration
   * @return_type Integrations
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/integrations/:intId/activities', function (req, res) {
    try {
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
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation delete_integration
   * @summary Delete integration
   *
   * @param {string} boardId the board ID
   * @param {string} intId the integration ID
   * @return_type {_id: string}
   */
  JsonRoutes.add('DELETE', '/api/boards/:boardId/integrations/:intId', function (req, res) {
    try {
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
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });
}
