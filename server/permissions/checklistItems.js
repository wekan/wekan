import Cards from '/models/cards';
import ChecklistItems from '/models/checklistItems';
import { allowIsBoardMemberWithWriteAccessByCard, denyCrossBoardMoveByChecklistItem } from '/server/lib/utils';

ChecklistItems.allow({
  async insert(userId, doc) {
    // ReadOnly users cannot create checklist items
    return await allowIsBoardMemberWithWriteAccessByCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  async update(userId, doc) {
    // ReadOnly users cannot edit checklist items
    return await allowIsBoardMemberWithWriteAccessByCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  async remove(userId, doc) {
    // ReadOnly users cannot delete checklist items
    return await allowIsBoardMemberWithWriteAccessByCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  fetch: ['userId', 'cardId'],
});

// Security (GHSA-gv8h-5p3p-6hx7): the allow rule above only checks write access
// on the item's SOURCE card/board, so a DDP client could move a checklist item
// into a private board it is not a member of by $set-ting a new cardId or
// checklistId (boardId is then denormalized from the destination card). Deny any
// move whose destination board the caller cannot write to.
ChecklistItems.deny({
  async update(userId, doc, fieldNames, modifier) {
    return await denyCrossBoardMoveByChecklistItem(userId, modifier);
  },
  fetch: [],
});
