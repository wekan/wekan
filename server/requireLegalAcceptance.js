import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import LegalPages from '/models/legalPages';
import { deferArgumentAudit, applyAudited } from '/server/lib/argumentChecks';

// Versioned acceptance of the terms and the privacy notice, enforced over DDP
// (docs/Compliance/README.md WP-8; the rules are in
// models/lib/legalAcceptance.js). Until a signed-in account has accepted the
// current version of every page that requires it, it may call only the
// methods in ALLOWED_METHODS, and its publications send nothing.
//
// Built like server/requireTwoFactor.js: every method and publication is
// wrapped once at startup. While no page requires acceptance a call costs one
// array length check. Otherwise the "may" is kept on the connection for a
// minute, keyed on the required versions, so a new version is asked for at
// once and an ordinary session reads its user once a minute, not per call.
//
// The REST API (/api/...) is not gated: it is used by integrations with an
// API token, and the account behind them accepts in the browser like
// everybody else.
const {
  ACCEPTABLE_PAGES, requiredAcceptances, missingAcceptances, acceptanceSet, requirementStamp,
  ALLOWED_METHODS, ALLOWED_PUBLICATIONS,
} = require('/models/lib/legalAcceptance');

const RECHECK_MS = 60 * 1000;
const REFRESH_MS = 60 * 1000;
const USER_FIELDS = { legalAcceptances: 1 };

// The required pages, read from the database at startup, after every save
// (server/methods/legalPages.js) and once a minute, so another server process
// sees a change within a minute.
let required = [];
let stamp = '';

export async function refreshRequiredAcceptances() {
  const docs = await LegalPages.find(
    { _id: { $in: [...ACCEPTABLE_PAGES] } },
    { fields: { enabled: 1, requireAcceptance: 1, version: 1 } },
  ).fetchAsync();
  required = requiredAcceptances(docs);
  stamp = requirementStamp(required);
  return required;
}

function allowedWithoutLookup(invocation) {
  if (required.length === 0 || !invocation || !invocation.userId || !invocation.connection) return true;
  const cached = invocation.connection._wekanLegalAcceptance;
  return !!(cached && cached.userId === invocation.userId && cached.stamp === stamp
    && Date.now() - cached.at < RECHECK_MS);
}

export async function mustAccept(invocation) {
  if (allowedWithoutLookup(invocation)) return false;
  const conn = invocation.connection;
  const user = await Meteor.users.findOneAsync(invocation.userId, { fields: USER_FIELDS });
  let missing = missingAcceptances(user, required).length > 0;
  // Before refusing, read the requirement again: another server process, or
  // the database itself, may have changed it since the last refresh, and a
  // requirement that was turned off must never block anybody.
  if (missing) missing = missingAcceptances(user, await refreshRequiredAcceptances()).length > 0;
  if (missing) delete conn._wekanLegalAcceptance;
  else conn._wekanLegalAcceptance = { userId: invocation.userId, stamp, at: Date.now() };
  return missing;
}

function refuse() {
  return new Meteor.Error('legal-acceptance-required', 'The terms or the privacy notice must be accepted first.');
}

// The versions a sign-up accepted with the checkbox of the registration form
// (server/models/users.js onCreateUser): the ones required at that moment.
export async function signupAcceptances(now = new Date()) {
  const current = await refreshRequiredAcceptances();
  return Object.fromEntries(current.map(r => [r.page, { version: r.version, at: now }]));
}

Meteor.methods({
  // What the browser shows after signing in: the pages to accept, or the app.
  // Also what Member Settings / Privacy and my data lists as accepted.
  async getLegalAcceptanceRequirement() {
    if (!this.userId) return { required: required.length > 0, missing: [], accepted: {} };
    const user = await Meteor.users.findOneAsync(this.userId, { fields: USER_FIELDS });
    return {
      required: required.length > 0,
      missing: missingAcceptances(user, required),
      accepted: (user && user.legalAcceptances) || {},
    };
  },
  // accepted: [{ page, version }], the versions the browser showed.
  async acceptLegalPages(accepted) {
    check(accepted, [Match.ObjectIncluding({ page: String, version: Match.Integer })]);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    await refreshRequiredAcceptances();
    let $set;
    try {
      $set = acceptanceSet(required, accepted.map(a => ({ page: a.page, version: a.version })));
    } catch (e) {
      throw new Meteor.Error(e.message);
    }
    if (Object.keys($set).length === 0) return false;
    await Meteor.users.updateAsync(this.userId, { $set });
    if (this.connection) delete this.connection._wekanLegalAcceptance;
    return true;
  },
});

const WRAPPED = Symbol('requireLegalAcceptance');

function mark(wrapper, original) {
  for (const symbol of Object.getOwnPropertySymbols(original)) wrapper[symbol] = original[symbol];
  wrapper[WRAPPED] = true;
}

// Idempotent, like server/requireTwoFactor.js wrapAll.
export function wrapAll() {
  const methods = Meteor.server.method_handlers;
  for (const name of Object.keys(methods)) {
    if (ALLOWED_METHODS.has(name) || methods[name][WRAPPED]) continue;
    const original = methods[name];
    methods[name] = function requireLegalAcceptanceMethod(...args) {
      if (allowedWithoutLookup(this)) return original.apply(this, args);
      deferArgumentAudit(args);
      return (async () => {
        if (await mustAccept(this)) throw refuse();
        return applyAudited(original, this, args, `call to '${name}'`);
      })();
    };
    mark(methods[name], original);
  }

  const publications = Meteor.server.publish_handlers;
  for (const name of Object.keys(publications)) {
    if (ALLOWED_PUBLICATIONS.has(name) || publications[name][WRAPPED]) continue;
    const original = publications[name];
    publications[name] = function requireLegalAcceptancePublication(...args) {
      if (allowedWithoutLookup(this)) return original.apply(this, args);
      deferArgumentAudit(args);
      return (async () => {
        if (await mustAccept(this)) {
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
  refreshRequiredAcceptances().catch(() => {});
  Meteor.setInterval(() => { refreshRequiredAcceptances().catch(() => {}); }, REFRESH_MS);
});
