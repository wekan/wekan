'use strict';

// Versioned acceptance of the terms and the privacy notice
// (docs/Compliance/README.md WP-8; [GDPR] Art. 7(1) where consent is the
// legal basis - otherwise the operator's contract law).
//
// A site administrator turns on "Require acceptance" for the terms or the
// privacy notice in Admin Panel / Settings / Legal pages. From then on every
// signed-in account has to accept the CURRENT version of each such page
// before it can do anything else; a new version (models/lib/legalPages.js
// pageUpdate raises it when the text a reader sees changes) has to be accepted
// again. Each acceptance is kept on the account as
//
//   legalAcceptances.<page> = { version, at }
//
// shown to the person in Member Settings / Privacy and my data, and part of
// Download my data. A sign-up that ticked the checkbox has accepted the
// versions required at that moment.
//
// Until then only the methods in ALLOWED_METHODS answer (server/
// requireLegalAcceptance.js), and publications send nothing: the account can
// read the pages, accept them, sign out, and finish any other step the
// sign-in asks for first (two-factor set-up, a password change).
//
// Pure, no Meteor: tests/legalAcceptance.test.cjs.

const { ALLOWED_METHODS: TWO_FACTOR_ALLOWED, ALLOWED_PUBLICATIONS: TWO_FACTOR_PUBLICATIONS } = require('./twoFactorRequirement');

// The pages an account can be asked to accept. The cookie notice and the
// imprint inform; there is nothing to agree to.
const ACCEPTABLE_PAGES = Object.freeze(['terms', 'privacy']);

// The pages the account must accept, from the legalPages documents: published,
// acceptance required, with their current version.
function requiredAcceptances(docs) {
  return ACCEPTABLE_PAGES
    .map(id => (docs || []).find(d => d && d._id === id))
    .filter(d => d && d.enabled === true && d.requireAcceptance === true)
    .map(d => ({ page: d._id, version: Number.isSafeInteger(d.version) && d.version > 0 ? d.version : 1 }));
}

// Has this account accepted this version (or a later one) of the page?
function hasAccepted(user, { page, version }) {
  const record = user && user.legalAcceptances && user.legalAcceptances[page];
  return !!(record && Number.isSafeInteger(record.version) && record.version >= version);
}

// What the account still has to accept.
function missingAcceptances(user, required) {
  return (required || []).filter(r => !hasAccepted(user, r));
}

// The $set an acceptance becomes. The browser says which version of each page
// it showed; only the version that is current now is recorded, so nobody
// accepts a text they were not shown. Anything else is refused as a whole.
function acceptanceSet(required, accepted, now = new Date()) {
  if (!Array.isArray(accepted)) throw new Error('legal-acceptance-invalid');
  const $set = {};
  for (const item of accepted) {
    const page = item && item.page;
    const want = (required || []).find(r => r.page === page);
    if (!want) throw new Error('legal-acceptance-not-required');
    if (item.version !== want.version) throw new Error('legal-page-changed');
    $set[`legalAcceptances.${page}`] = { version: want.version, at: now };
  }
  return $set;
}

// A short key for the required versions, so a connection that was allowed
// once is asked again when a page gets a new version.
function requirementStamp(required) {
  return (required || []).map(r => `${r.page}@${r.version}`).join(',');
}

// Methods an account that has not accepted may still call: everything the
// two-factor set-up and the sign-in page need, the password change the
// sign-in may require, and reading and accepting the pages.
const ALLOWED_METHODS = new Set([
  ...TWO_FACTOR_ALLOWED,
  'getLegalPages', 'getLegalAcceptanceRequirement', 'acceptLegalPages', 'getRegistrationMinimumAge',
  'getPasswordChangeRequirement', 'reportShortPasswordLogin', 'changePassword',
]);

const ALLOWED_PUBLICATIONS = new Set([...TWO_FACTOR_PUBLICATIONS]);

module.exports = {
  ACCEPTABLE_PAGES,
  requiredAcceptances,
  hasAccepted,
  missingAcceptances,
  acceptanceSet,
  requirementStamp,
  ALLOWED_METHODS,
  ALLOWED_PUBLICATIONS,
};
