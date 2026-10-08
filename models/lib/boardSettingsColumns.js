'use strict';
const { DRAG_SETTINGS } = require('./boardDragging');
const { CARD_SETTINGS_ROWS } = require('./cardSettingsRows');
const { fieldKeyOfRow } = require('./cardFieldVisibility');

// Explicit columns rather than client-supplied field names. Reuse the row tables
// so new board-level rows automatically participate in their column action.
// `hiddenKeys` are the card fields unticked in Admin Panel / Settings /
// Visibility / Features (models/lib/cardFieldVisibility.js): their rows are not
// offered, so a whole-column tick leaves the board's own value of them as it
// was, for when the administrator ticks them again.
function columnFields(section, column, hiddenKeys = []) {
  if (column === 'draggable' && ['swimlane', 'list', 'card'].includes(section)) {
    return DRAG_SETTINGS.filter(row => row.section === section).map(row => row.field);
  }
  if (section === 'card' && ['card', 'minicard'].includes(column)) {
    // A Scrum row's flag lives in the board's Scrum settings, named by its path.
    const hidden = Array.isArray(hiddenKeys) ? hiddenKeys : [];
    return CARD_SETTINGS_ROWS.filter(row => !hidden.includes(fieldKeyOfRow(row.key)))
      .map(row => row[column])
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
function columnModifier(section, column, enabled, hiddenKeys = []) {
  const fields = columnFields(section, column, hiddenKeys).filter(field => !field.startsWith(SCRUM_PATH));
  if (!fields.length || typeof enabled !== 'boolean') return null;
  return { $set: Object.fromEntries(fields.map(field => [field, enabled])) };
}
// The Scrum visibility flags of a column, as scrum.configure takes them.
function columnScrumVisibility(section, column, enabled, hiddenKeys = []) {
  if (typeof enabled !== 'boolean') return {};
  return Object.fromEntries(columnFields(section, column, hiddenKeys).filter(field => field.startsWith(SCRUM_PATH))
    .map(field => [field.slice(SCRUM_PATH.length), enabled]));
}
module.exports = { columnFields, columnModifier, columnScrumVisibility };
