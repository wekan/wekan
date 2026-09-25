'use strict';
const { DRAG_SETTINGS } = require('./boardDragging');
const { CARD_SETTINGS_ROWS } = require('./cardSettingsRows');

// Explicit columns rather than client-supplied field names. Reuse the row tables
// so new board-level rows automatically participate in their column action.
function columnFields(section, column) {
  if (column === 'draggable' && ['swimlane', 'list', 'card'].includes(section)) {
    return DRAG_SETTINGS.filter(row => row.section === section).map(row => row.field);
  }
  if (section === 'card' && ['card', 'minicard'].includes(column)) {
    return CARD_SETTINGS_ROWS.map(row => row[column])
      .filter(row => row && !row.personal && !row.needsCard)
      .map(row => row.field === 'allowsLabelText' ? 'showLabelText' : row.field);
  }
  if (column === 'settings') {
    if (section === 'swimlane') return ['swimlaneHeightResizeLocked'];
    if (section === 'list') return ['listWidthResizeLocked', 'sameWidthForAllLists'];
  }
  return [];
}
function columnModifier(section, column, enabled) {
  const fields = columnFields(section, column);
  if (!fields.length || typeof enabled !== 'boolean') return null;
  return { $set: Object.fromEntries(fields.map(field => [field, enabled])) };
}
module.exports = { columnFields, columnModifier };
