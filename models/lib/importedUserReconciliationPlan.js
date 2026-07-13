'use strict';

// Pure planning for imported-placeholder reconciliation (see
// server/importedUserReconciliation.js), split out so it is unit-testable without a DB.
//
// Given the imported placeholder users and the set of candidate real accounts, decide:
//  - merges:        placeholders that have a matching VALID account (same username, and
//                   that account is itself not an imported placeholder) → merge in.
//  - deactivations: placeholders with no matching valid account (e.g. a person not in
//                   LDAP) → leave inactive.
// A placeholder never matches itself or another placeholder.
function planReconciliation(placeholders, realUsers) {
  const byUsername = new Map();
  for (const u of realUsers || []) {
    if (u && u.username && u._id && u.authenticationMethod !== 'imported') {
      if (!byUsername.has(u.username)) byUsername.set(u.username, u._id);
    }
  }
  const merges = [];
  const deactivations = [];
  for (const ph of placeholders || []) {
    if (!ph || !ph._id) continue;
    const targetId = ph.username ? byUsername.get(ph.username) : undefined;
    if (targetId && targetId !== ph._id) {
      merges.push({ placeholderId: ph._id, targetId });
    } else {
      deactivations.push(ph._id);
    }
  }
  return { merges, deactivations };
}

module.exports = { planReconciliation };
