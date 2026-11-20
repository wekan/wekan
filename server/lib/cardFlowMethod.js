import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';

const { flowModifier, expediteOverLimit } = require('/models/lib/cardFlow');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

// The card's Kanban and Scrum flow fields (models/lib/cardFlow.js): blocked
// and why, class of service, MoSCoW, WSJF. The same permission as every other
// card edit (canEditCardOrLinkedCard, on the source of a linked card); an
// assigned-only member changes only a card assigned to them; Expedite keeps
// its WIP limit of one open card per board. Who blocked a card and when is
// the server's, never the client's.
export async function setCardFlowFor(userId, cardId, patch) {
  check(cardId, String);
  check(patch, Match.ObjectIncluding({}));
  if (!userId) throw new Meteor.Error('not-authorized');
  let card = await Cards.findOneAsync(cardId);
  if (!card) throw new Meteor.Error('not-found');
  if (card.type === 'cardType-linkedCard' && card.linkedId) {
    card = await Cards.findOneAsync(card.linkedId);
    if (!card) throw new Meteor.Error('not-found');
  }
  const board = await Boards.findOneAsync(card.boardId);
  if (!board || !(await canEditCardOrLinkedCard(userId, card, board))) throw new Meteor.Error('not-authorized');
  if (isAssignedOnlyMember(board, userId) && !(card.assignees || []).includes(userId)
    && !(card.members || []).includes(userId)) {
    throw new Meteor.Error('not-authorized');
  }
  let modifier;
  try {
    modifier = flowModifier(patch, { userId, now: new Date() });
  } catch (e) {
    throw new Meteor.Error(e.code || 'invalid-flow-patch');
  }
  if (patch.classOfService === 'expedite' && card.flow?.classOfService !== 'expedite') {
    const others = await Cards.find(
      { boardId: card.boardId, archived: { $ne: true }, 'flow.classOfService': 'expedite' },
      { fields: { _id: 1, archived: 1, dueComplete: 1, flow: 1 } },
    ).fetchAsync();
    if (expediteOverLimit(card._id, others)) throw new Meteor.Error('expedite-limit');
  }
  await Cards.updateAsync({ _id: card._id }, modifier);
  return true;
}

Meteor.methods({
  async setCardFlow(cardId, patch) {
    return await setCardFlowFor(this.userId, cardId, patch);
  },
});
