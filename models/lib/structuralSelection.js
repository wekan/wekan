'use strict';
const kinds = ['swimlane', 'list', 'card', 'checklist', 'item'];
function selectionRoots(entries) {
  const unique = [...new Map(entries.map(entry => [`${entry.kind}:${entry._id}`, entry])).values()];
  const selected = new Set(unique.map(entry => `${entry.kind}:${entry._id}`));
  return unique.filter(entry => !(entry.ancestors || []).some(key => selected.has(key)))
    .sort((a, b) => kinds.indexOf(a.kind) - kinds.indexOf(b.kind) || (a.sort || 0) - (b.sort || 0) || a._id.localeCompare(b._id));
}
module.exports = { kinds, selectionRoots };
