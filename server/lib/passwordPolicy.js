import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { authEnv } from '/server/lib/authConfig';

// The server's half of the password policy: what it is, why the browser
// checks most of it, and what "breached" means are in models/lib/passwordPolicy.js.
const {
  passwordPolicyConfig, passwordProblem, parsePwnedRange, isPwned, breachLookupDigest, PWNED_PREFIX,
} = require('/models/lib/passwordPolicy');

const PWNED_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const PWNED_TIMEOUT_MS = 5000;

const REASONS = {
  'password-too-short': p => `The password must be at least ${p.min} characters long.`,
  'password-too-long': p => `The password must be at most ${p.max} characters long.`,
  'password-same-as-username': () => 'The password must not be the username or the email address.',
  'password-invalid': () => 'The password is not valid.',
  'password-pwned': () => 'This password has appeared in a data breach. Choose another one.',
};

export function currentPasswordPolicy() {
  return passwordPolicyConfig(authEnv);
}

// The suffixes of one SHA-1 range, or null when the service cannot answer.
export async function fetchPwnedRange(prefix) {
  if (!PWNED_PREFIX.test(prefix)) return null;
  try {
    const response = await fetch(PWNED_RANGE_URL + prefix, {
      // Padding makes every answer about the same size, so the size of the
      // answer says nothing about which range was asked for.
      headers: { 'Add-Padding': 'true', 'User-Agent': 'WeKan' },
      signal: AbortSignal.timeout(PWNED_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return parsePwnedRange(await response.text());
  } catch (e) {
    console.warn('[password-policy] breached-password lookup failed:', e && e.message);
    return null;
  }
}

async function pwned(password) {
  let digest;
  try {
    digest = await breachLookupDigest(password);
  } catch (e) {
    // Like an unreachable service: the check never stops a password.
    return false;
  }
  const suffixes = await fetchPwnedRange(digest.slice(0, 5));
  return suffixes ? isPwned(digest, suffixes) : false;
}

// Throws a Meteor.Error when a password that reached the server as text may
// not be set. `who` is { username, email } of the account it is for.
export async function assertNewPassword(password, who = {}) {
  const config = currentPasswordPolicy();
  const problem = passwordProblem(password, config, who);
  if (problem) throw new Meteor.Error(problem.error, REASONS[problem.error](problem), problem);
  if (config.checkPwned && await pwned(password)) {
    throw new Meteor.Error('password-pwned', REASONS['password-pwned']());
  }
}

Meteor.methods({
  // What the sign-up, Change Password and reset forms check before they send
  // the password, which they send hashed. Public: the sign-up form asks it.
  getPasswordPolicy() {
    const { minLength, enforce, checkPwned } = currentPasswordPolicy();
    return { minLength, enforce, checkPwned };
  },

  // The breached suffixes of one 5-hex-digit SHA-1 range, for the browser to
  // compare with its own password's hash; the password never leaves it. Only
  // while PASSWORD_CHECK_PWNED is on; null when the service cannot answer.
  async passwordPwnedRange(prefix) {
    check(prefix, Match.Where(p => typeof p === 'string' && PWNED_PREFIX.test(p)));
    if (!currentPasswordPolicy().checkPwned) return null;
    return fetchPwnedRange(prefix);
  },
});

// A sign-up page may ask, so there is no login to limit by; one connection
// asks once per form submit.
DDPRateLimiter.addRule({ type: 'method', name: 'passwordPwnedRange' }, 20, 60 * 1000);
