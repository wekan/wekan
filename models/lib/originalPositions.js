'use strict';

// Board menu → Original positions, the pure half: turn the board's position
// history (models/positionHistory.js, one row per swimlane, list and card,
// written when it was made) into the three groups the sidebar shows, each row
// with the name the thing has NOW, where it was put, its first title when that
// differs, and whether it has moved since. Everything that needs Meteor is
// passed in, so tests/originalPositions.test.cjs runs it as it is.

const GROUPS = [
  { type: 'swimlane', labelKey: 'swimlanes', icon: 'fa-bars' },
  { type: 'list', labelKey: 'lists', icon: 'fa-columns' },
  { type: 'card', labelKey: 'cards', icon: 'fa-sticky-note' },
];

function hasMoved(type, entry, now) {
  if (!now) return false;
  const was = entry.originalPosition || {};
  if (Number.isFinite(was.sort) && Number.isFinite(now.sort) && was.sort !== now.sort) return true;
  if (type !== 'swimlane' && entry.originalSwimlaneId && now.swimlaneId && entry.originalSwimlaneId !== now.swimlaneId) return true;
  if (type === 'card' && entry.originalListId && now.listId && entry.originalListId !== now.listId) return true;
  return false;
}

// "List: Doing · Swimlane: Default" - by the names those have now.
function originalPlace(type, entry, { titleOf, label }) {
  const parts = [];
  if (type === 'card' && entry.originalListId) {
    const name = titleOf('list', entry.originalListId);
    if (name) parts.push(`${label('list')}: ${name}`);
  }
  if (type !== 'swimlane' && entry.originalSwimlaneId) {
    const name = titleOf('swimlane', entry.originalSwimlaneId);
    if (name) parts.push(`${label('swimlane')}: ${name}`);
  }
  return parts.join(' · ');
}

function originalPositionGroups(history, deps) {
  const rows = Array.isArray(history) ? history : [];
  return GROUPS.map(group => ({
    ...group,
    items: rows.filter(entry => entry && entry.entityType === group.type).map(entry => {
      const now = deps.current(group.type, entry.entityId);
      const first = entry.originalTitle || (entry.originalPosition && entry.originalPosition.title) || '';
      const title = (now && now.title) || first;
      return {
        id: entry.entityId,
        title,
        originalTitle: first && first !== title ? first : '',
        originalPlace: originalPlace(group.type, entry, deps),
        moved: hasMoved(group.type, entry, now),
        // A thing that no longer exists (deleted, or not loaded) is shown by
        // its first title, never as "moved".
        exists: !!now,
        createdAt: entry.createdAt ? deps.formatDate(entry.createdAt) : '',
      };
    }),
  })).filter(group => group.items.length);
}

module.exports = { originalPositionGroups, hasMoved };
