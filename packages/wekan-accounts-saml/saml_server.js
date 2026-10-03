"use strict";

// SP-initiated SAML 2.0 login for Meteor accounts, following the same
// credential-token pattern as wekan-accounts-cas (cas_server.js): the client
// sends the browser - a popup, or with SAML_LOGIN_FLOW=redirect the page
// itself - to our own /_saml/authorize endpoint, which redirects to the
// identity provider; the IdP then POSTs the SAML response back to our
// /_saml/validate endpoint, which is our Assertion Consumer Service (ACS). All SAML protocol handling (building
// the AuthnRequest, parsing the response, verifying the XML signature) is
// done by @node-saml/node-saml (MIT license) - this file only wires that
// into Meteor's accounts system. See ../LICENSE and
// docs/Features/Login/SAML.md.

import { SAML } from '@node-saml/node-saml';
import { createResponseReplayGuard } from './responseReplay';
import { samlIdentity, samlIdentitySelector, samlEmailVerified } from './identity';
import bodyParser from 'body-parser';

const urlEncodedParser = bodyParser.urlencoded({ extended: false });

let _samlCredentialTokens = {};
let _samlInstanceCacheKey = null;
let _samlInstance = null;
const acceptLoginResponse = createResponseReplayGuard();

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
  if (!config || config.enabled === false || !config.entryPoint || !config.issuer || !config.cert) {
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
    idpCert: config.cert,
    callbackUrl: Meteor.absoluteUrl(`_saml/validate/${provider}`),
    identifierFormat:
      config.identifierFormat ||
      'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    privateKey,
    publicCert,
    logoutUrl: config.idpSLORedirectURL || undefined,
    logoutCallbackUrl: Meteor.absoluteUrl(`_saml/logout/${provider}`),
    // Which signatures are required depends on the identity provider (Admin
    // Panel -> People -> SAML: SAML_IDP_PROFILE and the fields below it).
    // node-saml verifies every signature that is present; these say which
    // must be present. Some identity providers sign the Assertion and not the
    // Response, and node-saml's default of requiring a signed Response then
    // fails with "Invalid document signature" before the Assertion is checked.
    // validateSamlConfig refuses a configuration that requires neither.
    wantAuthnResponseSigned: config.wantResponseSigned !== false,
    wantAssertionsSigned: config.wantAssertionsSigned === true,
    // This application initiates the login. Require a live request ID rather
    // than accepting a still-valid assertion again under a new RelayState.
    validateInResponseTo: 'always',
    requestIdExpirationPeriodMs: 8 * 60 * 60 * 1000,
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

// With SAML_LOGIN_FLOW=redirect the whole page went to the identity provider,
// so the ACS sends it back to the sign-in page with the credential token - a
// random id, never the assertion - which the client exchanges for a login.
const redirectTo = (res, pathAndQuery) => {
  res.writeHead(302, { Location: Meteor.absoluteUrl(pathAndQuery) });
  res.end();
};
const finishLogin = (res, credentialToken) => {
  redirectTo(res, `sign-in?samlToken=${encodeURIComponent(credentialToken)}`);
};
const redirectError = (res, message) => {
  redirectTo(res, `sign-in?samlError=${encodeURIComponent(String(message).slice(0, 200))}`);
};
const isRedirectFlow = config => Boolean(config && config.loginFlow === 'redirect');

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

// Public SP metadata contains no private key or user information.
WebApp.connectHandlers.use('/_saml/config', (req, res) => {
  (async () => {
    try {
      const { saml, config } = await getSaml();
      if (req.method !== 'GET' || !saml || req.url.split('?')[0] !== `/${config.provider || 'default'}`) {
        res.writeHead(404); res.end(); return;
      }
      const xml = saml.generateServiceProviderMetadata(null, readFileSetting(config.publicCertFile) || null);
      res.writeHead(200, { 'Content-Type': 'application/samlmetadata+xml', 'X-Content-Type-Options': 'nosniff' });
      res.end(xml);
    } catch (error) {
      res.writeHead(500); res.end('SAML metadata unavailable');
    }
  })();
});

WebApp.connectHandlers.use('/_saml/authorize', (req, res) => {
  (async () => {
    try {
      const urlParsed = new URL(req.url, Meteor.absoluteUrl());
      const provider = urlParsed.searchParams.get('provider') || 'default';
      const credentialToken = urlParsed.searchParams.get('credentialToken');
      const { saml, config } = await getSaml();
      if (!saml || !credentialToken) {
        const current = await getSamlServiceConfig();
        (isRedirectFlow(current) ? redirectError : sendError)(res, 'SAML is not configured');
        return;
      }
      const redirectUrl = await saml.getAuthorizeUrlAsync(
        credentialToken,
        undefined,
        { additionalParams: { provider: config.provider || provider } },
      );
      res.writeHead(302, { Location: redirectUrl });
      res.end();
    } catch (err) {
      console.log(`wekan-accounts-saml: authorize error: ${err.message}`);
      const current = await getSamlServiceConfig().catch(() => null);
      (isRedirectFlow(current) ? redirectError : sendError)(res, err.message);
    }
  })();
});

WebApp.connectHandlers.use('/_saml/validate', (req, res) => {
  urlEncodedParser(req, res, () => {
    (async () => {
      let fail = sendError;
      try {
        const body = req.body || {};
        // RelayState carries the credential token generated on the client,
        // the same correlation pattern used by wekan-accounts-cas so two
        // concurrent SAML logins never cross identities (see the
        // account-takeover fix noted in cas_server.js).
        const credentialToken = body.RelayState;
        const { saml, config } = await getSaml();
        fail = isRedirectFlow(config) ? redirectError : sendError;
        if (!saml || !credentialToken) {
          fail(res, 'SAML is not configured');
          return;
        }
        const { profile } = await saml.validatePostResponseAsync(body);
        if (!acceptLoginResponse(profile)) {
          try {
            if (acceptLoginResponse.rejection === 'replay' &&
                typeof global.__wekanTripCanary === 'function') {
              global.__wekanTripCanary('saml.response-replay');
            }
          } catch (e) { /* logging must never break the guard */ }
          throw new Error('SAML login response has already been consumed or is unavailable');
        }
        _storeCredential(credentialToken, { profile });
        if (isRedirectFlow(config)) finishLogin(res, credentialToken);
        else closePopup(res);
      } catch (err) {
        console.log(`wekan-accounts-saml: validate error: ${err.message}`);
        fail(res, err.message);
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

  if (!config || config.enabled === false) throw new Meteor.Error('saml-disabled');

  const identifierFormat =
    (config && config.identifierFormat) ||
    'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
  const matchAttribute = config && config.localProfileMatchAttribute;

  const identity = samlIdentity(profile);
  if (!identity) throw new Meteor.Error('saml-no-identifier', 'SAML requires a durable NameID and issuer');
  const identitySelector = samlIdentitySelector(identity);
  const nameId = identity.nameID;
  const email = profile.email || (identifierFormat.includes('emailAddress') ? nameId : undefined);
  const username =
    (matchAttribute && profile[matchAttribute]) || email || nameId;

  if (typeof username !== 'string' || !username ||
      (email !== undefined && typeof email !== 'string')) {
    throw new Meteor.Error(
      'saml-no-identifier',
      'SAML assertion did not contain a usable identifier',
    );
  }

  const userOptions = {
    username,
    emails: email ? [{ address: email, verified: samlEmailVerified(profile) }] : [],
    createdAt: new Date(),
    profile: {
      fullname: profile.displayName || profile.cn || username,
      email,
    },
    active: true,
    authenticationMethod: 'saml',
    globalRoles: ['user'],
  };

  const conflict = (recordAttempt = true) => {
    try {
      if (recordAttempt && typeof global.__wekanTripCanary === 'function') {
        global.__wekanTripCanary('saml.subject-conflict', { username });
      }
    } catch (e) { /* logging must never break the guard */ }
    throw new Meteor.Error(
      'saml-account-conflict',
      'SAML identity does not match this account. Contact your administrator.',
    );
  };
  // Resolve the immutable identity FIRST, so attribute/username changes cannot
  // redirect a returning subject into another account.
  let user = await Meteor.users.findOneAsync(identitySelector);
  if (!user) {
    user = await Meteor.users.findOneAsync({ username: userOptions.username });
    if (user) {
      const isSamlAccount = user.authenticationMethod === 'saml';
      const mergeAllowed = config?.mergeExistingUsers === true;
      // Never rebind an existing or legacy SAML identity, even with merging on.
      if (isSamlAccount || user.services?.saml) {
        // Missing legacy scope can also be an ordinary login after upgrade.
        conflict(Boolean(samlIdentity(user.services?.saml)));
      }
      if (!mergeAllowed) {
        try {
          if (typeof global.__wekanTripCanary === 'function') {
            global.__wekanTripCanary('saml.account-conflict', { username });
          }
        } catch (e) { /* logging must never break the guard */ }
        conflict();
      }
      if (!email || !samlEmailVerified(profile) ||
          !user.emails?.some(entry => entry.address === email && entry.verified === true)) conflict();
      // Compare-and-set: simultaneous first links cannot overwrite each other.
      const linked = await Meteor.users.updateAsync({
        _id: user._id, 'services.saml': { $exists: false },
        authenticationMethod: { $ne: 'saml' },
        emails: { $elemMatch: { address: email, verified: true } },
      }, { $set: { 'services.saml': identity } });
      if (!linked) conflict();
    } else {
      // Persist the binding in the initial insert, never in a later blind write.
      userOptions.services = { saml: identity };
      const userId = await Accounts.insertUserDoc({}, userOptions);
      user = await Meteor.users.findOneAsync(userId);
    }
  }

  // Only session metadata is mutable. Recheck the binding atomically at login.
  const updated = await Meteor.users.updateAsync({ _id: user._id, ...identitySelector }, {
    $set: { 'services.saml.sessionIndex': typeof profile.sessionIndex === 'string' ? profile.sessionIndex : '' },
  });
  if (!updated) conflict();
  return { userId: user._id };
});

// SP-initiated logout. The callback only validates the IdP response; it never
// logs out an account named by a request from the browser.
Meteor.methods({
  async getSamlLogoutUrl() {
    const user = await Meteor.userAsync();
    if (!user || user.authenticationMethod !== 'saml' || !user.services?.saml?.nameID) return null;
    const { saml, config } = await getSaml();
    if (!saml || !config.idpSLORedirectURL) return null;
    return saml.getLogoutUrlAsync(user.services.saml, '', {});
  },
});
WebApp.connectHandlers.use('/_saml/logout', (req, res) => {
  const handle = async () => {
    try {
      const { saml, config } = await getSaml();
      const url = new URL(req.url, Meteor.absoluteUrl());
      if (!saml || url.pathname !== `/${config.provider || 'default'}`) throw new Error('Not configured');
      const data = req.method === 'GET' ? Object.fromEntries(url.searchParams) : req.body || {};
      if (!data.SAMLResponse || data.SAMLRequest) throw new Error('Expected logout response');
      const result = req.method === 'GET'
        ? await saml.validateRedirectAsync(data, url.search.slice(1))
        : await saml.validatePostResponseAsync(data);
      if (!result.loggedOut) throw new Error('Expected logout response');
      res.writeHead(302, { Location: Meteor.absoluteUrl() }); res.end();
    } catch (error) { res.writeHead(400); res.end('Invalid SAML logout response'); }
  };
  if (req.method === 'POST') urlEncodedParser(req, res, () => { void handle(); });
  else if (req.method === 'GET') void handle();
  else { res.writeHead(405); res.end(); }
});
