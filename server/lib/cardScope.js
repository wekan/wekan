// Pure, dependency-free helper for scoping "select all cards" to a swimlane
// (#5623). The implementation lives in models/lists.js (an isomorphic model
// file) so client and server share identical logic and the client build does
// not import anything from the server-only directory. This module re-exports
// the pure function at the documented test path and is itself free of any
// Meteor / Mongo / reactive-cache runtime dependency.
//
// See server/lib/tests/selectAllSwimlane.tests.js.
export { filterCardsByListAndSwimlane } from '/models/lists';
