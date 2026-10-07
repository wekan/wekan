'use strict';
// #6745: the field projection a client helper uses to read only the parts of
// the current user it actually needs. Pure, so tests/userFieldsProjection.test.cjs
// runs it without Meteor.
//
// Minimongo re-runs a field-limited query only when one of the PROJECTED fields
// changed (LocalCollection._updateInResults diffs projectionFn(doc) against
// projectionFn(oldDoc)). A minicard helper that reads the whole user document
// (Meteor.user(), ReactiveCache.getCurrentUser()) instead re-runs on EVERY
// write to that document - and opening a card writes one
// (profile.cardLastViews, #3078). On a large board that was every helper of
// every minicard, several seconds per card open.
//
// A path is dot-separated, and each segment must be a key the profile maps
// already accept (models/lib/safeMapKey.js): no '.', no leading '$', not a
// prototype name. A card or board id interpolated into a path therefore cannot
// turn the projection into something else.
const { isSafeMapKey } = require('./safeMapKey');

function isUserFieldPath(path) {
  return typeof path === 'string' && path.length > 0 && path.length <= 512 &&
    path.split('.').every(isSafeMapKey);
}

// ['profile.a', 'profile.b.<id>'] -> { 'profile.a': 1, 'profile.b.<id>': 1 },
// or null when any path is not one - the caller then reads the whole document,
// which is slower but never wrong, instead of failing inside a template helper.
function userFieldsProjection(paths) {
  const list = Array.isArray(paths) ? paths : [paths];
  if (list.length === 0 || !list.every(isUserFieldPath)) return null;
  const fields = {};
  list.forEach(path => { fields[path] = 1; });
  return fields;
}

module.exports = { isUserFieldPath, userFieldsProjection };
