'use strict';

// Meteor's own packages that WeKan carries in packages/ with the Meteor 3.5.3
// security fixes (docs/Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md).
// They are Meteor's code and Meteor's tests, not WeKan's: a suite that checks
// WeKan's own publications, methods or subscriptions skips them, while
// tests/meteor353SecurityFixes.test.cjs checks them.
const METEOR_PACKAGE_FORKS = Object.freeze([
  'allow-deny', 'ddp-server', 'dynamic-import', 'facebook-oauth', 'google-oauth', 'shell-server',
]);

// Whether a repository-relative path is inside one of the forks.
function isMeteorPackageFork(rel) {
  const parts = String(rel).split(/[\\/]/);
  return parts[0] === 'packages' && METEOR_PACKAGE_FORKS.includes(parts[1]);
}

module.exports = { METEOR_PACKAGE_FORKS, isMeteorPackageFork };
