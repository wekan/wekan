'use strict';

// A global-search page belongs to the user who created its server-side session.
// Returning a selector instead of a boolean makes the ownership decision part of
// the database lookup, so a caller can never fetch somebody else's session and
// check it only after its stored card selector has already been read.
function ownedSearchSessionSelector(userId, sessionId) {
  if (typeof userId !== 'string' || !userId) return null;
  if (typeof sessionId !== 'string' || !sessionId) return null;
  return { userId, sessionId };
}

function recordLoggedOutPaginationProbe(context, source, record) {
  if (context && context.userId) return false;
  try {
    record({
      key: 'authz.search-session',
      action: 'blocked',
      source,
      ip: context && context.connection && context.connection.clientAddress,
      detail: 'unauthenticated global-search pagination subscription',
    });
  } catch (e) { /* logging must never break the guard */ }
  return true;
}

module.exports = { ownedSearchSessionSelector, recordLoggedOutPaginationProbe };
