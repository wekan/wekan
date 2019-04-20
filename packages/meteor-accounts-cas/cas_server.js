"use strict";

const Fiber = Npm.require('fibers');
const https = Npm.require('https');
const url = Npm.require('url');
const xmlParser = Npm.require('xml2js');

// Library
class CAS {
  constructor(options) {
    options = options || {};

    if (!options.validate_url) {
      throw new Error('Required CAS option `validateUrl` missing.');
    }

    if (!options.service) {
      throw new Error('Required CAS option `service` missing.');
    }

    const cas_url = url.parse(options.validate_url);
    if (cas_url.protocol != 'https:' ) {
      throw new Error('Only https CAS servers are supported.');
    } else if (!cas_url.hostname) {
      throw new Error('Option `validateUrl` must be a valid url like: https://example.com/cas/serviceValidate');
    } else {
      this.hostname = cas_url.host;
      this.port = 443;// Should be 443 for https
      this.validate_path = cas_url.pathname;
    }

    this.service = options.service;
  }

  validate(ticket, callback) {
    const httparams = {
      host: this.hostname,
      port: this.port,
      path: url.format({
        pathname: this.validate_path,
        query: {ticket: ticket, service: this.service},
      }),
    };

    https.get(httparams, (res) => {
      res.on('error', (e) => {
        console.log('error' + e);
        callback(e);
      });

      // Read result
      res.setEncoding('utf8');
      let response = '';
      res.on('data', (chunk) => {
        response += chunk;
      });

      res.on('end', (error) => {
        if (error) {
          console.log('error callback');
          console.log(error);
          callback(undefined, false);
        } else {
          xmlParser.parseString(response, (err, result) => {
            if (err) {
              console.log('Bad response format.');
              callback({message: 'Bad response format. XML could not parse it'});
            } else {
              if (result['cas:serviceResponse'] == null) {
                console.log('Empty response.');
                callback({message: 'Empty response.'});
              }
              if (result['cas:serviceResponse']['cas:authenticationSuccess']) {
                var userData = {
                  id: result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:user'][0].toLowerCase(),
                }
                const attributes = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attributes'][0];
                for (var fieldName in attributes) {
                  userData[fieldName] = attributes[fieldName][0];
                };
                callback(undefined, true, userData);
              } else {
                callback(undefined, false);
              }
            }
          });
        }
      });
    });
  }
}
////// END OF CAS MODULE

let _casCredentialTokens = {};
let _userData = {};

//RoutePolicy.declare('/_cas/', 'network');

// Listen to incoming OAuth http requests
WebApp.connectHandlers.use((req, res, next) => {
  // Need to create a Fiber since we're using synchronous http calls and nothing
  // else is wrapping this in a fiber automatically

  Fiber(() => {
    middleware(req, res, next);
  }).run();
});

