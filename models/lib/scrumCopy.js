'use strict';

// A card's or swimlane's Scrum metadata on another board (copy or move).
// Whole-board duplication defers metadata to the shared transfer remapper
// instead.
//
// The sprint, past sprints, release and board-relative rank belong to the
// board the item leaves. Maintainer decision of 2026-10-02: the sprint and the
// release are linked to the destination board's own sprint and release OF THE
// SAME NAME when exactly one matches - a planned or active sprint, a release
// that is not cancelled - and dropped otherwise. Past sprints and the rank are
// always dropped: they describe the board left. Issue type, acceptance criteria
// and a swimlane's purpose stay.
//
// `planning` names both boards' records: { from: { sprints, releases },
// to: { sprints, releases } }, each a list of { _id, name, state }. Without it
// (no planning loaded, or a board without Scrum) the references are dropped.
const BOARD_SCOPED = ['sprintId', 'pastSprintIds', 'releaseId', 'backlogRank'];
const OPEN_SPRINT = ['planned', 'active'];

function counterpart(sourceId, from = [], to = [], usable) {
  const source = from.find(record => record._id === sourceId);
  const name = source && typeof source.name === 'string' ? source.name.trim() : '';
  if (!name) return null;
  const matches = to.filter(record => usable(record) && typeof record.name === 'string' && record.name.trim() === name);
  return matches.length === 1 ? matches[0]._id : null;
}

function boardScrum(scrum, planning) {
  const result = { ...scrum };
  for (const key of BOARD_SCOPED) delete result[key];
  if (!planning) return result;
  const sprintId = scrum.sprintId && counterpart(scrum.sprintId, planning.from?.sprints, planning.to?.sprints,
    record => OPEN_SPRINT.includes(record.state));
  const releaseId = scrum.releaseId && counterpart(scrum.releaseId, planning.from?.releases, planning.to?.releases,
    record => record.state !== 'cancelled');
  if (sprintId) result.sprintId = sprintId;
  if (releaseId) result.releaseId = releaseId;
  return result;
}

function copiedScrumMetadata(card, destinationBoardId, { omit = false, planning = null } = {}) {
  if (omit || !card.scrum) return {};
  let scrum = { ...card.scrum };
  if (Array.isArray(scrum.pastSprintIds)) scrum.pastSprintIds = [...scrum.pastSprintIds];
  if (card.boardId !== destinationBoardId) scrum = boardScrum(card.scrum, planning);
  return { scrum, scrumRevision: 1 };
}

// A card or swimlane MOVED to another board follows the same rule as a copy
// there (2026-10-02); the references used to stay and point at the old board's
// records. Nothing to change, nothing written; otherwise the revision moves on,
// as for any Scrum metadata write.
function movedScrumMetadata(doc, destinationBoardId, planning = null) {
  if (!doc.scrum || doc.boardId === destinationBoardId ||
      !BOARD_SCOPED.some(key => Object.prototype.hasOwnProperty.call(doc.scrum, key))) return {};
  return { scrum: boardScrum(doc.scrum, planning), scrumRevision: (doc.scrumRevision || 0) + 1 };
}

// The records `planning` needs, for a board pair: what a server caller loads
// (server/lib/scrumPlanningPair.js).
const PLANNING_FIELDS = { _id: 1, name: 1, state: 1 };

module.exports = { copiedScrumMetadata, copiedCardScrum: copiedScrumMetadata, movedScrumMetadata, boardScrum,
  PLANNING_FIELDS };
