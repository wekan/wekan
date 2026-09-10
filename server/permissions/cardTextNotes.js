import Cards from '/models/cards';
import CardTextNotes from '/models/cardTextNotes';
import { denyCrossBoardMoveByCard } from '/server/lib/utils';
import { tripCanaryDeny } from '/server/lib/canary';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';

CardTextNotes.allow({
  async insert(userId, doc) {
    // ReadOnly users cannot create text notes
    return await canEditCardOrLinkedCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  async update(userId, doc) {
    // ReadOnly users cannot edit text notes
    return await canEditCardOrLinkedCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  async remove(userId, doc) {
    // ReadOnly users cannot delete text notes
    return await canEditCardOrLinkedCard(userId, await Cards.findOneAsync(doc.cardId));
  },
  fetch: ['userId', 'cardId'],
});

// Same defense-in-depth as Checklists (GHSA-gv8h-5p3p-6hx7): the allow rule
// above only checks write access on the text note's SOURCE card/board, so a
// DDP client could move a text note into a private board it is not a member
// of by $set-ting a new cardId. Deny any move whose destination board the
// caller cannot write to.
CardTextNotes.deny({
  async update(userId, doc, fieldNames, modifier) {
    if (!(await denyCrossBoardMoveByCard(userId, modifier))) return false;
    return tripCanaryDeny('cardTextNote.cross-board-move', { userId });
  },
  fetch: [],
});
