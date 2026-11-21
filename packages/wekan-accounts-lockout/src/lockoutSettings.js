'use strict';

// The settings of one lockout counter - failuresBeforeLockout, lockoutPeriod,
// failureWindow - read and checked the same way for known users
// (knownUser.js) and unknown users (unknownUser.js), which each used to carry
// their own copy of all of this.
//
// Meteor.settings['accounts-lockout'].knownUsers / .unknownUsers, as the README
// documents it, is an OBJECT that overrides the configured values. Both copies
// read it with `settings.forEach(function ({ key, value }) { this.settings[key]
// = value; })`: an object has no forEach, so startup() threw before it hooked
// into Accounts, and the brute-force protection was silently never installed.
// (An array would have reached the callback, where `this` is undefined.)
// Pure: tests/lockoutSettings.test.cjs.

function validateLockoutSettings(settings) {
  const s = settings || {};
  if (!s.failuresBeforeLockout || s.failuresBeforeLockout < 0) {
    throw new Error('"failuresBeforeLockout" is not positive integer');
  }
  if (!s.lockoutPeriod || s.lockoutPeriod < 0) {
    throw new Error('"lockoutPeriod" is not positive integer');
  }
  if (!s.failureWindow || s.failureWindow < 0) {
    throw new Error('"failureWindow" is not positive integer');
  }
  return s;
}

// The configured settings with Meteor.settings' override on top. Only a plain
// object overrides; anything else leaves the configured values as they are.
function mergeLockoutSettings(settings, override) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return settings;
  return { ...settings, ...override };
}

// Meteor.settings['accounts-lockout'][kind], or false when there is none.
function lockoutSettingsOverride(meteorSettings, kind) {
  const section = meteorSettings && meteorSettings['accounts-lockout'];
  return (section && section[kind]) || false;
}

module.exports = { validateLockoutSettings, mergeLockoutSettings, lockoutSettingsOverride };
