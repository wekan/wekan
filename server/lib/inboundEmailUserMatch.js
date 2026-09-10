'use strict';

// Match an inbound reply's From address to an existing WeKan user - used by
// server/routes/inboundEmail.js (#2414). No match => the caller must reject
// the reply rather than create an anonymous/unauthenticated comment (see the
// route and its negative test).
//
// Split into a pure matcher (testable with a plain array, no database) and a
// thin server-side wrapper that reads the real Users collection.

function normalizeEmail(address) {
  if (typeof address !== 'string') return '';
  // A From header can be "Name <addr@x>" as well as a bare address.
  const angleMatch = address.match(/<([^>]+)>/);
  const raw = angleMatch ? angleMatch[1] : address;
  return raw.trim().toLowerCase();
}

// Pure: given a From address and a list of { _id, emails: [{ address }] }
// user docs (the shape ReactiveCache.getUsers() / Meteor.users documents
// use), return the matching user doc or null. Never throws.
function matchSenderToUser(fromAddress, users) {
  const email = normalizeEmail(fromAddress);
  if (!email || !Array.isArray(users)) return null;
  for (const user of users) {
    const addrs = (user && Array.isArray(user.emails)) ? user.emails : [];
    for (const e of addrs) {
      if (e && typeof e.address === 'string' && e.address.toLowerCase() === email) {
        return user;
      }
    }
  }
  return null;
}

module.exports = { normalizeEmail, matchSenderToUser };
