'use strict';
// #6745: the jQuery UI sortable options that actually need setting. Pure, so
// tests/largeBoardCardOpen.test.cjs runs it without a browser.
//
// The board re-applies `handle`, `items` and `disabled` from autoruns that
// re-run whenever a user preference or the board changes. jQuery UI does not
// skip an unchanged value: setting `handle` re-tags every item
// (_setHandleClassName -> _addClass per card, each with a $.uniqueSort over
// everything it already tagged), so one list of k cards cost about k^2 work -
// on every card open, in every list. Only a value that differs is set now.
//
//   readCurrent  key -> the option's current value
//   wanted       { key: value, ... }
// Returns the subset of `wanted` whose value differs from the current one.
function changedSortableOptions(readCurrent, wanted) {
  const changes = {};
  Object.keys(wanted || {}).forEach(key => {
    if (readCurrent(key) !== wanted[key]) changes[key] = wanted[key];
  });
  return changes;
}

module.exports = { changedSortableOptions };
