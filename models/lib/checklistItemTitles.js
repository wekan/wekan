'use strict';

// Pure helpers for adding checklist item(s) from the text a user typed into the
// "add checklist item" form. Extracted from the client event handlers so the
// parsing and the blank-input guard are unit-testable without Meteor / the DOM.
//
// #6440 ("'+' add-item button on minicard checklist does nothing"): on the
// minicard the add-item <form> is rendered inside the `a.minicard-wrapper`
// anchor, so the native form `submit` event never reaches the Blaze event map —
// clicking Save did nothing. The fix wires an explicit click handler on the Save
// button (mirroring the already-working edit button); this module holds the pure
// decision of WHICH item title(s) that click should create, so the same logic is
// shared and can be regression-tested in plain Node.

// Split the typed text into the list of checklist-item titles to create.
// - Always trims each candidate and drops blank ones, so whitespace-only input
//   creates nothing (the negative case that guards the bug).
// - When `newlineBecomesNewChecklistItem` is true, each non-blank line becomes a
//   separate item; otherwise the whole trimmed text is a single item.
// - When `reverse` is true (top-insert without originOrder), the resulting order
//   is reversed so the visible order matches the typed order.
function parseChecklistItemTitles(text, options = {}) {
  const { newlineBecomesNewChecklistItem = false, reverse = false } = options;
  if (typeof text !== 'string') return [];
  if (!newlineBecomesNewChecklistItem) {
    const title = text.trim();
    return title ? [title] : [];
  }
  const titles = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
  return reverse ? titles.reverse() : titles;
}

// Build the ChecklistItems.insert payload for one title. Kept pure so tests can
// assert it targets the correct checklist/card and carries the sort index.
function buildChecklistItemPayload(title, checklist, sort) {
  return {
    title,
    checklistId: checklist._id,
    cardId: checklist.cardId,
    sort,
  };
}

module.exports = { parseChecklistItemTitles, buildChecklistItemPayload };
