'use strict';

// The login lockout's settings, read the same way everywhere they are read:
// the server's startup (server/accounts-lockout-config.js), the Admin Panel's
// reload (server/methods/lockoutSettings.js) and the model's helpers
// (models/lockoutSettings.js).
//
// WHY one module. The increasing delay after a wrong password (per user and
// source address, packages/wekan-accounts-lockout/src/lockoutDecision.js) was
// never applied: both places that START the lockout built its settings from
// failuresBeforeLockout, lockoutPeriod and failureWindow only, so
// loginDelayBase reached the decision as undefined - a base of 0, which is
// "delays off". Only the model's getKnownConfig() knew the delay's defaults,
// and nothing on the server called it. Three hand-written copies of one list
// had drifted; this is the one list now.
//
// Pure, no Meteor imports: tests/lockoutDelayApplied.test.cjs.

const KNOWN_DEFAULTS = Object.freeze({
  failuresBeforeLockout: 3,
  lockoutPeriod: 60,
  failureWindow: 15,
  // Seconds after the first wrong password, doubling with each one after it
  // up to loginDelayMax. 0 switches the delays off.
  loginDelayBase: 1,
  loginDelayMax: 30,
});

const UNKNOWN_DEFAULTS = Object.freeze({
  failuresBeforeLockout: 3,
  lockoutPeriod: 60,
  failureWindow: 15,
});

// The delay may be switched off with 0; the counters may not be 0 (the
// package refuses a lockout that never locks, lockoutSettings.js).
const ZERO_ALLOWED = new Set(['loginDelayBase', 'loginDelayMax']);

// A stored value, or the default when it is missing or not usable.
function settingValue(key, raw, fallback) {
  const n = typeof raw === 'number' ? raw : (typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN);
  if (!Number.isFinite(n) || n < 0) return fallback;
  if (n === 0 && !ZERO_ALLOWED.has(key)) return fallback;
  return n;
}

// { knownUsers, unknownUsers } from `read(id)`, which answers a setting's
// stored value (or undefined). A read that throws - a database that is slow or
// restarting at startup - gives that one setting its default: one failed read
// must not leave the server with no lockout at all.
async function lockoutConfigs(read, onReadError = () => {}) {
  const one = async (prefix, key, fallback) => {
    const id = `${prefix}-${key}`;
    try {
      return settingValue(key, await read(id), fallback);
    } catch (error) {
      onReadError(id, fallback, error);
      return fallback;
    }
  };
  const knownUsers = {};
  for (const [key, fallback] of Object.entries(KNOWN_DEFAULTS)) {
    knownUsers[key] = await one('known', key, fallback);
  }
  const unknownUsers = {};
  for (const [key, fallback] of Object.entries(UNKNOWN_DEFAULTS)) {
    unknownUsers[key] = await one('unknown', key, fallback);
  }
  return { knownUsers, unknownUsers };
}

// The same from a { id: value } map, for the model's synchronous helpers.
function configFromMap(prefix, values) {
  const defaults = prefix === 'known' ? KNOWN_DEFAULTS : UNKNOWN_DEFAULTS;
  const out = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    out[key] = settingValue(key, (values || {})[`${prefix}-${key}`], fallback);
  }
  return out;
}

module.exports = { KNOWN_DEFAULTS, UNKNOWN_DEFAULTS, settingValue, lockoutConfigs, configFromMap };
