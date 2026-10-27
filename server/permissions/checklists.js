import Cards from '/models/cards';
import Checklists from '/models/checklists';
import { denyCrossBoardMoveByCard, sourceBoardOfCardChild } from '/server/lib/utils';
import { tripCanaryDeny } from '/server/lib/canary';
import { denyForgedCardChildInsert } from '/server/lib/cardChildStamp';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';

Checklists.allow({
  async insert(userId, doc) {
    // ReadOnly users cannot create checklists
    return await canEditCardOrLinkedCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  async update(userId, doc) {
    // ReadOnly users cannot edit checklists
    return await canEditCardOrLinkedCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  async remove(userId, doc) {
    // ReadOnly users cannot delete checklists
    return await canEditCardOrLinkedCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  fetch: ['userId', 'cardId'],
});

// Security (GHSA-gv8h-5p3p-6hx7): the allow rule above only checks write access
// on the checklist's SOURCE card/board, so a DDP client could move a checklist
// into a private board it is not a member of by $set-ting a new cardId (the
// Checklists.before.update hook then denormalizes boardId from that destination
// card). Deny any move whose destination board the caller cannot write to.
Checklists.deny({
  async update(userId, doc, fieldNames, modifier) {
    // #6813: the source board from the source card, as the allow rule.
    if (!(await denyCrossBoardMoveByCard(userId, modifier, await sourceBoardOfCardChild(doc)))) return false;
    return tripCanaryDeny('checklist.cross-board-move', { userId });
  },
  fetch: ['cardId'],
});

// StampBleed: an insert on one's own card stamped with another board's id
// (or, for an item, another card's checklist) is refused and recorded
// (server/lib/cardChildStamp.js).
Checklists.deny({
  async insert(userId, doc) {
    return await denyForgedCardChildInsert(doc, { source: 'ddp:checklist-insert' });
  },
  fetch: [],
});
