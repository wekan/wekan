'use strict';
// Mongo's bare null also matches missing fields, and a bare object can be
// interpreted as query operators. Snapshot values are data, never selectors.
function exactFieldSelector(snapshot, fields) {
  const selector = {};
  for (const field of fields) {
    const value = snapshot[field];
    selector[field] = value === undefined ? { $exists: false }
      : value === null ? { $eq: null, $exists: true }
      : typeof value === 'object' ? { $eq: value } : value;
  }
  return selector;
}
module.exports = { exactFieldSelector };
