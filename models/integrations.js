import { ReactiveCache } from '/imports/reactiveCache';

Integrations = new Mongo.Collection('integrations');

/**
 * Integration with third-party applications
 */
Integrations.attachSchema(
  new SimpleSchema({
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
    url: {
      // URL validation with SSRF protection
      /**
       * URL validation regex (https://mathiasbynens.be/demo/url-regex)
       * Includes validation to block private/loopback addresses and ensure safe protocols
       */
      type: String,
      custom() {
        try {
          const u = new URL(this.value);

          // Only allow http and https protocols
          if (!['http:', 'https:'].includes(u.protocol)) {
            return 'invalidProtocol';
          }

          // Block private/loopback IP ranges and hostnames
          const hostname = u.hostname.toLowerCase();
          const blockedPatterns = [
            /^127\./, // 127.x.x.x (loopback)
            /^10\./, // 10.x.x.x (private)
            /^172\.(1[6-9]|2\d|3[01])\./, // 172.16-31.x.x (private)
            /^192\.168\./, // 192.168.x.x (private)
            /^0\./, // 0.x.x.x (current network)
            /^::1$/, // IPv6 loopback
            /^fe80:/, // IPv6 link-local
            /^fc00:/, // IPv6 unique local
            /^fd00:/, // IPv6 unique local
            /^localhost$/i,
            /\.local$/i,
            /^169\.254\./, // link-local IP
          ];

          if (blockedPatterns.some(pattern => pattern.test(hostname))) {
            return 'privateAddress';
          }
        } catch {
          return 'invalidUrl';
        }
      },
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
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      denyUpdate: false,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
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
  }),
);
Integrations.Const = {
  GLOBAL_WEBHOOK_ID: '_global',
  ONEWAY: 'outgoing-webhooks',
  TWOWAY: 'bidirectional-webhooks',
  get WEBHOOK_TYPES() {
    return [this.ONEWAY, this.TWOWAY];
  },
};
const permissionHelper = {
  allow(userId, doc) {
    const user = Meteor.users.findOne(userId);
    const isAdmin = user && user.isAdmin;
    return isAdmin || allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
};
Integrations.allow({
  insert(userId, doc) {
    return permissionHelper.allow(userId, doc);
  },
  update(userId, doc) {
    return permissionHelper.allow(userId, doc);
  },
  remove(userId, doc) {
    return permissionHelper.allow(userId, doc);
  },
  fetch: ['boardId'],
});

//INTEGRATIONS REST API
if (Meteor.isServer) {
  Meteor.startup(async () => {
    await Integrations._collection.createIndexAsync({ modifiedAt: -1 });
    await Integrations._collection.createIndexAsync({ boardId: 1 });
  });

  /**
   * @operation get_all_integrations
   * @summary Get all integrations in board
   *
   * @param {string} boardId the board ID
   * @return_type [Integrations]
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/integrations', async function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      const data = (await ReactiveCache.getIntegrations(
        { boardId: paramBoardId },
        { fields: { token: 0 } },
      )).map(function(doc) {
        return doc;
      });

      JsonRoutes.sendResult(res, { code: 200, data });
    } catch (error) {
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
  JsonRoutes.add('GET', '/api/boards/:boardId/integrations/:intId', async function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      const paramIntId = req.params.intId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: await ReactiveCache.getIntegration(
          { _id: paramIntId, boardId: paramBoardId },
          { fields: { token: 0 } },
        ),
      });
    } catch (error) {
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
  JsonRoutes.add('POST', '/api/boards/:boardId/integrations', async function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      await Authentication.checkBoardAdmin(req.userId, paramBoardId);

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
    } catch (error) {
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
  JsonRoutes.add('PUT', '/api/boards/:boardId/integrations/:intId', async function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      const paramIntId = req.params.intId;
      await Authentication.checkBoardAdmin(req.userId, paramBoardId);

      if (req.body.hasOwnProperty('enabled')) {
        const newEnabled = req.body.enabled;
        Integrations.direct.update(
          { _id: paramIntId, boardId: paramBoardId },
          { $set: { enabled: newEnabled } },
        );
      }
      if (req.body.hasOwnProperty('title')) {
        const newTitle = req.body.title;
        Integrations.direct.update(
          { _id: paramIntId, boardId: paramBoardId },
          { $set: { title: newTitle } },
        );
      }
      if (req.body.hasOwnProperty('url')) {
        const newUrl = req.body.url;
        Integrations.direct.update(
          { _id: paramIntId, boardId: paramBoardId },
          { $set: { url: newUrl } },
        );
      }
      if (req.body.hasOwnProperty('token')) {
        const newToken = req.body.token;
        Integrations.direct.update(
          { _id: paramIntId, boardId: paramBoardId },
          { $set: { token: newToken } },
        );
      }
      if (req.body.hasOwnProperty('activities')) {
        const newActivities = req.body.activities;
        Integrations.direct.update(
          { _id: paramIntId, boardId: paramBoardId },
          { $set: { activities: newActivities } },
        );
      }

      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramIntId,
        },
      });
    } catch (error) {
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
  JsonRoutes.add(
    'DELETE',
    '/api/boards/:boardId/integrations/:intId/activities',
    async function(req, res) {
      try {
        const paramBoardId = req.params.boardId;
        const paramIntId = req.params.intId;
        const newActivities = req.body.activities;
        await Authentication.checkBoardAdmin(req.userId, paramBoardId);

        Integrations.direct.update(
          { _id: paramIntId, boardId: paramBoardId },
          { $pullAll: { activities: newActivities } },
        );

        JsonRoutes.sendResult(res, {
          code: 200,
          data: await ReactiveCache.getIntegration(
            { _id: paramIntId, boardId: paramBoardId },
            { fields: { _id: 1, activities: 1 } },
          ),
        });
      } catch (error) {
        JsonRoutes.sendResult(res, {
          code: 200,
          data: error,
        });
      }
    },
  );

  /**
   * @operation new_integration_activities
   * @summary Add subscribed activities
   *
   * @param {string} boardId the board ID
   * @param {string} intId the integration ID
   * @param {string} newActivities the activities to add to the integration
   * @return_type Integrations
   */
  JsonRoutes.add(
    'POST',
    '/api/boards/:boardId/integrations/:intId/activities',
    async function(req, res) {
      try {
        const paramBoardId = req.params.boardId;
        const paramIntId = req.params.intId;
        const newActivities = req.body.activities;
        await Authentication.checkBoardAdmin(req.userId, paramBoardId);

        Integrations.direct.update(
          { _id: paramIntId, boardId: paramBoardId },
          { $addToSet: { activities: { $each: newActivities } } },
        );

        JsonRoutes.sendResult(res, {
          code: 200,
          data: await ReactiveCache.getIntegration(
            { _id: paramIntId, boardId: paramBoardId },
            { fields: { _id: 1, activities: 1 } },
          ),
        });
      } catch (error) {
        JsonRoutes.sendResult(res, {
          code: 200,
          data: error,
        });
      }
    },
  );

  /**
   * @operation delete_integration
   * @summary Delete integration
   *
   * @param {string} boardId the board ID
   * @param {string} intId the integration ID
   * @return_type {_id: string}
   */
  JsonRoutes.add('DELETE', '/api/boards/:boardId/integrations/:intId', async function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      const paramIntId = req.params.intId;
      await Authentication.checkBoardAdmin(req.userId, paramBoardId);

      Integrations.direct.remove({ _id: paramIntId, boardId: paramBoardId });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramIntId,
        },
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });
}

export default Integrations;
