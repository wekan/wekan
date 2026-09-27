'use strict';

// Reports use immutable sprint commitments. Missing estimates stay distinct
// from an explicit zero, and retrospective estimates never rewrite velocity.
function total(cards) {
  return cards.reduce((result, card) => {
    result.count += 1;
    if (Number.isFinite(card.estimate) && card.estimate >= 0) result.estimate += card.estimate;
    else result.unknown += 1;
    return result;
  }, { count: 0, estimate: 0, unknown: 0 });
}
function sprintReport(sprint) {
  const start = sprint.startSnapshot?.cards || [];
  const end = sprint.closeSnapshot?.cards || [];
  const committed = new Set(start.map(card => card.cardId));
  const finalIds = new Set(end.map(card => card.cardId));
  const done = end.filter(card => card.done);
  return {
    sprintId: sprint._id, name: sprint.name, state: sprint.state,
    unit: sprint.closeSnapshot?.unit || sprint.startSnapshot?.unit || '',
    committed: total(start), completed: total(done),
    completedCommitment: total(start.filter(card => done.some(endCard => endCard.cardId === card.cardId))),
    added: total(end.filter(card => !committed.has(card.cardId))),
    removed: total(start.filter(card => !finalIds.has(card.cardId))),
    incomplete: total(end.filter(card => !card.done)),
    hasStart: Boolean(sprint.startSnapshot), hasClose: Boolean(sprint.closeSnapshot),
    partial: Boolean(sprint.startSnapshot?.partial || sprint.closeSnapshot?.partial),
  };
}
function velocityRows(sprints) {
  return sprints.filter(s => s.state === 'closed' && s.closeSnapshot)
    .slice().sort((a, b) => new Date(a.closeSnapshot.at) - new Date(b.closeSnapshot.at))
    .map(sprintReport);
}
module.exports = { total, sprintReport, velocityRows };
