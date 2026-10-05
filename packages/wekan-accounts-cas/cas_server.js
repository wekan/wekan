"use strict";

import https from 'https';
import { URL } from 'url';
import { validationUrl, callbackUrl, casStateCookie } from './cas_url';
import xml2js from 'xml2js';
import { isCasGroupAllowed } from './groupPolicy';

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

    this.validateUrl = validationUrl(options.validate_url);

    this.service = options.service;
  }

  validate(ticket, callback) {
    const requestUrl = new URL(this.validateUrl);
    requestUrl.searchParams.set('ticket', ticket);
    requestUrl.searchParams.set('service', this.service);
    https.get(requestUrl, (res) => {
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
          xml2js.parseString(response, (err, result) => {
            if (err) {
              console.log('Bad response format.');
              callback({message: 'Bad response format. XML could not parse it'});
            } else {
              if (result['cas:serviceResponse'] == null) {
                console.log('Empty response.');
                return callback({message: 'Empty response.'});
              }
              if (result['cas:serviceResponse']['cas:authenticationSuccess']) {
                const userData = {
                  id: result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:user'][0].toLowerCase(),
                };
                const attributes = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attributes']?.[0] || {};

                // Check allowed ldap groups if exist (array only)
                // example cas settings : "allowedLdapGroups" : ["wekan", "admin"],
                if (!isCasGroupAllowed(Meteor.settings.cas.allowedLdapGroups, attributes['cas:memberOf'])) {
                  try {
                    if (typeof global.__wekanTripCanary === 'function') {
                      global.__wekanTripCanary('cas.group-denied');
                    }
                  } catch (e) { /* logging must never break the guard */ }
                  return callback({message: 'Group not allowed.'}, false);
                }
                for (const fieldName in attributes) {
                  userData[fieldName] = attributes[fieldName][0];
                }
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

//RoutePolicy.declare('/_cas/', 'network');

// Listen to incoming OAuth http requests
WebApp.handlers.use((req, res, next) => {
  middleware(req, res, next);
});

const middleware = (req, res, next) => {
  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  let redirectUrl;
  try {
    const callback = callbackUrl(req.url, Meteor.absoluteUrl());
    if (!callback) {
      next();
      return;
    }
    // An instance without CAS has no callback to answer; a `ticket` query
    // parameter belongs to whatever route it was sent to.
    if (!Meteor.settings.cas) {
      next();
      return;
    }
    const { ticket, credentialToken, serviceUrl } = callback;
    redirectUrl = serviceUrl;

    if (!credentialToken) {
      end(res, redirectUrl);
      return;
    }

    // Only the browser that started this login may complete it (see
    // casStateCookie). The state is single-use: clear it either way.
    res.setHeader('Set-Cookie', 'wekan_cas_state=; path=/; max-age=0; SameSite=Lax');
    if (casStateCookie(req.headers.cookie) !== credentialToken) {
      try {
        if (typeof global.__wekanTripCanary === 'function') {
          global.__wekanTripCanary('cas.state-mismatch', { req });
        }
      } catch (e) { /* logging must never break the guard */ }
      end(res, redirectUrl);
      return;
    }

    // validate ticket
    casValidate(req, ticket, credentialToken, serviceUrl, () => {
      end(res, redirectUrl);
    });

  } catch (err) {
    console.log("account-cas: unexpected error : " + err.message);
    if (!redirectUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid CAS callback');
    } else {
      end(res, redirectUrl);
    }
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
        // Account-takeover fix (reported by meifukun): bind the validated CAS
        // user data to THIS credential token instead of a single module-global
        // (`_userData`). Two concurrent CAS logins used to race — one validation
        // overwrote the shared `_userData`, so an attacker completing their own
        // login read the victim's data and received the victim's WeKan session.
        _casCredentialTokens[token] = { id: userData.id, userData: userData };
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
 Accounts.registerLoginHandler(async (options) => {
  if (!options.cas)
    return undefined;

  if (!_hasCredential(options.cas.credentialToken)) {
    throw new Meteor.Error(Accounts.LoginCancelledError.numericError,
      'no matching login attempt found');
  }

  const result = _retrieveCredential(options.cas.credentialToken);

  // Read the CAS attributes that were validated for THIS token (not a shared
  // global), so concurrent logins can never cross identities. See the fix note
  // where _casCredentialTokens[token] is populated.
  const userData = (result && result.userData) || {};

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
  const name = full ? userData[full] : userData[fn] + ' ' +  userData[ln];
  // https://docs.meteor.com/api/accounts.html#Meteor-users
  options = {
    // _id: Meteor.userId()
    username: userData[uid], // Unique name
    emails: [
      { address: userData[mail], verified: true }
    ],
    createdAt: new Date(),
    profile: {
      // The profile is writable by the user by default.
      name: name,
      fullname : name,
      email : userData[mail]
    },
    active: true,
    authenticationMethod: 'cas',
    globalRoles: ['user']
  };
  if (attrs.debug) {
    console.log(`CAS response : ${JSON.stringify(result)}`);
  }
  let user = await Meteor.users.findOneAsync({ 'username': options.username });
  if (user) {
    const isCasAccount = user.authenticationMethod === 'cas';
    // Admin Panel / People / CAS override, else the environment variable
    // (server/lib/authConfig.js installs the resolver; a package cannot import it).
    const resolve = globalThis.__wekanAuthEnv;
    const mergeAllowed = (typeof resolve === 'function'
      ? resolve('CAS_MERGE_EXISTING_USERS') : process.env.CAS_MERGE_EXISTING_USERS) === 'true';
    if (!isCasAccount && !mergeAllowed) {
      try {
        // A local Meteor package cannot import app-tree code (see
        // server/lib/canary.js's header comment on this bridge); tripCanary
        // is reached through the shared Node `global`, set once at app boot.
        if (typeof global.__wekanTripCanary === 'function') {
          global.__wekanTripCanary('cas.account-conflict', {
            username: options.username,
          });
        }
      } catch (e) {
        /* logging must never break the guard */
      }
      throw new Meteor.Error(
        'cas-account-conflict',
        'CAS authentication succeeded, but a non-CAS WeKan account already exists with this username.',
      );
    }
  }
  if (! user) {
    if (attrs.debug) {
      console.log(`Creating user account ${JSON.stringify(options)}`);
    }
    const userId = await Accounts.insertUserDoc({}, options);
    user = await Meteor.users.findOneAsync(userId);
  }
  if (attrs.debug) {
    console.log(`Using user account ${JSON.stringify(user)}`);
  }
  return { userId: user._id };
});

const _hasCredential = (credentialToken) => {
  return Object.prototype.hasOwnProperty.call(_casCredentialTokens, credentialToken);
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
