/**
 * Pure helper that decides the CSS status class for a card "due date" badge.
 *
 * This logic is shared between the card-detail badge (`cardDueDate`) and the
 * minicard badge (`minicardDueDate`) so that both views always agree on the
 * colour of a due date (see issues #6000 and #5965).
 *
 * Rules (no Blaze / no DOM dependencies, easy to unit-test):
 *   - If the card has an end date:
 *       - end before due  => 'completed-early'
 *       - otherwise       => 'completed'
 *   - Otherwise, compare the due date against "now":
 *       - due in the past            => 'overdue'   (red)
 *       - due within 48 hours        => 'due-soon'  (amber)
 *       - due more than 48h in future => 'not-due'  (grey)
 *
 * @param {Date|string|number} dueDate - The card due date.
 * @param {Date|string|number} now - The current time.
 * @param {Date|string|number} [endDate] - The card end date, if set.
 * @returns {string} One of 'overdue' | 'due-soon' | 'not-due' |
 *                   'completed-early' | 'completed'.
 */
export function dueDateClass(dueDate, now, endDate) {
  const due = new Date(dueDate);
  const nowVal = new Date(now);

  if (endDate) {
    const end = new Date(endDate);
    if (end.getTime() < due.getTime()) {
      return 'completed-early';
    }
    return 'completed';
  }

  const diffMs = due.getTime() - nowVal.getTime();
  const hoursDiff = diffMs / (1000 * 60 * 60);

  if (hoursDiff < 0) {
    return 'overdue';
  } else if (hoursDiff <= 48) {
    return 'due-soon';
  }
  return 'not-due';
}

/**
 * Pure helper that turns a due date into a countdown - "N days left" or
 * "N days overdue" - for the due-date badge (GitHub issue #2424). The badge
 * used to show only the formatted date; this adds a relative day count next
 * to it, using CALENDAR days (the due date's own day minus "now"'s day), so
 * a card due later today still reads "Due today" rather than "0 days left".
 *
 * @param {Date|string|number} dueDate - The card due date.
 * @param {Date|string|number} now - The current time.
 * @returns {{key: 'due-today'|'due-days-left'|'due-days-overdue', days: number}}
 *   `days` is always a non-negative count; `key` says which direction/phrase
 *   to use. Look the phrase up with TAPi18n.__(key, { count: days }) (or
 *   plain %s substitution) at the call site - this module stays i18n-free.
 */
export function dueCountdown(dueDate, now) {
  const due = new Date(dueDate);
  const nowVal = new Date(now);

  const startOfDay = date =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((startOfDay(due) - startOfDay(nowVal)) / dayMs);

  if (diffDays === 0) {
    return { key: 'due-today', days: 0 };
  } else if (diffDays > 0) {
    return { key: 'due-days-left', days: diffDays };
  }
  return { key: 'due-days-overdue', days: -diffDays };
}
