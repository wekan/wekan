'use strict';

// #6946: a board export WITHOUT the board's archive (?archived=false), for
// moving a board to another WeKan and starting clean there. An ordinary export
// stays a complete backup; every function here returns its selector unchanged
// when the option is off.
//
// Pure, no Meteor, so tests/exportExcludeArchived.test.cjs can check each rule
// as plain data. models/exporter.js and models/server/ExporterZip.js apply them.

// Lists and swimlanes: only the ones not archived. `{ $ne: true }` also keeps a
// row that has no `archived` field at all - an active row need not carry it.
function liveOnlySelector(selector, excludeArchived) {
  return excludeArchived ? { ...selector, archived: { $ne: true } } : selector;
}

// Cards: not archived themselves, AND not on an archived list or swimlane. A
// card restored from the archive while its list stayed archived is not archived
// itself, but its list is left out of the export, and the card would arrive
// pointing at a list the new board does not have.
function liveCardSelector(selector, excludeArchived, archivedListIds = [], archivedSwimlaneIds = []) {
  if (!excludeArchived) return selector;
  const out = liveOnlySelector(selector, true);
  const and = [];
  if (archivedListIds.length > 0) and.push({ listId: { $nin: archivedListIds } });
  if (archivedSwimlaneIds.length > 0) and.push({ swimlaneId: { $nin: archivedSwimlaneIds } });
  // $and, not a listId key: a list-scoped export already has `listId` set.
  if (and.length > 0) out.$and = [...(selector.$and || []), ...and];
  return out;
}

// Attachments: those of the exported cards, and the board's own (a board
// background has no card). Attachments are found by the board, not by the
// cards, so without this an archived card's files - bytes and all - went out
// with the export even though the card did not.
function liveAttachmentSelector(selector, excludeArchived, exportedCardIds) {
  if (!excludeArchived) return selector;
  const or = [{ 'meta.cardId': { $in: exportedCardIds || [] } }, { 'meta.cardId': { $in: ['', null] } }];
  return { ...selector, $or: or };
}

module.exports = { liveOnlySelector, liveCardSelector, liveAttachmentSelector };
