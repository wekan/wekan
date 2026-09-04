'use strict';

// Pure builder for the Admin Panel / Problems "Status" overview and the
// `snap run wekan.problems` overview: given a snapshot of what is in progress and
// what problems were detected, it returns a single normalized overview object.
// Pure + unit-testable; the server (server/lib/systemStatus.js) and the snap
// command both gather the snapshot and render this same shape.
//
// input = {
//   inProgress: [{ kind, active, message }],      // migrations / repairs running
//   brokenCards: <number>,                        // broken/orphaned cards count
//   unboundLists: <number>,                       // lists whose swimlane can be restored
//   loginProblems: [{ id, title, detail, severity, ok }],
//   extraProblems: [{ id, severity, title, detail, count? }],  // optional
// }

function buildProblemsOverview(input) {
  const i = input || {};

  const inProgress = (Array.isArray(i.inProgress) ? i.inProgress : [])
    .filter(x => x && x.active);

  const problems = [];

  const brokenCards = Number.isFinite(i.brokenCards) ? i.brokenCards : 0;
  if (brokenCards > 0) {
    problems.push({
      id: 'broken-cards',
      severity: 'warning',
      count: brokenCards,
      title: 'Broken cards',
      detail: `${brokenCards} card(s) with a missing board/list/swimlane or an invalid type. Open the board to auto-repair, or run the repair migration.`,
    });
  }

  // #6670: lists that were un-bound from their swimlane by the pre-#6515
  // automatic repair, and whose original swimlane is still recorded in
  // positionHistory so it can be put back exactly. Only counted when something
  // CAN be restored, so the admin is never shown a problem with no remedy.
  const unboundLists = Number.isFinite(i.unboundLists) ? i.unboundLists : 0;
  if (unboundLists > 0) {
    problems.push({
      id: 'unbound-lists',
      severity: 'warning',
      count: unboundLists,
      title: 'Lists missing their swimlane',
      detail: `${unboundLists} list(s) lost the swimlane they belonged to and now appear under every swimlane, so deleting one from a swimlane deletes it from all of them. Restore puts each list back in the swimlane it was CREATED in, which is still recorded; lists with no record, or whose swimlane has since been deleted, are left board-wide.`,
    });
  }

  // Login-page causes that currently look wrong (ok === false).
  for (const c of Array.isArray(i.loginProblems) ? i.loginProblems : []) {
    if (c && c.ok === false) {
      problems.push({
        id: c.id,
        severity: c.severity || 'warning',
        title: c.title,
        detail: c.detail,
      });
    }
  }

  for (const p of Array.isArray(i.extraProblems) ? i.extraProblems : []) {
    if (p) problems.push(p);
  }

  return {
    anyInProgress: inProgress.length > 0,
    inProgress,
    anyProblems: problems.length > 0,
    problems,
  };
}

module.exports = { buildProblemsOverview };
