// #3257: cards attached to a card (Trello's card attachments). The card keeps
// the attached cards' ids (models/lib/attachedCards.js); these methods add and
// remove them, and read what may be shown of each.
//
// Who may do what:
//   - attach or detach: whoever may edit the card (canEditCardOrLinkedCard),
//     and only a card they can READ themselves - attaching must not become a
//     way to learn that a hidden card exists, or to show its title to others;
//   - see an attached card: shown only to a viewer who can read that card
//     (its board's read rule and, for an assigned-only member, an assigned
//     card). Anybody else sees that an attached card is there, not which.
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { canReadBoard } from '/models/lib/boardVisibility';
import { buildCardRelativeUrl } from '/models/lib/cardUrl';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');
const {
  MAX_ATTACHED_CARDS, normalizeAttachedCardIds, attachedCardIdFrom,
} = require('/models/lib/attachedCards');

const notAuthorized = () => new Meteor.Error('not-authorized', 'Not authorized');

// Can this user read this card? Its board's read rule, then the assigned-only
// narrowing (models/lib/boardCardScope.js).
async function canReadCard(userId, card, board) {
  if (!card || !board || !canReadBoard(userId, board)) return false;
  const scope = assignedOnlyCardScope(board, userId);
  if (!scope) return true;
  return Array.isArray(card.assignees) && card.assignees.includes(userId);
}

async function readableCard(userId, cardId) {
  const card = await Cards.findOneAsync({ _id: cardId });
  const board = card && await Boards.findOneAsync(card.boardId);
  return card && await canReadCard(userId, card, board) ? { card, board } : null;
}

async function editableCard(userId, cardId) {
  const card = await Cards.findOneAsync({ _id: cardId });
  const board = card && await Boards.findOneAsync(card.boardId);
  if (!card || !board || !(await canEditCardOrLinkedCard(userId, card, board))) throw notAuthorized();
  return card;
}

Meteor.methods({
  // `target`: the card to attach, as a WeKan card link or a card id.
  async attachCardToCard(cardId, target) {
    check(cardId, String);
    check(target, String);
    if (!this.userId) throw notAuthorized();
    const card = await editableCard(this.userId, cardId);
    const targetId = attachedCardIdFrom(target);
    if (!targetId) throw new Meteor.Error('attach-card-invalid', 'Not a card link');
    if (targetId === cardId) throw new Meteor.Error('attach-card-self', 'A card cannot be attached to itself');
    // A card the user cannot read is "not found", the same as one that does
    // not exist: the answer must not tell them it is there.
    if (!(await readableCard(this.userId, targetId))) throw new Meteor.Error('attach-card-not-found', 'Card not found');
    const current = normalizeAttachedCardIds(card.attachedCardIds, cardId);
    if (current.includes(targetId)) return current;
    if (current.length >= MAX_ATTACHED_CARDS) throw new Meteor.Error('attach-card-limit', 'Too many attached cards');
    await Cards.updateAsync(cardId, { $addToSet: { attachedCardIds: targetId } });
    return [...current, targetId];
  },

  async detachCardFromCard(cardId, targetId) {
    check(cardId, String);
    check(targetId, String);
    if (!this.userId) throw notAuthorized();
    await editableCard(this.userId, cardId);
    await Cards.updateAsync(cardId, { $pull: { attachedCardIds: targetId } });
    return true;
  },

  // What the viewer may see of each card attached to a card they can read:
  // [{ cardId, title, boardId, boardTitle, listTitle, url, archived }] or
  // { cardId, unavailable: true } for one they cannot read or that is gone.
  async attachedCardsInfo(cardId) {
    check(cardId, String);
    const source = await readableCard(this.userId, cardId);
    if (!source) throw notAuthorized();
    const ids = normalizeAttachedCardIds(source.card.attachedCardIds, cardId);
    const out = [];
    for (const id of ids) {
      const found = await readableCard(this.userId, id);
      if (!found) { out.push({ cardId: id, unavailable: true }); continue; }
      const { card, board } = found;
      const list = card.listId ? await Lists.findOneAsync({ _id: card.listId }, { fields: { title: 1 } }) : null;
      out.push({
        cardId: card._id,
        title: card.title || '',
        boardId: board._id,
        boardTitle: board.title || '',
        listTitle: (list && list.title) || '',
        url: buildCardRelativeUrl(card, board),
        archived: card.archived === true,
      });
    }
    return out;
  },
});

export { canReadCard };
