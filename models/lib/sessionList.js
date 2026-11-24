'use strict';

// Member Settings / Privacy and my data / Where I am signed in
// (docs/Compliance/README.md P3; [GDPR] Art. 32(1)(b), [NIS2] Art. 21(2)(i)):
// every login token of the account - when it signed in, when it was last
// active where idle logout records it, and whether it is this browser - with
// a button that ends just that one. An administrator can end all of another
// account's in Admin Panel / People (adminLogoutUser, in the Audit log).
//
// A session is named by an opaque id made from its hashed token, never the
// token or its hash, so the list gives a page nothing to sign in with.
//
// Pure: the id maker is passed in (server: sha256). tests/sessionList.test.cjs.

const MAX_SESSIONS = 100;

function sessionRows(tokens, { currentHashed, lastActive = {}, idOf }) {
  return (Array.isArray(tokens) ? tokens : [])
    .filter(t => t && typeof t.hashedToken === 'string')
    .slice(-MAX_SESSIONS)
    .map(t => ({
      id: idOf(t.hashedToken),
      when: t.when || null,
      lastActiveAt: lastActive[t.hashedToken] || null,
      current: t.hashedToken === currentHashed,
    }))
    .sort((a, b) => (b.current - a.current) || (new Date(b.when || 0) - new Date(a.when || 0)));
}

// The hashed token a session id names, or null.
function tokenFor(tokens, id, idOf) {
  if (typeof id !== 'string' || !/^[0-9a-f]{16}$/.test(id)) return null;
  const t = (Array.isArray(tokens) ? tokens : []).find(x => x && typeof x.hashedToken === 'string' && idOf(x.hashedToken) === id);
  return t ? t.hashedToken : null;
}

module.exports = { MAX_SESSIONS, sessionRows, tokenFor };
