// The loss report on the import page: when an import completes with warnings
// (models/lib/importLossReport.js, recorded in Admin Panel → Problems →
// Recovery), the page shows the person who imported what could not be brought
// over before opening the board.
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import RecoveryEvents from '/models/recoveryEvents';

// Only a report this user's own import recorded for this board, and only a
// recent one: the page asks right after its import finishes. The detail holds
// locations and counts, never source values (importLossReport).
const REPORT_WINDOW_MS = 60 * 60 * 1000;

Meteor.methods({
  async importReportForBoard(boardId) {
    check(boardId, String);
    if (!this.userId) return [];
    const rows = await RecoveryEvents.find({
      type: RecoveryEvents.types.IMPORT_COMPLETED_WITH_WARNINGS,
      userId: this.userId,
      boardIds: boardId,
      createdAt: { $gte: new Date(Date.now() - REPORT_WINDOW_MS) },
    }, { sort: { createdAt: -1 }, limit: 5, fields: { detail: 1, createdAt: 1 } }).fetchAsync();
    return rows.map(row => ({ detail: row.detail || '', createdAt: row.createdAt }));
  },
});
