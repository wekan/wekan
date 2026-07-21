'use strict';

// #6492 Admin Panel / Problems / Recovery report search selector. Meteor-free so it
// can be unit tested (see tests/recoveryReportQuery.test.cjs).

// searchRegex escapes a user-supplied term so it is matched literally (and
// case-insensitively), not interpreted as a regular expression.
function searchRegex(term) {
  return new RegExp(String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// recoveryReportQuery returns the Mongo selector for the recovery events matching the
// (optional) search term across the type / detail / db fields. An empty term matches
// everything.
function recoveryReportQuery(searchTerm) {
  if (!searchTerm) {
    return {};
  }

  const re = searchRegex(searchTerm);
  return { $or: [{ type: re }, { detail: re }, { db: re }] };
}

module.exports = { recoveryReportQuery, searchRegex };
