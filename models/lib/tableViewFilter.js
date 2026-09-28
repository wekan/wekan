'use strict';

// Pure selector builder for the per-board Table view. The active Filter owns a
// top-level $or, so always combine it with the board boundary through $and.
function tableViewCardsSelector(boardId, filterSelector) {
  const base = { boardId, archived: false };
  if (!filterSelector || Object.keys(filterSelector).length === 0) return base;
  return { $and: [filterSelector, base] };
}

// Preserve card identity/mutators, but use the page's authorized dates for
// badges as well as ordering. Never write source dates onto a local link card.
function tableCardWithDates(card, dates) {
  if (!dates) return card;
  const view = Object.assign(Object.create(Object.getPrototypeOf(card)), card);
  for (const [getter, field] of [['getReceived', 'receivedAt'], ['getStart', 'startAt'], ['getDue', 'dueAt'], ['getEnd', 'endAt']]) {
    Object.defineProperty(view, getter, { value: () => dates[field] ?? null });
  }
  return view;
}

export { tableViewCardsSelector, tableCardWithDates };
