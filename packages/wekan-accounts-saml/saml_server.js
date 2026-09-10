"use strict";

// SP-initiated SAML 2.0 login for Meteor accounts, following the same
// popup + credential-token pattern as wekan-accounts-cas (cas_server.js):
// the client opens a popup pointed at our own /_saml/authorize endpoint,
// which redirects the popup to the identity provider; the IdP then POSTs
// the SAML response back to our /_saml/validate endpoint, which is our
// Assertion Consumer Service (ACS). All SAML protocol handling (building
// the AuthnRequest, parsing the response, verifying the XML signature) is
// done by @node-saml/node-saml (MIT license) - this file only wires that
// into Meteor's accounts system. See ../LICENSE and
// docs/Features/Login/SAML.md.

import { SAML } from '@node-saml/node-saml';
import bodyParser from 'body-parser';

const urlEncodedParser = bodyParser.urlencoded({ extended: false });

let _samlCredentialTokens = {};
let _samlInstanceCacheKey = null;
let _samlInstance = null;

async function getSamlServiceConfig() {
  // eslint-disable-next-line no-undef
  return ServiceConfiguration.configurations.findOneAsync({ service: 'saml' });
}

function readFileSetting(name) {
  if (!name) return undefined;
  try {
    // Same convention as documented in server/authentication.js: paths are
    // relative to $METEOR-PROJECT/private, resolved via the Assets API.
    return Assets.getTextSync(name);
  } catch (e) {
    console.log(`wekan-accounts-saml: unable to read "${name}" from private/: ${e.message}`);
    return undefined;
  }
}

async function getSaml() {
  const config = await getSamlServiceConfig();
  if (!config || !config.entryPoint || !config.issuer || !config.cert) {
    return { saml: null, config: null };
  }

  const cacheKey = JSON.stringify(config);
  if (_samlInstance && _samlInstanceCacheKey === cacheKey) {
    return { saml: _samlInstance, config };
  }

  const privateKey = readFileSetting(config.privateKeyFile);
  const publicCert = readFileSetting(config.publicCertFile);
  const provider = config.provider || 'default';

  _samlInstance = new SAML({
    entryPoint: config.entryPoint,
    issuer: config.issuer,
    cert: config.cert,
    callbackUrl: Meteor.absoluteUrl(`_saml/validate/${provider}`),
    identifierFormat:
      config.identifierFormat ||
      'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    privateKey,
    publicCert,
    // Logout is handled separately via idpSLORedirectURL if/when WeKan wires
    // up SLO; keep assertion signing requirements at the library default.
    wantAssertionsSigned: false,
  });
  _samlInstanceCacheKey = cacheKey;
  return { saml: _samlInstance, config };
}

const _hasCredential = (credentialToken) =>
  Object.prototype.hasOwnProperty.call(_samlCredentialTokens, credentialToken);

const _storeCredential = (credentialToken, data) => {
  _samlCredentialTokens[credentialToken] = data;
};

const _retrieveCredential = (credentialToken) => {
  const result = _samlCredentialTokens[credentialToken];
  delete _samlCredentialTokens[credentialToken];
  return result;
};

const closePopup = (res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><body><div id="popupCanBeClosed"></div></body></html>', 'utf-8');
};

const sendError = (res, message) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(
    `<html><body><div id="popupCanBeClosed" data-error="${String(message).replace(/"/g, '&quot;')}"></div></body></html>`,
    'utf-8',
  );
};

WebApp.connectHandlers.use('/_saml/authorize', (req, res) => {
  (async () => {
    try {
      const urlParsed = new URL(req.url, Meteor.absoluteUrl());
      const provider = urlParsed.searchParams.get('provider') || 'default';
      const credentialToken = urlParsed.searchParams.get('credentialToken');
      const { saml } = await getSaml();
      if (!saml || !credentialToken) {
        sendError(res, 'SAML is not configured');
        return;
      }
      const redirectUrl = await saml.getAuthorizeUrlAsync(
        credentialToken,
        undefined,
        { additionalParams: { provider } },
      );
      res.writeHead(302, { Location: redirectUrl });
      res.end();
    } catch (err) {
      console.log(`wekan-accounts-saml: authorize error: ${err.message}`);
      sendError(res, err.message);
    }
  })();
});

WebApp.connectHandlers.use('/_saml/validate', (req, res) => {
  urlEncodedParser(req, res, () => {
    (async () => {
      try {
        const body = req.body || {};
        // RelayState carries the credential token generated on the client,
        // the same correlation pattern used by wekan-accounts-cas so two
        // concurrent SAML logins never cross identities (see the
        // account-takeover fix noted in cas_server.js).
        const credentialToken = body.RelayState;
        const { saml } = await getSaml();
        if (!saml || !credentialToken) {
          sendError(res, 'SAML is not configured');
          return;
        }
        const { profile } = await saml.validatePostResponseAsync(body);
        _storeCredential(credentialToken, { profile });
        closePopup(res);
      } catch (err) {
        console.log(`wekan-accounts-saml: validate error: ${err.message}`);
        sendError(res, err.message);
      }
    })();
  });
});

/*
 * Register a server-side login handler. It is called after
 * Accounts.callLoginMethod() is called from the client with a
 * `saml.credentialToken`, once the popup flow above has validated the
 * assertion for that token.
 */
Accounts.registerLoginHandler(async (options) => {
  if (!options.saml) return undefined;

  if (!_hasCredential(options.saml.credentialToken)) {
    throw new Meteor.Error(
      Accounts.LoginCancelledError.numericError,
      'no matching SAML login attempt found',
    );
  }

  const result = _retrieveCredential(options.saml.credentialToken);
  const profile = (result && result.profile) || {};
  const config = await getSamlServiceConfig();

  const identifierFormat =
    (config && config.identifierFormat) ||
    'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
  const matchAttribute = config && config.localProfileMatchAttribute;

  const nameId = profile.nameID || profile.email;
  const email = profile.email || (identifierFormat.includes('emailAddress') ? nameId : undefined);
  const username =
    (matchAttribute && profile[matchAttribute]) || email || nameId;

  if (!username) {
    throw new Meteor.Error(
      'saml-no-identifier',
      'SAML assertion did not contain a usable identifier',
    );
  }

  const userOptions = {
    username,
    emails: email ? [{ address: email, verified: true }] : [],
    createdAt: new Date(),
    profile: {
      name: profile.displayName || profile.cn || username,
      email,
    },
    active: true,
    authenticationMethod: 'saml',
    globalRoles: ['user'],
  };

  let user = await Meteor.users.findOneAsync({ username: userOptions.username });
  if (user) {
    const isSamlAccount = user.authenticationMethod === 'saml';
    const mergeAllowed = process.env.SAML_MERGE_EXISTING_USERS === 'true';
    if (!isSamlAccount && !mergeAllowed) {
      try {
        // A local Meteor package cannot import app-tree code (see
        // server/lib/canary.js's header comment on this bridge); tripCanary
        // is reached through the shared Node `global`, set once at app boot.
        if (typeof global.__wekanTripCanary === 'function') {
          global.__wekanTripCanary('saml.account-conflict', {
            username: userOptions.username,
          });
        }
      } catch (e) {
        /* logging must never break the guard */
      }
      throw new Meteor.Error(
        'saml-account-conflict',
        'SAML authentication succeeded, but a non-SAML WeKan account already exists with this username.',
      );
    }
  }

  if (!user) {
    const userId = await Accounts.insertUserDoc({}, userOptions);
    user = await Meteor.users.findOneAsync(userId);
  }

  return { userId: user._id };
});
