// Wire dates are epoch milliseconds, preserving the browser's local-day bounds.
export function cardMovementRange(start, end) {
  const valid = value => value === null || (Number.isSafeInteger(value) && Math.abs(value) <= 8640000000000000);
  if (!valid(start) || !valid(end) || (start === null && end === null) ||
      (start !== null && end !== null && start >= end)) return null;
  return { $type: 9, ...(start === null ? {} : { $gte: new Date(start) }), ...(end === null ? {} : { $lt: new Date(end) }) };
}
export const CARD_MOVEMENT_EVENTS = ['moveCard', 'moveCardBoard'];
