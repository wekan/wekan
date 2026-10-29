'use strict';

// #1188: on Sandstorm, a WeKan address is the inside of a grain - nobody can
// open it on its own, and a grain's own URL only reaches people it is shared
// with. So Copy card URL asks the Sandstorm shell to share the card instead:
// a { startSharing: { pathname } } message opens Sandstorm's Share Access
// dialog, whose sharing link opens the grain at that card
// (https://docs.sandstorm.org/en/latest/developing/path/#helping-the-user-share-access).
// The shell requires the path to start with "/" and accepts only
// { pathname, hash } (sandstorm shell grain-client.js). Pure:
// tests/sandstormShare.test.cjs.

function sandstormSharePath(url) {
  let u;
  try { u = new URL(String(url || ''), 'http://grain.invalid'); } catch (e) { return null; }
  const pathname = u.pathname;
  if (!pathname || pathname.charAt(0) !== '/' || pathname.includes('/../') || pathname.endsWith('/..')) return null;
  return pathname;
}

function startSharingMessage(url) {
  const pathname = sandstormSharePath(url);
  return pathname ? { startSharing: { pathname } } : null;
}

module.exports = { sandstormSharePath, startSharingMessage };
