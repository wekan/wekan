// Pure, dependency-free helper for rendering custom-field number values (#2091).
//
// A "number" type Custom Field can be given a value and then cleared (set to
// blank). Clearing the input parses to NaN, and naive rendering then displays
// the literal string "NaN" instead of an empty value. This helper normalizes
// any empty / null / undefined / non-numeric value (including NaN) to an empty
// string, and otherwise returns the numeric value as a string.
//
// Lives under /imports/lib so it is isomorphic (shared by the client card
// detail / minicard renderers) and free of any Meteor/Mongo runtime
// dependency, so it can also be unit tested directly.
export function formatNumberValue(value) {
  // Reject blank/empty-ish values up front so '' / null / undefined render empty.
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const num = Number(value);
  // Number('') is 0, but we've already excluded ''. Anything that is not a
  // finite number (NaN, Infinity, 'abc', ...) renders as empty.
  if (!Number.isFinite(num)) {
    return '';
  }
  return String(num);
}
