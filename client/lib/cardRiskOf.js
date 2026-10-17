import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';

// The at-risk mark for a card on this client (docs/Features/Cards/At-Risk.md):
// what the minicard and the opened card already have, handed to the pure
// rules of models/lib/cardRisk.js. `withMoves` also counts the moves back,
// from the activities the opened card has loaded.
const { cardRisk, countBackMoves, isComplete, REASON_KEYS } = require('/models/lib/cardRisk');

function listPlace(card) {
  const lists = ReactiveCache.getLists({ boardId: card.boardId, archived: false }, { sort: { sort: 1 } }) || [];
  const own = lists.find(l => l._id === card.listId);
  // Lists of a swimlane are the swimlane's; shared lists are the board's.
  const same = lists.filter(l => (l.swimlaneId || '') === ((own && own.swimlaneId) || ''));
  const at = same.findIndex(l => l._id === card.listId);
  const sort = {};
  lists.forEach((l, i) => { sort[l._id] = i; });
  return { inMiddleList: at > 0 && at < same.length - 1, sort };
}

export function riskOf(card, { withMoves = false } = {}) {
  const real = card && card.getRealCard ? card.getRealCard() : card;
  if (!real || isComplete(real)) return null;
  const { inMiddleList, sort } = listPlace(real);
  const blockers = (real.cardDependencies || [])
    .filter(dep => dep && dep.type === 'is-blocked-by')
    .map(dep => ReactiveCache.getCard(dep.cardId))
    .filter(blocker => blocker && !isComplete(blocker));
  const backMoves = withMoves
    ? countBackMoves(ReactiveCache.getActivities({ cardId: real._id, activityType: 'moveCard' }), sort)
    : 0;
  const risk = cardRisk(real, {
    now: new Date(),
    checklist: {
      finished: real.checklistFinishedCount ? real.checklistFinishedCount() : 0,
      total: real.checklistItemCount ? real.checklistItemCount() : 0,
    },
    blockers,
    inMiddleList,
    backMoves,
  });
  if (!risk.atRisk) return null;
  const text = risk.reasons.map(r => TAPi18n.__(REASON_KEYS[r.kind], r)).join('; ');
  return { ...risk, text };
}
