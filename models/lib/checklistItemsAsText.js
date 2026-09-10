'use strict';

// Pure helpers for #4218 ("bulk-edit a checklist's items as plain text").
//
// A checklist previously could only be edited one item at a time through its
// per-item HTML row - reordering, copying between checklists/cards, or a bulk
// rewording meant a click-drag or a click-edit-save per item. This lets a user
// open the whole checklist as ONE multi-line textarea (one line per item, a
// leading `[x]`/`[ ]` marking the checked state - the common Markdown
// checklist convention, so text pasted in from elsewhere already matches) and
// save it back as the new item list.
//
// Kept pure (no Meteor/DOM) so the parsing and the replace-plan can be
// unit-tested directly; the client event handler only calls these and then
// performs the ChecklistItems.insert/update/remove calls the plan describes.

// One item -> one line: "[x] title" (checked) or "[ ] title" (unchecked).
function checklistItemsToText(items) {
  if (!Array.isArray(items)) return '';
  return items
    .map(item => `[${item.isFinished ? 'x' : ' '}] ${item.title}`)
    .join('\n');
}

const MARKER_RE = /^\[([ xX])\]\s?(.*)$/;

// Parse the textarea's text back into { title, isFinished } objects, one per
// non-empty line, in the order typed. A line with no recognised `[ ]`/`[x]`
// marker keeps its whole trimmed text as the title and defaults to unchecked -
// so plain lines (no marker at all) still work, matching how a user would
// paste in a plain list rather than one already formatted as a checklist.
function parseChecklistItemsText(text) {
  if (typeof text !== 'string') return [];
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .map(line => {
      const match = line.match(MARKER_RE);
      if (match) {
        const isFinished = match[1].toLowerCase() === 'x';
        const title = match[2].trim();
        return { title, isFinished };
      }
      return { title: line, isFinished: false };
    })
    .filter(entry => entry.title !== '');
}

// Build the plan to turn `existingItems` (each { _id, title, isFinished, sort
// ... }, in current display order) into `parsedLines` (each { title,
// isFinished }, the new desired order), replacing the list while preserving
// as much of each existing item document as practical:
//
// - A parsed line whose title exactly matches an as-yet-unmatched existing
//   item's title is a KEEP: that item's `_id` (and therefore every other
//   field on it - dueAt included) is reused, only its `sort` (and `isFinished`
//   if the marker changed) is updated. Matching is by title text and consumes
//   the existing items top-to-bottom so that reordering identical-looking
//   items still pairs them 1:1 rather than losing one.
// - A parsed line with no remaining match is an INSERT (a brand new item).
// - An existing item nothing matched is a REMOVE (its text is gone from the
//   new text, so nothing else can be reasonably preserving it).
//
// Returns { keep: [{ _id, sort, isFinished }], insert: [{ title, isFinished,
// sort }], remove: [_id] }. `sort` values are plain increasing integers in
// the new order - callers only need them to sort correctly relative to each
// other, not to match any particular numbering scheme.
function planChecklistItemsTextUpdate(existingItems, parsedLines) {
  const pool = Array.isArray(existingItems) ? existingItems.slice() : [];
  const usedIndexes = new Set();
  const keep = [];
  const insert = [];

  (Array.isArray(parsedLines) ? parsedLines : []).forEach((line, order) => {
    const matchIndex = pool.findIndex(
      (item, idx) => !usedIndexes.has(idx) && item.title === line.title,
    );
    if (matchIndex === -1) {
      insert.push({ title: line.title, isFinished: !!line.isFinished, sort: order });
      return;
    }
    usedIndexes.add(matchIndex);
    keep.push({
      _id: pool[matchIndex]._id,
      sort: order,
      isFinished: !!line.isFinished,
    });
  });

  const remove = pool
    .map((item, idx) => (usedIndexes.has(idx) ? null : item._id))
    .filter(id => id !== null);

  return { keep, insert, remove };
}

export { checklistItemsToText, parseChecklistItemsText, planChecklistItemsTextUpdate };
