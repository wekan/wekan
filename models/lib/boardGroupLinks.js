'use strict';

// #5141: a board admin may add to a board only the organizations and teams
// they belong to themselves; a site administrator may add any. What is
// already on the board stays (it may have been added by someone else), and
// removing or switching off a link is always allowed.
// Pure: tests/boardGroupLinks.test.cjs.

// The ids `next` adds to `previous` that this user may not add.
function forbiddenNewGroupIds({ previous = [], next = [], key, ownIds = [], isSiteAdmin = false }) {
  if (isSiteAdmin) return [];
  const before = new Set((Array.isArray(previous) ? previous : []).map(g => g && g[key]).filter(Boolean));
  const own = new Set(Array.isArray(ownIds) ? ownIds : []);
  return [...new Set((Array.isArray(next) ? next : []).map(g => g && g[key]).filter(Boolean))]
    .filter(id => !before.has(id) && !own.has(id));
}

// What the add pickers offer: the user's own groups, or all for a site admin.
function offeredGroups(groups, ownIds, isSiteAdmin) {
  const list = Array.isArray(groups) ? groups : [];
  if (isSiteAdmin) return list;
  const own = new Set(Array.isArray(ownIds) ? ownIds : []);
  return list.filter(g => g && own.has(g._id));
}

module.exports = { forbiddenNewGroupIds, offeredGroups };
