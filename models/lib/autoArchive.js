'use strict';

// Nextcloud Deck-style auto-archive: a board setting that archives cards
// nobody has touched for N days. Off unless a board admin sets a number of
// days in Board Settings; the hourly job is server/autoArchiveCards.js.
//
// "Touched" is the card's dateLastActivity, which every change to the card
// refreshes (models/cards.js autoValue) - the same date the card-aging fade
// (#3984) reads, so a card fades before it is archived.

const AUTO_ARCHIVE_MAX_DAYS = 3650;
const DAY_MS = 24 * 60 * 60 * 1000;
// Archived per board per run, so one huge board cannot hold the job up.
const AUTO_ARCHIVE_BATCH = 200;

// A whole number of days from 1 to 3650, or null (off).
function normalizeAutoArchiveDays(value) {
  if (value === null || value === undefined || value === '') return null;
  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > AUTO_ARCHIVE_MAX_DAYS) return null;
  return days;
}

function autoArchiveCutoff(days, now = new Date()) {
  return new Date(now.getTime() - days * DAY_MS);
}

// The cards of one board to archive now. Templates are never archived: they
// are not work that went stale.
function autoArchiveCardSelector(boardId, days, now = new Date()) {
  return {
    boardId,
    archived: false,
    type: { $ne: 'template-card' },
    dateLastActivity: { $lt: autoArchiveCutoff(days, now) },
  };
}

// Boards with the setting on. Template containers and archived boards are
// left alone.
const AUTO_ARCHIVE_BOARD_SELECTOR = {
  autoArchiveInactiveDays: { $gte: 1 },
  archived: false,
  type: 'board',
};

module.exports = {
  AUTO_ARCHIVE_MAX_DAYS, AUTO_ARCHIVE_BATCH, AUTO_ARCHIVE_BOARD_SELECTOR,
  normalizeAutoArchiveDays, autoArchiveCutoff, autoArchiveCardSelector,
};
