// GHSA-rf3w-rj48-jxcc: a lockout firing is an ATTEMPT that the fix refused, so
// it belongs in Admin Panel -> Problems. A Meteor package cannot import app
// code, so this reporter is injected into AccountsLockout, at startup and when
// the settings are reloaded - one function for both, so they cannot drift.
// Wrapped, because the record of the defence must never break the defence.
//
// JamBleed, again: the account named here is the one being GUESSED - the
// victim, not the actor. Recorded as its `userId`, a high-severity 'blocked'
// event disabled that account (server/lib/blockOnSecurityEvent.js), so three
// wrong passwords from anyone who knew a username locked its owner out until
// an admin noticed, and a user who mistyped their own password three times
// was disabled the same way. It is the TARGET, so it is recorded as one.
export function reportLockout({ userId, username, ip, headers, failedAttempts, lockoutSeconds }) {
  try {
    require('/server/lib/securityLog').record({
      key: 'brute.lockout',
      action: 'blocked',
      source: 'DDP login',
      targetUserId: userId,
      ip,
      location: require('/models/lib/geoHeaders').locationFromHeaders(headers),
      detail: `locked one address out of account ${username || userId} after ${failedAttempts} `
        + `wrong passwords, for ${lockoutSeconds}s`,
    });
  } catch (e) { /* logging must never break the guard */ }
}
