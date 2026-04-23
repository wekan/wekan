import Cards from '/models/cards';
import Checklists from '/models/checklists';
import { allowIsBoardMemberWithWriteAccessByCard } from '/server/lib/utils';

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
