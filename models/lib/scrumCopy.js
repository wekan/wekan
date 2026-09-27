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

module.exports = { copiedScrumMetadata, copiedCardScrum: copiedScrumMetadata };
