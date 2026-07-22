'use strict';

// Pure planner for the board data-repairs run both on board open and during the
// MongoDB <-> FerretDB v1 (SQLite) text-data migration. Given one board's raw
// swimlanes / lists / cards (plain arrays), it decides what to fix — no DB access,
// so it is unit-testable. The server side (server/lib/repairBoardData.js) applies
// the plan.
//
// Repairs planned:
//   * #6484 list-unbind — a board-wide list (swimlaneId null) that was wrongly
//     bound to a single swimlane, so it "disappeared" from the other swimlanes;
//     its swimlaneId is cleared back to null. (models/lib/listUnbindRepair.js)
//   * missing-swimlane cards — a card with no swimlaneId (null / '' / missing),
//     which never renders in the Swimlanes view; assigned to the first swimlane.
//   * orphaned cards — a card whose swimlaneId points at a swimlane that no longer
//     exists on the board (deleted swimlane), so the card is invisible; reassigned
//     to the first swimlane. (An ARCHIVED swimlane still exists, so cards on it are
//     left alone — that is not an orphan.)

const { listsToUnbind } = require('./listUnbindRepair');

function planBoardRepair(swimlanes, lists, cards) {
  const swimlaneIds = new Set(
    (Array.isArray(swimlanes) ? swimlanes : [])
      .filter(s => s && typeof s._id === 'string' && s._id.length > 0)
      .map(s => s._id),
  );

  // #6484: lists wrongly bound to a swimlane -> clear back to board-wide (null).
  const listsUnbind = listsToUnbind(lists);

  const cardsMissing = []; // no swimlaneId at all
  const cardsOrphaned = []; // swimlaneId points at a swimlane not on the board
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!card || typeof card._id !== 'string' || card._id.length === 0) continue;
    const sid = card.swimlaneId;
    if (typeof sid !== 'string' || sid.length === 0) {
      cardsMissing.push(card._id);
    } else if (!swimlaneIds.has(sid)) {
      cardsOrphaned.push(card._id);
    }
  }

  return { listsUnbind, cardsMissing, cardsOrphaned };
}

// Flatten a plan to the counts shown in the progress dashboard / Problems view.
function repairCounts(plan) {
  const listsUnbound = (plan && plan.listsUnbind ? plan.listsUnbind : []).length;
  const cardsAssigned = (plan && plan.cardsMissing ? plan.cardsMissing : []).length;
  const cardsRescued = (plan && plan.cardsOrphaned ? plan.cardsOrphaned : []).length;
  return {
    listsUnbound,
    cardsAssigned,
    cardsRescued,
    total: listsUnbound + cardsAssigned + cardsRescued,
  };
}

module.exports = { planBoardRepair, repairCounts };
