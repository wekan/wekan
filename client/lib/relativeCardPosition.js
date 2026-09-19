import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import { relativePosition } from '/models/lib/relativePosition';

export async function relativeCardSort(targetCard, position, movingId) {
  if (targetCard._id === movingId) return targetCard.sort;
  const scope = { boardId: targetCard.boardId, listId: targetCard.listId,
    swimlaneId: targetCard.swimlaneId, archived: false, deletedAt: null };
  const siblings = Cards.find(scope, { sort: { sort: 1, _id: 1 } }).fetch();
  const plan = relativePosition(siblings, targetCard._id, position, movingId);
  for (const update of plan.updates) {
    const sibling = Cards.findOne({ ...scope, _id: update.id });
    if (!sibling) throw new Error(TAPi18n.__('no-cards-found'));
    await sibling.move(sibling.boardId, sibling.swimlaneId, sibling.listId, update.sort);
  }
  return plan.sort;
}
