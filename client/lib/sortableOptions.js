const { changedSortableOptions } = require('/models/lib/sortableOptions');

// #6745: set jQuery UI sortable options only when their value changed - see
// models/lib/sortableOptions.js. `$el` must already be a sortable.
export function setSortableOptions($el, wanted) {
  const changes = changedSortableOptions(key => $el.sortable('option', key), wanted);
  if (Object.keys(changes).length > 0) $el.sortable('option', changes);
}
