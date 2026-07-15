// Pure helper backing the OIDC authorization-code replay guard in
// oidc_server.js. Kept dependency-free (plain CommonJS, no Meteor imports)
// so it can be unit tested with plain Node + assert, the same way
// loginHandler.js's oauth2AdminStatusFromGroups is tested.
//
// SECURITY (pentest finding, 2026-07): a captured /_oauth/oidc?state=...
// &code=... request could be replayed (e.g. from a proxy's history) to
// mint a brand-new, fully valid Wekan session after the original user had
// already logged out. RFC 6749 4.1.2 requires an authorization code be
// redeemed only once, but not every identity provider enforces that
// strictly (or a client-side replay may race the original exchange), so
// Wekan must not rely on the IdP alone.
const crypto = require('crypto');

// One hash per (state, code) pair. Hashed rather than stored raw so the
// collection never holds a live, replayable authorization code.
function codeHashFor(query) {
  return crypto
    .createHash('sha256')
    .update(String(query.state) + '|' + String(query.code))
    .digest('hex');
}

// `collection` only needs an `insertAsync({_id, createdAt})` that rejects a
// duplicate `_id` the way Mongo's unique index does (throwing an error with
// `.code === 11000` or an "E11000" message). Using `_id` for the hash makes
// the check atomic even under concurrent replay attempts, unlike a
// find-then-insert check.
async function assertOidcCodeNotReplayed(query, collection) {
  if (!query || !query.code) return;
  const codeHash = codeHashFor(query);
  try {
    await collection.insertAsync({
      _id: codeHash,
      createdAt: new Date(),
    });
  } catch (err) {
    if (err && (err.code === 11000 || /E11000/.test(err.message || ''))) {
      throw new Error(
        'OIDC authorization code has already been used; refusing to replay it.',
      );
    }
    throw err;
  }
}

module.exports = { codeHashFor, assertOidcCodeNotReplayed };
