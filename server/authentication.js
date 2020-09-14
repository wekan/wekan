import Fiber from 'fibers';

Meteor.startup(() => {
  // Node Fibers 100% CPU usage issue
  // https://github.com/wekan/wekan-mongodb/issues/2#issuecomment-381453161
  // https://github.com/meteor/meteor/issues/9796#issuecomment-381676326
  // https://github.com/sandstorm-io/sandstorm/blob/0f1fec013fe7208ed0fd97eb88b31b77e3c61f42/shell/server/00-startup.js#L99-L129
  Fiber.poolSize = 1e9;

  Accounts.validateLoginAttempt(function(options) {
    const user = options.user || {};
    return !user.loginDisabled;
  });

  Authentication = {};

  Authentication.checkUserId = function(userId) {
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
    if (userId === undefined) {
      const error = new Meteor.Error('Unauthorized', 'Unauthorized');
      error.statusCode = 401;
      throw error;
    }
  };

  // An admin should be authorized to access everything, so we use a separate check for admins
  // This throws an error if otherReq is false and the user is not an admin
  Authentication.checkAdminOrCondition = function(userId, otherReq) {
    if (otherReq) return;
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
    const normalAccess =
      board.permission === 'public' ||
      board.members.some(e => e.userId === userId && e.isActive);
    Authentication.checkAdminOrCondition(userId, normalAccess);
  };

  if (Meteor.isServer) {
    if (
      process.env.OAUTH2_ENABLED === 'true' ||
      process.env.OAUTH2_ENABLED === true
    ) {
      ServiceConfiguration.configurations.upsert(
        // eslint-disable-line no-undef
        { service: 'oidc' },
        {
          $set: {
            loginStyle: process.env.OAUTH2_LOGIN_STYLE,
            clientId: process.env.OAUTH2_CLIENT_ID,
            secret: process.env.OAUTH2_SECRET,
            serverUrl: process.env.OAUTH2_SERVER_URL,
            authorizationEndpoint: process.env.OAUTH2_AUTH_ENDPOINT,
            userinfoEndpoint: process.env.OAUTH2_USERINFO_ENDPOINT,
            tokenEndpoint: process.env.OAUTH2_TOKEN_ENDPOINT,
            idTokenWhitelistFields:
              process.env.OAUTH2_ID_TOKEN_WHITELIST_FIELDS || [],
            requestPermissions: process.env.OAUTH2_REQUEST_PERMISSIONS,
          },
          // OAUTH2_ID_TOKEN_WHITELIST_FIELDS || [],
          // OAUTH2_REQUEST_PERMISSIONS || 'openid profile email',
        },
      );
    }
  } else if (
    process.env.CAS_ENABLED === 'true' ||
    process.env.CAS_ENABLED === true
  ) {
    ServiceConfiguration.configurations.upsert(
      // eslint-disable-line no-undef
      { service: 'cas' },
      {
        $set: {
          baseUrl: process.env.CAS_BASE_URL,
          loginUrl: process.env.CAS_LOGIN_URL,
          serviceParam: 'service',
          popupWidth: 810,
          popupHeight: 610,
          popup: true,
          autoClose: true,
          validateUrl: process.env.CASE_VALIDATE_URL,
          casVersion: 3.0,
          attributes: {
            debug: process.env.DEBUG,
          },
        },
      },
    );
  } else if (
    process.env.SAML_ENABLED === 'true' ||
    process.env.SAML_ENABLED === true
  ) {
    ServiceConfiguration.configurations.upsert(
      // eslint-disable-line no-undef
      { service: 'saml' },
      {
        $set: {
          provider: process.env.SAML_PROVIDER,
          entryPoint: process.env.SAML_ENTRYPOINT,
          issuer: process.env.SAML_ISSUER,
          cert: process.env.SAML_CERT,
          idpSLORedirectURL: process.env.SAML_IDPSLO_REDIRECTURL,
          privateKeyFile: process.env.SAML_PRIVATE_KEYFILE,
          publicCertFile: process.env.SAML_PUBLIC_CERTFILE,
          identifierFormat: process.env.SAML_IDENTIFIER_FORMAT,
          localProfileMatchAttribute:
            process.env.SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE,
          attributesSAML: process.env.SAML_ATTRIBUTES || [
            'sn',
            'givenName',
            'mail',
          ],

          /*
          settings = {"saml":[{
            "provider":"openam",
            "entryPoint":"https://openam.idp.io/openam/SSORedirect/metaAlias/zimt/idp",
            "issuer": "https://sp.zimt.io/", //replace with url of your app
            "cert":"MIICizCCAfQCCQCY8tKaMc0 LOTS OF FUNNY CHARS ==",
            "idpSLORedirectURL": "http://openam.idp.io/openam/IDPSloRedirect/metaAlias/zimt/idp",
             "privateKeyFile": "certs/mykey.pem",  // path is relative to $METEOR-PROJECT/private
             "publicCertFile": "certs/mycert.pem",  // eg $METEOR-PROJECT/private/certs/mycert.pem
             "dynamicProfile": true // set to true if we want to create a user in Meteor.users dynamically if SAML assertion is valid
             "identifierFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified", // Defaults to urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress
             "localProfileMatchAttribute": "telephoneNumber" // CAUTION: this will be mapped to profile.<localProfileMatchAttribute> attribute in Mongo if identifierFormat (see above) differs from urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress,
             "attributesSAML": [telephoneNumber, sn, givenName, mail], // attrs from SAML attr statement, which will be used for local Meteor profile creation. Currently no real attribute mapping. If required use mapping on IdP side.
          }]}
          */
        },
      },
    );
  }
});