const middleware = (req, res, next) => {
  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  try {
    urlParsed = url.parse(req.url, true);

    // Getting the ticket (if it's defined in GET-params)
    // If no ticket, then request will continue down the default
    // middlewares.
    const query = urlParsed.query;
    if (query == null) {
      next();
      return;
    }
    const ticket = query.ticket;
    if (ticket == null) {
      next();
      return;
    }

    const serviceUrl = Meteor.absoluteUrl(urlParsed.href.replace(/^\//g, '')).replace(/([&?])ticket=[^&]+[&]?/g, '$1').replace(/[?&]+$/g, '');
    const redirectUrl = serviceUrl;//.replace(/([&?])casToken=[^&]+[&]?/g, '$1').replace(/[?&]+$/g, '');

    // get auth token
    const credentialToken = query.casToken;
    if (!credentialToken) {
      end(res, redirectUrl);
      return;
    }

    // validate ticket
    casValidate(req, ticket, credentialToken, serviceUrl, () => {
      end(res, redirectUrl);
    });

  } catch (err) {
    console.log("account-cas: unexpected error : " + err.message);
    end(res, redirectUrl);
  }
};

const casValidate = (req, ticket, token, service, callback) => {
  // get configuration
  if (!Meteor.settings.cas/* || !Meteor.settings.cas.validate*/) {
    throw new Error('accounts-cas: unable to get configuration.');
  }

  const cas = new CAS({
    validate_url: Meteor.settings.cas.validateUrl,
    service: service,
    version: Meteor.settings.cas.casVersion
  });

  cas.validate(ticket, (err, status, userData) => {
    if (err) {
      console.log("accounts-cas: error when trying to validate " + err);
      console.log(err);
    } else {
      if (status) {
        console.log(`accounts-cas: user validated ${userData.id}
          (${JSON.stringify(userData)})`);
        _casCredentialTokens[token] = { id: userData.id };
        _userData = userData;
      } else {
        console.log("accounts-cas: unable to validate " + ticket);
      }
    }
    callback();
  });

  return;
};

/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 */
 Accounts.registerLoginHandler((options) => {
  if (!options.cas)
    return undefined;

  if (!_hasCredential(options.cas.credentialToken)) {
    throw new Meteor.Error(Accounts.LoginCancelledError.numericError,
      'no matching login attempt found');
  }

  const result = _retrieveCredential(options.cas.credentialToken);

  const attrs = Meteor.settings.cas.attributes || {};
  // CAS keys
  const fn = attrs.firstname || 'cas:givenName';
  const ln = attrs.lastname || 'cas:sn';
  const full = attrs.fullname;
  const mail = attrs.mail || 'cas:mail'; // or 'email'
  const uid = attrs.id || 'id';
  if (attrs.debug) {
    if (full) {
      console.log(`CAS fields : id:"${uid}", fullname:"${full}", mail:"${mail}"`);
    } else {
      console.log(`CAS fields : id:"${uid}", firstname:"${fn}", lastname:"${ln}", mail:"${mail}"`);
    }
  }
  const name = full ? _userData[full] : _userData[fn] + ' ' +  _userData[ln];
  // https://docs.meteor.com/api/accounts.html#Meteor-users
  options = {
    // _id: Meteor.userId()
    username: _userData[uid], // Unique name
    emails: [
      { address: _userData[mail], verified: true }
    ],
    createdAt: new Date(),
    profile: {
      // The profile is writable by the user by default.
      name: name,
      fullname : name,
      email : _userData[mail]
    },
    active: true,
    globalRoles: ['user']
  };
  if (attrs.debug) {
    console.log(`CAS response : ${JSON.stringify(result)}`);
  }
  let user = Meteor.users.findOne({ 'username': options.username });
  if (! user) {
    if (attrs.debug) {
      console.log(`Creating user account ${JSON.stringify(options)}`);
    }
    const userId = Accounts.insertUserDoc({}, options);
    user = Meteor.users.findOne(userId);
  }
  if (attrs.debug) {
    console.log(`Using user account ${JSON.stringify(user)}`);
  }
  return { userId: user._id };
});

const _hasCredential = (credentialToken) => {
  return _.has(_casCredentialTokens, credentialToken);
}

/*
 * Retrieve token and delete it to avoid replaying it.
 */
const _retrieveCredential = (credentialToken) => {
  const result = _casCredentialTokens[credentialToken];
  delete _casCredentialTokens[credentialToken];
  return result;
}

const closePopup = (res) => {
  if (Meteor.settings.cas && Meteor.settings.cas.popup == false) {
    return;
  }
  res.writeHead(200, {'Content-Type': 'text/html'});
  const content = '<html><body><div id="popupCanBeClosed"></div></body></html>';
  res.end(content, 'utf-8');
}

const redirect = (res, whereTo) => {
  res.writeHead(302, {'Location': whereTo});
  const content = '<html><head><meta http-equiv="refresh" content="0; url='+whereTo+'" /></head><body>Redirection to <a href='+whereTo+'>'+whereTo+'</a></body></html>';
  res.end(content, 'utf-8');
  return
}

const end = (res, whereTo) => {
  if (Meteor.settings.cas && Meteor.settings.cas.popup == false) {
    redirect(res, whereTo);
  } else {
    closePopup(res);
  }
}
