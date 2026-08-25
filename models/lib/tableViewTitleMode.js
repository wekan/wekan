'use strict';

const STORAGE_PREFIX = 'wekan-table-card-title-wrap:';

function tableViewTitleStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'anonymous'}`;
}

function readTableViewTitleWrap(storage, userId) {
  if (!storage) return false;
  return storage.getItem(tableViewTitleStorageKey(userId)) === 'true';
}

function writeTableViewTitleWrap(storage, userId, wrap) {
  if (!storage) return;
  storage.setItem(tableViewTitleStorageKey(userId), wrap ? 'true' : 'false');
}

module.exports = {
  tableViewTitleStorageKey,
  readTableViewTitleWrap,
  writeTableViewTitleWrap,
};
