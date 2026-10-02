'use strict';

// Standalone copies do not copy board planning records. Whole-board duplication
// defers metadata to the shared transfer remapper instead.
function copiedScrumMetadata(card, destinationBoardId, { omit = false } = {}) {
  if (omit || !card.scrum) return {};
  const scrum = { ...card.scrum };
  if (Array.isArray(scrum.pastSprintIds)) scrum.pastSprintIds = [...scrum.pastSprintIds];
  if (card.boardId !== destinationBoardId) {
    for (const key of ['sprintId', 'pastSprintIds', 'releaseId', 'backlogRank']) delete scrum[key];
  }
  return { scrum, scrumRevision: 1 };
}

// A card or swimlane MOVED to another board follows the same rule as a copy
// there (2026-10-02): its sprint, past sprints, release and board-relative rank
// belonged to the board it left, so they go - they used to stay and point at
// another board's records. Issue type and acceptance criteria stay. The
// revision moves on, as for any Scrum metadata write.
const BOARD_SCOPED = ['sprintId', 'pastSprintIds', 'releaseId', 'backlogRank'];
function movedScrumMetadata(doc, destinationBoardId) {
  if (!doc.scrum || doc.boardId === destinationBoardId ||
      !BOARD_SCOPED.some(key => Object.prototype.hasOwnProperty.call(doc.scrum, key))) return {};
  const scrum = { ...doc.scrum };
  for (const key of BOARD_SCOPED) delete scrum[key];
  return { scrum, scrumRevision: (doc.scrumRevision || 0) + 1 };
}

module.exports = { copiedScrumMetadata, copiedCardScrum: copiedScrumMetadata, movedScrumMetadata };
