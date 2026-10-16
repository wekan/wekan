'use strict';

// A non-negative whole number from the environment, or `fallback` when the
// variable is unset, empty, negative or not a number. The resource monitors and
// the FerretDB governor read their tunables with it.
function intEnv(name, fallback, env = process.env) {
  const n = parseInt(env[name], 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

module.exports = { intEnv };
