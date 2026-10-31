import { Meteor } from 'meteor/meteor';
import { authEnv } from '/server/lib/authConfig';
import { deferArgumentAudit, applyAudited } from '/server/lib/argumentChecks';

// REQUIRE_2FA enforced over DDP: until an account the requirement covers has
// two-factor authentication, it may only sign in and out and enrol. Who is
// covered, and why signing in itself is not refused, is in
// models/lib/twoFactorRequirement.js; HTTP routes are refused in
// server/lib/activeUser.js.
//
// Every method and publication is wrapped once, at startup, after every file
// has defined its own. With REQUIRE_2FA off a call costs one string compare.
// Otherwise the answer is kept on the connection for a minute per signed-in
// account, so an ordinary session reads its user once a minute, not per call.
const {
  requireTwoFactorMode, twoFactorApplies, missingTwoFactor, hasTwoFactor,
  ALLOWED_METHODS, ALLOWED_PUBLICATIONS,
} = require('/models/lib/twoFactorRequirement');

const RECHECK_MS = 60 * 1000;
const USER_FIELDS = {
  isAdmin: 1, authenticationMethod: 1, 'services.password': 1, 'services.twoFactorAuthentication': 1,
};

function mode() {
  return requireTwoFactorMode(authEnv);
}

// Allowed without reading the user: REQUIRE_2FA off, nobody signed in, a
// server-internal call (no connection), or a "may" cached on the connection.
function allowedWithoutLookup(invocation) {
  const current = mode();
  if (current === 'off' || !invocation || !invocation.userId || !invocation.connection) return true;
  const cached = invocation.connection._wekanTwoFactor;
  return !!(cached && cached.userId === invocation.userId && cached.mode === current
    && Date.now() - cached.at < RECHECK_MS);
}

// Is this invocation (method or publication) from an account that still has to
// enrol? Server-internal calls, which have no connection, are never refused.
async function mustEnrol(invocation) {
  if (allowedWithoutLookup(invocation)) return false;
  const current = mode();
  const conn = invocation.connection;
  const user = await Meteor.users.findOneAsync(invocation.userId, { fields: USER_FIELDS });
  const missing = missingTwoFactor(user, current);
  // Only "may" is kept: an account that has just enrolled must not wait a
  // minute, and one still enrolling makes few calls.
  if (missing) delete conn._wekanTwoFactor;
  else conn._wekanTwoFactor = { userId: invocation.userId, mode: current, at: Date.now() };
  return missing;
}

function refuse() {
  return new Meteor.Error('two-factor-required', 'Two-factor authentication must be set up first.');
}

Meteor.methods({
  // What the browser shows after signing in: the set-up only, or the app.
  async getTwoFactorRequirement() {
    if (!this.userId) return { required: false, enabled: false, mode: mode() };
    const user = await Meteor.users.findOneAsync(this.userId, { fields: USER_FIELDS });
    return { required: twoFactorApplies(user, mode()), enabled: hasTwoFactor(user), mode: mode() };
  },
});

const WRAPPED = Symbol('requireTwoFactor');

// A wrapper keeps the marks of the function it wraps, so another wrapper of
// the same handlers (server/adminAudit.js) does not wrap it a second time.
function mark(wrapper, original) {
  for (const symbol of Object.getOwnPropertySymbols(original)) wrapper[symbol] = original[symbol];
  wrapper[WRAPPED] = true;
}

// A handler is called at once when the answer needs no lookup, so
// audit-argument-checks sees its own check() calls; only a lookup awaits first,
// and then hands the audit over (server/lib/argumentChecks.js).
// Idempotent, so it can run again after the startup hooks of files loaded
// later than this one have defined their methods and publications too.
function wrapAll() {
  const methods = Meteor.server.method_handlers;
  for (const name of Object.keys(methods)) {
    if (ALLOWED_METHODS.has(name) || methods[name][WRAPPED]) continue;
    const original = methods[name];
    if (name === 'disableUser2fa') {
      // Once required, 2FA stays on.
      methods[name] = function disableUser2faUnlessRequired(...args) {
        if (!this.userId || mode() === 'off') return original.apply(this, args);
        deferArgumentAudit(args);
        return (async () => {
          const user = await Meteor.users.findOneAsync(this.userId, { fields: USER_FIELDS });
          if (twoFactorApplies(user, mode())) {
            throw new Meteor.Error('two-factor-required', 'Two-factor authentication is required on this site.');
          }
          return applyAudited(original, this, args, `call to '${name}'`);
        })();
      };
      mark(methods[name], original);
      continue;
    }
    methods[name] = function requireTwoFactorMethod(...args) {
      if (allowedWithoutLookup(this)) return original.apply(this, args);
      deferArgumentAudit(args);
      return (async () => {
        if (await mustEnrol(this)) throw refuse();
        return applyAudited(original, this, args, `call to '${name}'`);
      })();
    };
    mark(methods[name], original);
  }

  const publications = Meteor.server.publish_handlers;
  for (const name of Object.keys(publications)) {
    if (ALLOWED_PUBLICATIONS.has(name) || publications[name][WRAPPED]) continue;
    const original = publications[name];
    publications[name] = function requireTwoFactorPublication(...args) {
      if (allowedWithoutLookup(this)) return original.apply(this, args);
      deferArgumentAudit(args);
      return (async () => {
        if (await mustEnrol(this)) {
          this.ready();
          return undefined;
        }
        return applyAudited(original, this, args, `publisher '${name}'`);
      })();
    };
    mark(publications[name], original);
  }
}

Meteor.startup(() => {
  wrapAll();
  Meteor.defer(wrapAll);
});

export { mustEnrol, wrapAll };
