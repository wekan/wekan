'use strict';

// node-saml validates and removes request IDs asynchronously. Two concurrent
// validations can both read the same ID before either removes it. Consume the
// verified response ID synchronously before handing an identity to Accounts.
function createResponseReplayGuard({ maxEntries = 10000, ttlMs = 8 * 60 * 60 * 1000 } = {}) {
  const used = new Map();
  return function accept(profile, now = Date.now()) {
    for (const [id, expires] of used) {
      if (expires > now) break;
      used.delete(id);
    }
    // node-saml exposes the validated Response InResponseTo as a string.
    // Missing IDs remain invalid; accepting a valid response is still atomic.
    const id = typeof profile?.inResponseTo === 'string' ? profile.inResponseTo : '';
    accept.rejection = typeof id !== 'string' || !id ? 'invalid'
      : used.has(id) ? 'replay' : used.size >= maxEntries ? 'capacity' : null;
    if (accept.rejection) return false;
    used.set(id, now + ttlMs);
    return true;
  };
}

module.exports = { createResponseReplayGuard };
