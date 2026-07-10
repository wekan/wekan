'use strict';

// Pure, Meteor-free helper: detect a MongoDB `$where` clause (server-side
// JavaScript execution) anywhere in a selector tree. Used by the windowed card
// publication (server/publications/cardsWindow.js) to refuse a client-supplied
// selector that carries `$where`, since that selector is run against the
// database. Unit-tested in tests/mongoSelectorSafety.test.cjs.
function hasWhere(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (hasWhere(item)) return true;
    }
    return false;
  }
  for (const key of Object.keys(obj)) {
    if (key === '$where') return true;
    if (hasWhere(obj[key])) return true;
  }
  return false;
}

module.exports = { hasWhere };
