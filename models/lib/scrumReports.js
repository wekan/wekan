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
// The totals a report shows, from the snapshots' rows. A sprint whose rows
// live outside its document (server/lib/scrumSnapshotStore.js) carries these
// as `reportTotals`, computed from all of them when it started and closed;
// a reader restricted to some cards gets the rows, filtered, instead.
function reportTotals(sprint) {
  const start = sprint.startSnapshot?.cards || [];
  const end = sprint.closeSnapshot?.cards || [];
  const committed = new Set(start.map(card => card.cardId));
  const finalIds = new Set(end.map(card => card.cardId));
  const done = end.filter(card => card.done);
  // Index completion once: a sprint may hold many thousands of snapshot rows.
  const doneIds = new Set(done.map(card => card.cardId));
  return { committed: total(start), completed: total(done),
    completedCommitment: total(start.filter(card => doneIds.has(card.cardId))),
    added: total(end.filter(card => !committed.has(card.cardId))),
    removed: total(start.filter(card => !finalIds.has(card.cardId))),
    incomplete: total(end.filter(card => !card.done)) };
}
const hasRows = sprint => Array.isArray(sprint.startSnapshot?.cards) || Array.isArray(sprint.closeSnapshot?.cards);
function sprintReport(sprint) {
  const totals = hasRows(sprint) || !sprint.reportTotals ? reportTotals(sprint) : sprint.reportTotals;
  return {
    sprintId: sprint._id, name: sprint.name, state: sprint.state,
    plannedWorkingDays: plannedWorkingDays(sprint.plannedStart, sprint.plannedEnd, sprint.startSnapshot?.workingDays),
    unit: sprint.closeSnapshot?.unit || sprint.startSnapshot?.unit || '',
    estimateSource: sprint.closeSnapshot?.estimateSource || sprint.startSnapshot?.estimateSource || '',
    estimateCustomFieldId: sprint.closeSnapshot?.estimateCustomFieldId || sprint.startSnapshot?.estimateCustomFieldId || '',
    completionPolicy: sprint.closeSnapshot?.completionPolicy || sprint.startSnapshot?.completionPolicy || '',
    ...totals,
    hasStart: Boolean(sprint.startSnapshot), hasClose: Boolean(sprint.closeSnapshot),
    partial: Boolean(sprint.startSnapshot?.partial || sprint.closeSnapshot?.partial),
  };
}
// Planned dates use UTC calendar days, inclusive. Count whole weeks directly
// so even a long imported date range needs at most six daily checks.
function plannedWorkingDays(start, end, workingDays) {
  if (!start || !end || !Array.isArray(workingDays) || !workingDays.length || workingDays.some(day => !Number.isInteger(day) || day < 1 || day > 7)) return null;
  const first = new Date(start), last = new Date(end);
  if (!Number.isFinite(first.getTime()) || !Number.isFinite(last.getTime())) return null;
  const dayNumber = date => Math.floor(date.getTime() / 86400000);
  const days = dayNumber(last) - dayNumber(first) + 1;
  if (days <= 0) return null;
  const selected = new Set(workingDays);
  let count = Math.floor(days / 7) * selected.size;
  for (let index = 0; index < days % 7; index += 1) {
    if (selected.has((first.getUTCDay() + index + 6) % 7 + 1)) count += 1;
  }
  return count;
}
function velocityRows(sprints) {
  return sprints.filter(s => s.state === 'closed' && s.closeSnapshot)
    .slice().sort((a, b) => new Date(a.closeSnapshot.at) - new Date(b.closeSnapshot.at))
    .map(sprintReport);
}
// Each compatibility group has its own scale: changing estimate sources or
// completion policy must not make unlike sprint results look comparable.
function reportChartGroups(reports, metric = 'count', velocity = false) {
  const keys = velocity ? ['committed', 'completed'] : ['committed', 'completed', 'added', 'removed', 'incomplete'];
  const groups = new Map();
  for (const report of reports) {
    if (!report.hasClose || !report.hasStart) continue;
    const signature = JSON.stringify([report.unit, report.estimateSource, report.estimateCustomFieldId, report.completionPolicy, Boolean(report.partial)]);
    if (!groups.has(signature)) groups.set(signature, { unit: report.unit,
      estimateSource: report.estimateSource, completionPolicy: report.completionPolicy,
      estimateCustomFieldId: report.estimateCustomFieldId, rows: [], max: 0 });
    const group = groups.get(signature);
    const series = keys.map(key => {
      const value = report[key]?.[metric === 'estimate' ? 'estimate' : 'count'];
      const safe = Number.isFinite(value) && value >= 0 ? value : 0;
      group.max = Math.max(group.max, safe);
      return { key, value: safe, total: report[key] };
    });
    group.rows.push({ name: report.name, partial: report.partial, series });
  }
  return [...groups.values()].map(group => ({ ...group, rows: group.rows.map(row => ({ ...row,
    series: row.series.map(series => ({ ...series, width: group.max ? 100 * (series.value / group.max) : 0 })),
  })) }));
}
// The velocity rows from reports the server already computed
// (server/scrum.js getScrumBoardData: `sprint.report`).
function velocityReports(sprints) {
  return sprints.filter(s => s.state === 'closed' && s.closeSnapshot && s.report)
    .slice().sort((a, b) => new Date(a.closeSnapshot.at) - new Date(b.closeSnapshot.at))
    .map(s => s.report);
}
// Each release with the cards in it now (2026-10-08): its scope and the part
// of it that is done, under the board's completion policy. A card counts in
// EACH of its releases (models/lib/scrum.js cardReleaseIds - a card has
// several; the legacy single `releaseId` is one), so the releases' totals may
// add up to more than the board's cards; a card counts once in a release
// however its releases were written. Archived cards are not scope. `cards` are
// the ones the reader may see, so a restricted reader's totals are theirs.
function releaseReports(releases, cards, settings, lists = []) {
  const { cardReleaseIds, getCardEstimate, isScrumCardDone } = require('./scrum');
  const members = new Map((releases || []).map(release => [release._id, []]));
  for (const card of cards || []) {
    if (card.archived) continue;
    const row = { estimate: getCardEstimate(card, settings), done: isScrumCardDone(card, settings, lists) };
    for (const id of cardReleaseIds(card.scrum)) if (members.has(id)) members.get(id).push(row);
  }
  return (releases || []).map(release => {
    const rows = members.get(release._id);
    return { releaseId: release._id, name: release.name, state: release.state,
      scope: total(rows), done: total(rows.filter(row => row.done)) };
  });
}
module.exports = { releaseReports, total, reportTotals, sprintReport, velocityRows, velocityReports, reportChartGroups, plannedWorkingDays };
