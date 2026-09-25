'use strict';
// Board policy, separate from a user's drag-handle preference. Missing fields
// on existing/imported boards deliberately retain the historical enabled state.
const DRAG_SETTINGS = [
  { kind: 'swimlane', field: 'allowsSwimlaneDragging', section: 'swimlane', label: 'swimlane' },
  { kind: 'list', field: 'allowsListDragging', section: 'list', label: 'list' },
  { kind: 'card', field: 'allowsCardDragging', section: 'card', label: 'card' },
  { kind: 'checklist', field: 'allowsChecklistDragging', section: 'card', label: 'checklists' },
  { kind: 'item', field: 'allowsChecklistItemDragging', section: 'card', label: 'r-item' },
  { kind: 'subtask', field: 'allowsSubtaskDragging', section: 'card', label: 'subtasks' },
];
function canDrag(board, kind) {
  const setting = DRAG_SETTINGS.find(entry => entry.kind === kind);
  return Boolean(board && setting && board[setting.field] !== false);
}
function canDragSelection(board, selection) {
  return selection.every(entry => canDrag(board, entry.kind));
}
module.exports = { DRAG_SETTINGS, canDrag, canDragSelection };
