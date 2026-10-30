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
// A longer minimum applies to NEW passwords only: signing in is never checked,
// so an existing shorter password keeps working until it is next changed.
//
// BREACHED PASSWORDS (off by default: it asks a service on the Internet). Only
// the first 5 hex digits of the password's SHA-1 leave WeKan - the "range" of
// Have I Been Pwned's k-anonymity API, shared by hundreds of passwords - and
// the comparison with the returned suffixes is done here. A failed lookup
// lets the password through: an unreachable service must not stop anybody
// from setting one.
//
// Pure: no Meteor, no network. Loaded by the server, the client and tests.

const DEFAULT_MIN_LENGTH = 8;
const MAX_MIN_LENGTH = 256;
// Hashing a password costs time in proportion to its length; nobody types more.
const MAX_LENGTH = 512;

function passwordPolicyConfig(get) {
  const raw = get('PASSWORD_MIN_LENGTH');
  let minLength = DEFAULT_MIN_LENGTH;
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const n = Number(String(raw).trim());
    // A broken value keeps the default rather than accepting any password.
    if (Number.isInteger(n) && n >= 1) minLength = Math.min(n, MAX_MIN_LENGTH);
  }
  return {
    minLength,
    checkPwned: String(get('PASSWORD_CHECK_PWNED') || '').trim() === 'true',
  };
}

// null when the password is acceptable, else { error, min? }. Length is
// counted in characters (code points), as a person counts them.
function passwordProblem(password, config, { username, email } = {}) {
  if (typeof password !== 'string') return { error: 'password-invalid' };
  const length = [...password].length;
  if (length < config.minLength) return { error: 'password-too-short', min: config.minLength };
  if (length > MAX_LENGTH) return { error: 'password-too-long', max: MAX_LENGTH };
  const lower = password.toLowerCase();
  for (const name of [username, email, email && String(email).split('@')[0]]) {
    if (name && String(name).length >= 3 && lower === String(name).toLowerCase()) {
      return { error: 'password-same-as-username' };
    }
  }
  return null;
}

const PWNED_PREFIX = /^[0-9A-F]{5}$/;

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
  parsePwnedRange,
  isPwned,
  PWNED_PREFIX,
  DEFAULT_MIN_LENGTH,
  MAX_MIN_LENGTH,
  MAX_LENGTH,
};
