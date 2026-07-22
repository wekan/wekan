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
