// Pure, dependency-free helpers for list / swimlane colors (#5382). The
// implementation lives in models/lists.js (an isomorphic model file) so client
// and server share identical logic and the client build does not import
// anything from the server-only directory. This module re-exports the pure
// helpers at the documented test path and is itself free of any Meteor / Mongo
// / reactive-cache runtime dependency.
//
// Bug: choosing the `silver` color for a list (or swimlane) saved/displayed it
// as `None` instead of silver, because an offered-but-unsupported color fell
// back to None. `ALLOWED_LIST_COLORS` is the canonical allowed-color list
// (which now includes `silver`) and `normalizeListColor` returns the color when
// allowed and '' (None) otherwise.
//
// See server/lib/tests/listColor.tests.js.
export { ALLOWED_LIST_COLORS, normalizeListColor } from '/models/lists';
