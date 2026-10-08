'use strict';

// #1566: "announcements for boards ... the same way we have announcement for
// the site but one different for each board." A board admin writes one; every
// member sees it on the board until they dismiss it, and sees it again when it
// is edited (the version is when it was last saved).
//
// Pure: tested by tests/boardAnnouncement.test.cjs.
const MAX_BOARD_ANNOUNCEMENT = 2000;

function boardAnnouncementVersion(board) {
  const a = board && board.announcement;
  return a && a.updatedAt instanceof Date && Number.isFinite(a.updatedAt.getTime()) ? a.updatedAt.toISOString() : null;
}

// Shown when enabled, not empty, and not dismissed at this version.
function showBoardAnnouncement(board, dismissed) {
  const a = board && board.announcement;
  if (!a || a.enabled !== true || typeof a.body !== 'string' || !a.body.trim()) return false;
  const version = boardAnnouncementVersion(board);
  const seen = dismissed && typeof dismissed === 'object' ? dismissed[board._id] : undefined;
  return !version || seen !== version;
}

// The stored form of an edit: enabled flag, trimmed text, when it was saved.
function cleanBoardAnnouncement(enabled, body, now = new Date()) {
  if (typeof body !== 'string') throw new TypeError('Announcement text must be text');
  const text = body.trim();
  if (text.length > MAX_BOARD_ANNOUNCEMENT) throw new TypeError(`Announcement is longer than ${MAX_BOARD_ANNOUNCEMENT} characters`);
  return { enabled: enabled === true && text !== '', body: text, updatedAt: now };
}

module.exports = { MAX_BOARD_ANNOUNCEMENT, boardAnnouncementVersion, showBoardAnnouncement, cleanBoardAnnouncement };
