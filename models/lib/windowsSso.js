'use strict';

// #5758: Windows single sign-on (Kerberos / NTLM, "Integrated Windows
// Authentication") with node-expose-sspi. server/windowsSso.js runs the
// browser's Negotiate handshake; this module is the decision part, plain
// Node so tests/windowsSso.test.cjs can run it without Windows:
//
//   who      the account the handshake proved: DOMAIN\user (NTLM, and what
//            SSPI reports) or user@REALM (a Kerberos principal);
//   allowed  only the domains listed in WINDOWS_SSO_DOMAINS - an empty list
//            lets nobody in, because a trusted domain's accounts would
//            otherwise all be welcome;
//   member   the WeKan account: the one this Windows account signed in as
//            before, else (WINDOWS_SSO_MERGE_EXISTING_USERS=true) the one
//            with the same username or Active Directory e-mail, else a new one.

const NAME_CHARS = /^[A-Za-z0-9._$-]{1,64}$/;
const DOMAIN_CHARS = /^[A-Za-z0-9.-]{1,255}$/;

// "CONTOSO\alice" or "alice@CONTOSO.COM" -> { domain: 'contoso', user: 'alice' }
// (the first label of a realm is its NetBIOS-style short name). null for
// anything else, including a machine account (name ending in $).
function parseWindowsName(raw) {
  const text = typeof raw === 'string' ? raw.trim() : '';
  let domain = '', user = '';
  const slash = text.indexOf('\\');
  if (slash > 0 && text.indexOf('\\', slash + 1) === -1) {
    domain = text.slice(0, slash); user = text.slice(slash + 1);
  } else if (slash === -1 && text.indexOf('@') > 0 && text.indexOf('@') === text.lastIndexOf('@')) {
    [user, domain] = text.split('@');
    domain = domain.split('.')[0];
  } else return null;
  if (!DOMAIN_CHARS.test(domain) || !NAME_CHARS.test(user) || user.endsWith('$')) return null;
  return { domain: domain.toLowerCase(), user: user.toLowerCase() };
}

// WINDOWS_SSO_DOMAINS: comma-separated short domain names (CONTOSO) or DNS
// names (contoso.com, compared by their first label).
function allowedDomains(value) {
  return String(value || '').split(',').map(part => part.trim().toLowerCase().split('.')[0]).filter(part => DOMAIN_CHARS.test(part));
}

function isDomainAllowed(parsed, domains) {
  return !!parsed && Array.isArray(domains) && domains.includes(parsed.domain);
}

// What the WeKan account gets from the handshake and, when
// WINDOWS_SSO_ACTIVE_DIRECTORY=true, from Active Directory (adUser's
// attributes come as arrays of strings).
function first(value) {
  const one = Array.isArray(value) ? value[0] : value;
  return typeof one === 'string' ? one.trim() : '';
}
function windowsProfile(parsed, adUser) {
  const ad = adUser && typeof adUser === 'object' ? adUser : {};
  const mail = first(ad.mail).toLowerCase();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) && mail.length <= 254 ? mail : '';
  const fullname = (first(ad.displayName) || `${first(ad.givenName)} ${first(ad.sn)}`.trim() || parsed.user).slice(0, 200);
  return { id: `${parsed.domain}\\${parsed.user}`, username: parsed.user, fullname, email };
}

// Which existing member this sign-in is: { userId } or { create: username }.
// `find(selector)` returns a user or null. The Windows account's own link
// always wins; matching by name or e-mail is only on request, because a local
// "alice" is not necessarily the domain's alice.
async function resolveMember(profile, { find, merge = false } = {}) {
  const linked = await find({ 'services.windowsSso.id': profile.id });
  if (linked) return { userId: linked._id };
  if (merge) {
    const byName = await find({ username: profile.username });
    if (byName) return { userId: byName._id, link: true };
    if (profile.email) {
      const byMail = await find({ 'emails.address': profile.email });
      if (byMail) return { userId: byMail._id, link: true };
    }
  }
  // A new account, under a free username: alice, alice-2, alice-3, ...
  for (let n = 1; n <= 50; n += 1) {
    const username = n === 1 ? profile.username : `${profile.username}-${n}`;
    if (!await find({ username })) return { create: username };
  }
  return { refused: 'windows-sso-username-taken' };
}

// Where node-expose-sspi is looked for: it is Windows-only and installed by
// the admin into the bundle (docs/Features/Login/WindowsSSO.md), never a
// dependency every platform downloads.
function moduleSearchBases({ cwd, mainScript }) {
  const bases = [];
  const add = dir => { if (dir && !bases.includes(dir)) bases.push(dir); };
  const join = (...parts) => parts.join('/').replace(/\\/g, '/').replace(/\/+/g, '/');
  if (mainScript) {
    const dir = String(mainScript).replace(/\\/g, '/').replace(/\/[^/]*$/, '');
    add(join(dir, 'programs/server'));
    add(dir);
  }
  if (cwd) {
    add(join(cwd, 'programs/server'));
    add(String(cwd).replace(/\\/g, '/'));
  }
  return bases;
}

// Enabled only on Windows, and only when asked.
function windowsSsoEnabled({ platform, env }) {
  return platform === 'win32' && String((env && env.WINDOWS_SSO_ENABLED) || '').trim() === 'true';
}

module.exports = { parseWindowsName, allowedDomains, isDomainAllowed, windowsProfile, resolveMember, moduleSearchBases, windowsSsoEnabled };
