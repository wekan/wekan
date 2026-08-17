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
function recoveryReportQuery(searchTerm, status = 'all') {
  const clauses = [];
  if (searchTerm) {
    const re = searchRegex(searchTerm);
    clauses.push({ $or: [{ type: re }, { detail: re }, { db: re }] });
  }

  if (status === 'done') {
    // Events written before the outcome field was introduced were successful.
    clauses.push({ $or: [{ done: true }, { done: { $exists: false } }] });
  } else if (status === 'failed') {
    clauses.push({ done: false });
  } else if (status === 'deleted') {
    clauses.push({ deletedData: true });
  }

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

module.exports = { recoveryReportQuery, searchRegex };
