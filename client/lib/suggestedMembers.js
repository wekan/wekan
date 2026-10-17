import { ReactiveCache } from '/imports/reactiveCache';

// Suggested members for the Members and Assignees popups
// (docs/Features/Cards/Suggested-Members.md), from the cards this client has
// of the board. Board Settings / Card row "Suggested members", which Admin
// Panel / Settings / Visibility / Features / Card fields turns off everywhere
// through the client's board read.
const { suggestMembers } = require('/models/lib/memberSuggestions');

const MAX_CARDS = 1000;

export function suggestedMembersFor(card, field) {
  const real = card && card.getRealCard ? card.getRealCard() : card;
  if (!real) return [];
  const board = ReactiveCache.getBoard(real.boardId);
  if (!board || board.allowsSuggestedMembersOnCard === false) return [];
  const others = ReactiveCache.getCards({ boardId: real.boardId, archived: false },
    { fields: { labelIds: 1, listId: 1, swimlaneId: 1, members: 1, assignees: 1 }, limit: MAX_CARDS });
  const active = (board.activeMembers ? board.activeMembers() : board.members || []).map(m => m.userId);
  return suggestMembers(real, others, active, { field });
}
