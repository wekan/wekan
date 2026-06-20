import Cards from '/models/cards';
import Checklists from '/models/checklists';
import { allowIsBoardMemberWithWriteAccessByCard, denyCrossBoardMoveByCard } from '/server/lib/utils';

Checklists.allow({
  async insert(userId, doc) {
    // ReadOnly users cannot create checklists
    return await allowIsBoardMemberWithWriteAccessByCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  async update(userId, doc) {
    // ReadOnly users cannot edit checklists
    return await allowIsBoardMemberWithWriteAccessByCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  async remove(userId, doc) {
    // ReadOnly users cannot delete checklists
    return await allowIsBoardMemberWithWriteAccessByCard(userId, await Cards.findOneAsync(doc.cardId));
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
    return await denyCrossBoardMoveByCard(userId, modifier);
  },
  fetch: [],
});
