// Kanboard has a per-task "recurrence" setting: once a recurring task is
// closed/moved, a fresh copy of it is created automatically so the next
// occurrence does not have to be recreated by hand every time (e.g. "weekly
// status report", "monthly invoice"). WeKan already has this exact mechanism
// for checklist items (models/lib/checklistResetSchedule.js) - this module is
// the same due-date arithmetic applied to a whole CARD instead of a
// checklist, so a recurring card is automatically re-created on a schedule.
//
// This module is intentionally free of Meteor/Mongo imports so the due-date
// arithmetic can be unit tested as plain functions - the actual
// scan-and-create job (server/cardRecurrenceSchedule.js) is a thin wrapper
// around isCardRecurrenceDue()/computeNextRecurrenceAt() below.

export const CARD_RECURRENCE_INTERVALS = ['none', 'daily', 'weekly', 'monthly'];

const INTERVAL_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  // Not a fixed number of milliseconds - see computeNextRecurrenceAt() below,
  // which advances by calendar months rather than an approximate 30-day span
  // so a recurrence on the 31st does not drift earlier every few months.
  monthly: null,
};

/**
 * The next time a card with the given recurrenceInterval is due to spawn its
 * next occurrence, counting forward from `lastRecurrenceAt` (or, if the card
 * has never recurred, from `createdAt`, which the caller passes in as the
 * fallback).
 *
 * @param {Date|null|undefined} fromDate the last recurrence time (or creation time)
 * @param {string} recurrenceInterval one of CARD_RECURRENCE_INTERVALS
 * @returns {Date|null} the next due time, or null when recurrenceInterval is
 *   'none' or invalid, or fromDate is missing
 */
export function computeNextRecurrenceAt(fromDate, recurrenceInterval) {
  if (
    !fromDate ||
    !CARD_RECURRENCE_INTERVALS.includes(recurrenceInterval) ||
    recurrenceInterval === 'none'
  ) {
    return null;
  }
  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
  if (Number.isNaN(from.getTime())) return null;

  if (recurrenceInterval === 'monthly') {
    const next = new Date(from.getTime());
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  return new Date(from.getTime() + INTERVAL_MS[recurrenceInterval]);
}

/**
 * Is a card due to spawn its next recurring occurrence right now?
 *
 * @param {object} card a plain object (or Cards document) with
 *   `recurrenceInterval`, `lastRecurrenceAt` and `createdAt`
 * @param {Date} [now] defaults to the current time; pass an explicit Date in tests
 * @returns {boolean}
 */
export function isCardRecurrenceDue(card, now = new Date()) {
  if (!card) return false;
  const recurrenceInterval = card.recurrenceInterval;
  if (!recurrenceInterval || recurrenceInterval === 'none') return false;
  if (!CARD_RECURRENCE_INTERVALS.includes(recurrenceInterval)) return false;
  // A card that was archived (or trashed) between two scans should not keep
  // spawning fresh occurrences of itself.
  if (card.archived) return false;

  const fromDate = card.lastRecurrenceAt || card.createdAt;
  const nextRecurrenceAt = computeNextRecurrenceAt(fromDate, recurrenceInterval);
  if (!nextRecurrenceAt) return false;

  return now.getTime() >= nextRecurrenceAt.getTime();
}

/**
 * Which of the given cards are due for their automatic recurrence right now.
 * Pure filter over plain objects/documents, used by both the server job
 * (server/cardRecurrenceSchedule.js) and its tests.
 *
 * @param {object[]} cards
 * @param {Date} [now]
 * @returns {object[]} the subset of `cards` that is due
 */
export function selectCardsDueForRecurrence(cards, now = new Date()) {
  return (cards || []).filter(card => isCardRecurrenceDue(card, now));
}
