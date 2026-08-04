'use strict';

// GHSA-2g94-9x3m-hv37 (User Enumeration via a bcrypt timing side-channel).
//
// The accounts-password login path runs a bcrypt comparison (~50 ms) only when
// the user exists and has a local password. For a missing user — or a user with
// no local password (LDAP/OIDC-only) — it throws immediately (~2 ms) before any
// bcrypt work. The two response-time distributions do not overlap, so an
// unauthenticated attacker can tell whether any given username/email exists with
// near-100% reliability, regardless of the uniform error TEXT.
//
// The mitigation is the standard one: whenever the real path would SKIP bcrypt,
// perform one dummy bcrypt comparison against a fixed hash so the missing-user
// path costs about the same as a real password check. This module holds the
// fixed hash and the (injectable, therefore unit-testable) equalizer; callers
// wire it into the DDP login handler and the REST /users/login endpoint.

// A fixed, valid bcrypt hash at cost 10 — the WeKan/Meteor default
// (`Accounts._bcryptRounds()` returns `Accounts._options.bcryptRounds || 10`).
// Nothing is ever authenticated against it; it exists only so the comparison
// burns the same CPU time as a genuine one. Operators who raise `bcryptRounds`
// get a slightly cheaper dummy than a real compare, but the lockout / throttle
// remain the primary brute-force defence and the enumeration gap is still closed
// from ~25x down to a small, noisy fraction.
const DUMMY_BCRYPT_HASH =
  '$2b$10$f6f8Df.OmbBZaWVJXskm5.ybxXgzBuOrn9YLbritPO/6gtCj7qJci';

// The client sends the password pre-hashed as { digest: sha256hex, algorithm }.
// Any 64-hex digest is a well-formed value for the dummy compare to consume.
const DUMMY_DIGEST = '0'.repeat(64);

// A user-shaped object carrying the dummy hash, in the exact shape
// `Accounts._checkPasswordAsync` reads (`services.password.bcrypt`).
function dummyUser() {
  return {
    _id: 'wekan-timing-normalization',
    services: { password: { bcrypt: DUMMY_BCRYPT_HASH } },
  };
}

// Detects whether a looked-up user actually has a local password to compare
// against. Mirrors accounts-password `getUserPasswordHash` (argon2 or bcrypt).
function hasLocalPassword(user) {
  return !!(
    user &&
    user.services &&
    user.services.password &&
    (user.services.password.bcrypt || user.services.password.argon2)
  );
}

// Run one dummy bcrypt comparison so a "no real bcrypt happened" path takes ~the
// same wall-clock time as a real one. `checkPasswordAsync` is injected (the
// caller passes `Accounts._checkPasswordAsync`) so this stays testable without
// Meteor. Never throws and never returns anything meaningful — it exists purely
// for its timing side effect.
async function equalizeMissingUserTiming(checkPasswordAsync) {
  if (typeof checkPasswordAsync !== 'function') return;
  try {
    await checkPasswordAsync(dummyUser(), {
      digest: DUMMY_DIGEST,
      algorithm: 'sha-256',
    });
  } catch (e) {
    // The comparison's result and any error are irrelevant; we only wanted the
    // time it took. Swallow everything.
  }
}

module.exports = {
  DUMMY_BCRYPT_HASH,
  DUMMY_DIGEST,
  dummyUser,
  hasLocalPassword,
  equalizeMissingUserTiming,
};
