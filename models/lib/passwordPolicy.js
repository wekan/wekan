'use strict';

// Which new passwords WeKan accepts (PASSWORD_MIN_LENGTH, PASSWORD_CHECK_PWNED;
// Admin Panel / People / Login overrides each).
//
// WHERE IT CAN BE CHECKED. The browser sends a password to Meteor as its
// SHA-256, so the server never sees the length or the text of a password a
// user types into sign-up, Change Password, a reset or an enrolment. Those
// forms are checked in the browser (config/accounts.js gives useraccounts the
// minimum; client/lib/newPasswordCheck.js asks about breaches). The server
// checks every password that reaches it as text: an administrator's Set
// password and Add user, and POST /users/register. A directory's password
// (LDAP) is the directory's policy, and is not checked here.
//
// THE MINIMUM IS REPORTED BY DEFAULT, AND ENFORCED ONLY WHEN ASKED.
// PASSWORD_MIN_LENGTH (default 8) is the length below which a sign-in is
// listed in Admin Panel / Problems / Password length - nothing is refused for
// it. PASSWORD_MIN_LENGTH_ENFORCE (off by default) is what makes it a rule: a
// shorter NEW password is refused, and an account that signs in with an older
// shorter one is asked to change it before anything else
// (server/passwordChangeRequired.js). Signing in itself is never refused, so
// nobody is locked out by a minimum set after their password. Only the browser
// that typed a password knows how long it is, so it is the browser that tells.
// It covers WeKan's own password accounts: an LDAP, OAuth2, OIDC, SAML, CAS or
// Sandstorm account's password is its provider's, and so is the policy.
//
// BREACHED PASSWORDS (off by default: it asks a service on the Internet). Only
// the first 5 hex digits of the password's SHA-1 leave WeKan - the "range" of
// Have I Been Pwned's k-anonymity API, shared by hundreds of passwords - and
// the comparison with the returned suffixes is done here. A failed lookup
// lets the password through: an unreachable service must not stop anybody
// from setting one.
//
// Pure: no Meteor, no network. Loaded by the server, the client and tests.

// The length below which a sign-in is reported; enforced only with
// PASSWORD_MIN_LENGTH_ENFORCE.
const DEFAULT_MIN_LENGTH = 8;
const MAX_MIN_LENGTH = 256;
// Hashing a password costs time in proportion to its length; nobody types more.
const MAX_LENGTH = 512;

function passwordPolicyConfig(get) {
  const raw = get('PASSWORD_MIN_LENGTH');
  let minLength = DEFAULT_MIN_LENGTH;
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const n = Number(String(raw).trim());
    // A broken value keeps the default.
    if (Number.isInteger(n) && n >= 1) minLength = Math.min(n, MAX_MIN_LENGTH);
  }
  return {
    minLength,
    enforce: String(get('PASSWORD_MIN_LENGTH_ENFORCE') || '').trim() === 'true',
    checkPwned: String(get('PASSWORD_CHECK_PWNED') || '').trim() === 'true',
  };
}

// Is this password shorter than the minimum - enforced or only reported?
// Length is counted in characters (code points), as a person counts them.
function isTooShort(password, config) {
  return !!(config && config.minLength > 0 && typeof password === 'string'
    && [...password].length < config.minLength);
}

// null when the password may be set, else { error, min? }. Unless the minimum
// is enforced, only the length cap applies, as it always did.
function passwordProblem(password, config, { username, email } = {}) {
  if (typeof password !== 'string') return { error: 'password-invalid' };
  if (config.enforce && isTooShort(password, config)) return { error: 'password-too-short', min: config.minLength };
  if ([...password].length > MAX_LENGTH) return { error: 'password-too-long', max: MAX_LENGTH };
  if (!config.enforce) return null;
  const lower = password.toLowerCase();
  for (const name of [username, email, email && String(email).split('@')[0]]) {
    if (name && String(name).length >= 3 && lower === String(name).toLowerCase()) {
      return { error: 'password-same-as-username' };
    }
  }
  return null;
}

const PWNED_PREFIX = /^[0-9A-F]{5}$/;

// The digest the breach lookup compares, as 40 upper-case hex digits. This is
// NOT how WeKan stores passwords - accounts-password keeps those with bcrypt -
// and it is never stored or logged: Have I Been Pwned's range API is keyed by
// SHA-1, so its first 5 digits are the question and the rest is compared with
// the answer, in memory, and dropped. One implementation for the browser and
// the server (Web Crypto, in both), so the two cannot drift apart
// (docs/Security/Password-Breach-Check-Digest-2026-10-31.md, CodeQL #599).
async function breachLookupDigest(text, subtle = globalThis.crypto && globalThis.crypto.subtle) {
  if (!subtle) throw new Error('Web Crypto is not available');
  const digest = await subtle.digest('SHA-1', new TextEncoder().encode(String(text)));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// The suffixes in a range answer ("SUFFIX:COUNT" lines). Padding lines, which
// the API adds with a count of 0, are not breaches.
function parsePwnedRange(body) {
  const suffixes = [];
  for (const line of String(body || '').split(/\r?\n/)) {
    const [suffix, count] = line.trim().split(':');
    if (/^[0-9A-F]{35}$/i.test(suffix || '') && Number(count) > 0) suffixes.push(suffix.toUpperCase());
  }
  return suffixes;
}

// Is the password with this SHA-1 (40 hex digits) among the range's suffixes?
function isPwned(sha1Hex, suffixes) {
  const hex = String(sha1Hex || '').toUpperCase();
  if (!/^[0-9A-F]{40}$/.test(hex)) return false;
  return suffixes.includes(hex.slice(5));
}

module.exports = {
  passwordPolicyConfig,
  passwordProblem,
  isTooShort,
  parsePwnedRange,
  isPwned,
  breachLookupDigest,
  PWNED_PREFIX,
  DEFAULT_MIN_LENGTH,
  MAX_MIN_LENGTH,
  MAX_LENGTH,
};
