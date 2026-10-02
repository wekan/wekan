// Both boards' sprints and releases, for linking a copied or moved item's
// Scrum references by name (models/lib/scrumCopy.js, maintainer decision of
// 2026-10-02). Only names and states are read.
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
const { PLANNING_FIELDS } = require('/models/lib/scrumCopy');

const LIMIT = 10000;
async function recordsOf(boardId) {
  const [sprints, releases] = await Promise.all([
    ScrumSprints.rawCollection().find({ boardId }, { projection: PLANNING_FIELDS, limit: LIMIT }).toArray(),
    ScrumReleases.rawCollection().find({ boardId }, { projection: PLANNING_FIELDS, limit: LIMIT }).toArray(),
  ]);
  return { sprints, releases };
}

export async function scrumPlanningPair(fromBoardId, toBoardId) {
  if (!fromBoardId || !toBoardId || fromBoardId === toBoardId) return null;
  const [from, to] = await Promise.all([recordsOf(fromBoardId), recordsOf(toBoardId)]);
  return { from, to };
}
