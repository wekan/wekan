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
