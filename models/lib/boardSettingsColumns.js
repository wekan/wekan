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
    // A Scrum row's flag lives in the board's Scrum settings, named by its path.
    return CARD_SETTINGS_ROWS.map(row => row[column])
      .filter(row => row && !row.personal && !row.needsCard)
      .map(row => (row.scrum ? `${SCRUM_PATH}${row.scrum}`
        : row.field === 'allowsLabelText' ? 'showLabelText' : row.field));
  }
  if (column === 'settings') {
    if (section === 'swimlane') return ['swimlaneHeightResizeLocked'];
    if (section === 'list') return ['listWidthResizeLocked', 'sameWidthForAllLists'];
  }
  return [];
}
const SCRUM_PATH = 'scrum.visibility.';
// The board's own flags. The Scrum ones are not here: they are saved through
// scrum.configure (columnScrumVisibility), which keeps its lock, its revision
// and its Scrum history.
function columnModifier(section, column, enabled) {
  const fields = columnFields(section, column).filter(field => !field.startsWith(SCRUM_PATH));
  if (!fields.length || typeof enabled !== 'boolean') return null;
  return { $set: Object.fromEntries(fields.map(field => [field, enabled])) };
}
// The Scrum visibility flags of a column, as scrum.configure takes them.
function columnScrumVisibility(section, column, enabled) {
  if (typeof enabled !== 'boolean') return {};
  return Object.fromEntries(columnFields(section, column).filter(field => field.startsWith(SCRUM_PATH))
    .map(field => [field.slice(SCRUM_PATH.length), enabled]));
}
module.exports = { columnFields, columnModifier, columnScrumVisibility };
