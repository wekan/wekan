import Cards from '/models/cards';
import ChecklistItems from '/models/checklistItems';
import { allowIsBoardMemberWithWriteAccessByCard } from '/server/lib/utils';

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
