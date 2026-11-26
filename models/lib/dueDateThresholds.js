'use strict';
// #6947: when a due date turns "due soon" (amber) and "overdue" (red), per
// board - Board Settings / Date. The hours before the due date a card is due
// soon (WeKan's 48 until set), and the hours after it a card is overdue (0:
// at the due time itself). A value that is not a whole or decimal number of
// hours from 0 to a year is no setting, and the default stands.
const DEFAULT_DUE_SOON_HOURS = 48;
const DEFAULT_OVERDUE_AFTER_HOURS = 0;
const MAX_THRESHOLD_HOURS = 24 * 366;

function validThresholdHours(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_THRESHOLD_HOURS;
}

// The board's thresholds, as dueDateClass takes them.
function dueThresholdsOf(board) {
  return {
    soonHours: validThresholdHours(board && board.dueSoonHours) ? board.dueSoonHours : DEFAULT_DUE_SOON_HOURS,
    overdueAfterHours: validThresholdHours(board && board.overdueAfterHours) ? board.overdueAfterHours : DEFAULT_OVERDUE_AFTER_HOURS,
  };
}

module.exports = {
  DEFAULT_DUE_SOON_HOURS, DEFAULT_OVERDUE_AFTER_HOURS, MAX_THRESHOLD_HOURS, validThresholdHours, dueThresholdsOf,
};
