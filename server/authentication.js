import Fiber from 'fibers';

Meteor.startup(() => {

  // Node Fibers 100% CPU usage issue
  // https://github.com/wekan/wekan-mongodb/issues/2#issuecomment-381453161
  // https://github.com/meteor/meteor/issues/9796#issuecomment-381676326
  // https://github.com/sandstorm-io/sandstorm/blob/0f1fec013fe7208ed0fd97eb88b31b77e3c61f42/shell/server/00-startup.js#L99-L129
  Fiber.poolSize = 1e9;

  Accounts.validateLoginAttempt(function (options) {
    const user = options.user || {};
    return !user.loginDisabled;
  });

  Authentication = {};

  Authentication.checkUserId = function (userId) {
    if (userId === undefined) {
      // Monkey patch to work around the problem described in
      // https://github.com/sandstorm-io/meteor-accounts-sandstorm/pull/31
      const _httpMethods = HTTP.methods;
      HTTP.methods = (newMethods) => {
        Object.keys(newMethods).forEach((key) =>  {
          if (newMethods[key].auth) {
            newMethods[key].auth = function() {
              const sandstormID = this.req.headers['x-sandstorm-user-id'];
              const user = Meteor.users.findOne({'services.sandstorm.id': sandstormID});
              if (user) {
                userId = user._id;
              }
              //return user && user._id;
            };
          }
        });
        _httpMethods(newMethods);
      };
    }

    if (userId === undefined) {
      const error = new Meteor.Error('Unauthorized', 'Unauthorized');
      error.statusCode = 401;
      throw error;
    }
    const admin = Users.findOne({ _id: userId, isAdmin: true });

    if (admin === undefined) {
      const error = new Meteor.Error('Forbidden', 'Forbidden');
      error.statusCode = 403;
      throw error;
    }

  };

  // This will only check if the user is logged in.
  // The authorization checks for the user will have to be done inside each API endpoint
  Authentication.checkLoggedIn = function(userId) {
    if(userId === undefined) {
      const error = new Meteor.Error('Unauthorized', 'Unauthorized');
      error.statusCode = 401;
      throw error;
    }
  };

  // An admin should be authorized to access everything, so we use a separate check for admins
  // This throws an error if otherReq is false and the user is not an admin
  Authentication.checkAdminOrCondition = function(userId, otherReq) {
    if(otherReq) return;
    const admin = Users.findOne({ _id: userId, isAdmin: true });
    if (admin === undefined) {
      const error = new Meteor.Error('Forbidden', 'Forbidden');
      error.statusCode = 403;
      throw error;
    }
  };

  // Helper function. Will throw an error if the user does not have read only access to the given board
  Authentication.checkBoardAccess = function(userId, boardId) {
    Authentication.checkLoggedIn(userId);

    const board = Boards.findOne({ _id: boardId });
    const normalAccess = board.permission === 'public' || board.members.some((e) => e.userId === userId);
    Authentication.checkAdminOrCondition(userId, normalAccess);
  };

  if (Meteor.isServer) {
    if(process.env.OAUTH2_CLIENT_ID !== '') {

      ServiceConfiguration.configurations.upsert( // eslint-disable-line no-undef
        { service: 'oidc' },
        {
          $set: {
            loginStyle: 'redirect',
            clientId: process.env.OAUTH2_CLIENT_ID,
            secret: process.env.OAUTH2_SECRET,
            serverUrl: process.env.OAUTH2_SERVER_URL,
            authorizationEndpoint: process.env.OAUTH2_AUTH_ENDPOINT,
            userinfoEndpoint: process.env.OAUTH2_USERINFO_ENDPOINT,
            tokenEndpoint: process.env.OAUTH2_TOKEN_ENDPOINT,
            idTokenWhitelistFields: [],
            requestPermissions: ['openid'],
          },
        }
      );
    }
  }

});

