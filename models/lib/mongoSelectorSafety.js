'use strict';

// Pure, Meteor-free helper: detect the operators that make a MongoDB selector
// EXECUTE JAVASCRIPT on the database, anywhere in a selector tree. Used by the
// windowed card publication (server/publications/cardsWindow.js) and by
// server/lib/selectorGuard.js to refuse a client-supplied selector that carries
// one, since that selector is run against the database.
// Unit-tested in tests/mongoSelectorSafety.test.cjs.
//
// WhereBleed was `$where`, and for a long time `$where` was the only way a find()
// could run code. It is not any more, and this helper only knew the old one
// (found by tests/fixedVulnerabilityClasses.test.cjs, which asks whether a fixed
// mistake exists anywhere else):
//
//   $where        the original: a JavaScript predicate per document
//   $expr + $function   MongoDB 4.4+ allows an aggregation expression inside a
//                 FIND filter, and $function runs a JavaScript body with
//                 arguments - the same capability, reachable through the same
//                 client-supplied selector
//   $accumulator  the same, for a grouping stage, and equally a code body
//
// So the test is "does this selector carry executable JavaScript", not "does it
// say $where". The name hasWhere stays because that is what every caller asks for
// and what the vulnerability is called; hasServerSideJs is the honest alias.
//
// It is deliberately not a whitelist of allowed operators: a selector is data
// from a client, and the property being checked here is one specific, catastrophic
// capability. Field-level authorisation is a different guard
// (server/lib/selectorGuard.js) and stays there.

// Operators whose value is a JavaScript body the database will run.
const SERVER_SIDE_JS_OPERATORS = new Set([
  '$where',
  '$function',
  '$accumulator',
]);

function hasServerSideJs(obj, seen) {
  if (!obj || typeof obj !== 'object') return false;
  // A selector arrives as JSON over DDP, but a cycle costs nothing to survive and
  // an infinite recursion in a security check is a denial of service of its own.
  const visited = seen || new Set();
  if (visited.has(obj)) return false;
  visited.add(obj);

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (hasServerSideJs(item, visited)) return true;
    }
    return false;
  }
  for (const key of Object.keys(obj)) {
    if (SERVER_SIDE_JS_OPERATORS.has(key)) return true;
    if (hasServerSideJs(obj[key], visited)) return true;
  }
  return false;
}

// The name the callers and the advisory use.
const hasWhere = hasServerSideJs;

module.exports = { hasWhere, hasServerSideJs, SERVER_SIDE_JS_OPERATORS };
