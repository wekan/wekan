// #3818 / #4729: a checklist can automatically uncheck all of its items on a
// recurring schedule (daily, weekly, monthly), so a repeating checklist (e.g. a
// daily routine) does not have to be reset by hand every time.
//
// This module is intentionally free of Meteor/Mongo imports so the due-date
// arithmetic can be unit tested as plain functions - the actual
// scan-and-uncheck job (server/checklistResetSchedule.js) is a thin wrapper
// around isChecklistResetDue()/computeNextResetAt() below.

export const CHECKLIST_RESET_INTERVALS = ['none', 'daily', 'weekly', 'monthly'];

const INTERVAL_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  // Not a fixed number of milliseconds - see computeNextResetAt() below, which
  // advances by calendar months rather than an approximate 30-day span so a
  // reset on the 31st does not drift earlier every few months.
  monthly: null,
};

/**
 * The next time a checklist with the given resetInterval is due to reset,
 * counting forward from `lastResetAt` (or, if the checklist has never been
 * reset, from `createdAt`, which the caller passes in as the fallback).
 *
 * @param {Date|null|undefined} fromDate the last reset time (or creation time)
 * @param {string} resetInterval one of CHECKLIST_RESET_INTERVALS
 * @returns {Date|null} the next due time, or null when resetInterval is 'none'
 *   or invalid, or fromDate is missing
 */
export function computeNextResetAt(fromDate, resetInterval) {
  if (!fromDate || !CHECKLIST_RESET_INTERVALS.includes(resetInterval) || resetInterval === 'none') {
    return null;
  }
  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
  if (Number.isNaN(from.getTime())) return null;

  if (resetInterval === 'monthly') {
    const next = new Date(from.getTime());
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  return new Date(from.getTime() + INTERVAL_MS[resetInterval]);
}

/**
 * Is a checklist due for its automatic reset right now?
 *
 * @param {object} checklist a plain object (or Checklists document) with
 *   `resetInterval`, `lastResetAt` and `createdAt`
 * @param {Date} [now] defaults to the current time; pass an explicit Date in tests
 * @returns {boolean}
 */
export function isChecklistResetDue(checklist, now = new Date()) {
  if (!checklist) return false;
  const resetInterval = checklist.resetInterval;
  if (!resetInterval || resetInterval === 'none') return false;
  if (!CHECKLIST_RESET_INTERVALS.includes(resetInterval)) return false;

  const fromDate = checklist.lastResetAt || checklist.createdAt;
  const nextResetAt = computeNextResetAt(fromDate, resetInterval);
  if (!nextResetAt) return false;

  return now.getTime() >= nextResetAt.getTime();
}

/**
 * Which of the given checklists are due for their automatic reset right now.
 * Pure filter over plain objects/documents, used by both the server job
 * (server/checklistResetSchedule.js) and its tests.
 *
 * @param {object[]} checklists
 * @param {Date} [now]
 * @returns {object[]} the subset of `checklists` that is due
 */
export function selectChecklistsDueForReset(checklists, now = new Date()) {
  return (checklists || []).filter(checklist => isChecklistResetDue(checklist, now));
}

/**
 * Pure planning step for an automatic reset: given a checklist and the full
 * list of checklist items (possibly spanning many checklists), returns the
 * ids of exactly the items that belong to THIS checklist and are currently
 * checked - i.e. the ones an automatic reset must uncheck. Other checklists'
 * items are never included, however many happen to already be unchecked.
 *
 * @param {object} checklist
 * @param {object[]} items each with `_id`, `checklistId`, `isFinished`
 * @returns {string[]} item ids to uncheck
 */
export function selectItemIdsToUncheck(checklist, items) {
  if (!checklist) return [];
  return (items || [])
    .filter(item => item.checklistId === checklist._id && item.isFinished === true)
    .map(item => item._id);
}
