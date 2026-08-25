'use strict';

const STORAGE_PREFIX = 'wekan-table-group-swimlanes:';

function tableViewGroupingStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'anonymous'}`;
}

function readTableViewGrouping(storage, userId) {
  return !!storage && storage.getItem(tableViewGroupingStorageKey(userId)) === 'true';
}

function writeTableViewGrouping(storage, userId, enabled) {
  if (storage) {
    storage.setItem(tableViewGroupingStorageKey(userId), enabled ? 'true' : 'false');
  }
}

function addSwimlaneGroupHeaders(rows) {
  const result = [];
  let previousId;
  for (const row of rows || []) {
    if (row.swimlaneId !== previousId) {
      result.push({
        isGroupHeader: true,
        swimlaneId: row.swimlaneId,
        swimlaneTitle: row.swimlaneTitle,
      });
      previousId = row.swimlaneId;
    }
    result.push(row);
  }
  return result;
}

module.exports = {
  tableViewGroupingStorageKey,
  readTableViewGrouping,
  writeTableViewGrouping,
  addSwimlaneGroupHeaders,
};
