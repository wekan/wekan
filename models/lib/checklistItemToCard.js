/**
 * #3294: build the document for a new card created when a checklist item is
 * dragged off its checklist and dropped onto a list (client/components/
 * cards/checklists.js's checklist-item sortable `stop` handler).
 *
 * Kept as a pure function - no Cards.insert() here - so "what does the new
 * card look like" can be pinned by tests/checklistItemToCard.test.cjs without
 * a Meteor database, and so the drag handler has one place to get it from
 * rather than building the document inline.
 *
 * Scope decision (see the #3294 commit message): dropping ALWAYS creates a
 * new card. There is no attempt here to guess that a particular target list
 * "means" Done and mark the ORIGINAL checklist item finished instead of
 * creating a card - that would require guessing a list's meaning from its
 * name or position, which is unreliable heuristic behaviour that would
 * surprise users. Marking an item done already has its own explicit,
 * unambiguous action - the item's own checkbox (ChecklistItems' toggleItem())
 * - so that capability is not missing, just not wired to this drag gesture.
 */
export function buildCardFromChecklistItem(item, list, swimlaneId, sort) {
  if (!item || !item.title || !String(item.title).trim()) return null;
  if (!list || !list._id || !list.boardId) return null;

  return {
    title: item.title,
    listId: list._id,
    boardId: list.boardId,
    swimlaneId: swimlaneId || list.swimlaneId,
    sort: typeof sort === 'number' && !Number.isNaN(sort) ? sort : 0,
  };
}
