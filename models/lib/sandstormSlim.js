// What a Sandstorm grain does NOT have, in one place, for the Admin Panel.
//
// docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md
//
// Inside a grain, Sandstorm itself is the login: sandstorm-http-bridge puts the
// signed-in Sandstorm user on every request, and wekan-accounts-sandstorm makes
// the WeKan account from it. The grain's database is the FerretDB SQLite file
// that sandstorm-src/start.js starts, and its mail goes in and out through the
// grain's own address (server/sandstormEmail.js). So the Sandstorm .spk is built
// WITHOUT the Meteor packages for passwords, OAuth2/OIDC, CAS, LDAP, SAML and
// the rest (releases/sandstorm-slim.mjs), and these panes have nothing behind
// them there: their settings cannot change anything a grain does, and the
// methods several of them call do not exist in that build.
//
// Pure data and one pure filter, so tests/sandstormSlim.test.cjs can check the
// menus without a browser, and the build profile and the menus are pinned to
// the same list.

// Admin Panel / People. Every entry here is a login method, or something that
// only exists because of one (Locked users is the password lockout's list).
// E-mail was already hidden on Sandstorm before this list existed; it is here
// so all the Sandstorm-only gating of this menu reads from one place.
const SANDSTORM_HIDDEN_PEOPLE_PANES = Object.freeze([
  'email-setting',          // SMTP: a grain sends through HackSessionContext
  'registration-setting',   // Login: password sign-up, invitations, login form
  'locked-users-setting',   // accounts-lockout: password brute-force lockouts
  'saml-setting',           // wekan-accounts-saml
  'ldap-setting',           // wekan-ldap
  'oidc-setting',           // wekan-oidc / wekan-accounts-oidc (OAuth2)
  'cas-setting',            // wekan-accounts-cas
  'header-login-setting',   // reverse-proxy header login
  'oauth-setting',          // accounts-google, -github, -facebook, ...
  'passwordless-setting',   // accounts-passwordless
]);

// Admin Panel / Attachments. Database migration moves the whole database
// between MongoDB and FerretDB over a database URL - a grain has exactly one
// database, FerretDB on SQLite, and no other one to move to.
const SANDSTORM_HIDDEN_ATTACHMENTS_PANES = Object.freeze([
  'database-migration',
]);

function isSandstormSettings(settings) {
  return !!(settings && settings.public && settings.public.sandstorm);
}

// Drop the entries a grain has no use for. Off Sandstorm the list comes back
// unchanged (the same array), so no other build can lose a pane through this.
// Null entries, which the menus already use for "not here", are kept for
// buildMenuItems() to drop, so the filter never changes what it does not own.
function withoutSandstormPanes(items, hiddenIds, sandstorm) {
  if (!sandstorm) return items;
  const hidden = new Set(hiddenIds);
  return items.filter(item => !(item && hidden.has(item.id)));
}

// May this pane be opened - from the menu, or from its URL (/people/ldap)?
// A hidden pane must not come back through its address.
function sandstormAllowsPane(paneId, hiddenIds, sandstorm) {
  return !sandstorm || !hiddenIds.includes(paneId);
}

module.exports = {
  SANDSTORM_HIDDEN_PEOPLE_PANES,
  SANDSTORM_HIDDEN_ATTACHMENTS_PANES,
  isSandstormSettings,
  withoutSandstormPanes,
  sandstormAllowsPane,
};
