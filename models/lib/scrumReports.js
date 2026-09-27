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
  // Index completion once: a sprint may contain 10,000 snapshot rows.
  const doneIds = new Set(done.map(card => card.cardId));
  return {
    sprintId: sprint._id, name: sprint.name, state: sprint.state,
    unit: sprint.closeSnapshot?.unit || sprint.startSnapshot?.unit || '',
    estimateSource: sprint.closeSnapshot?.estimateSource || sprint.startSnapshot?.estimateSource || '',
    estimateCustomFieldId: sprint.closeSnapshot?.estimateCustomFieldId || sprint.startSnapshot?.estimateCustomFieldId || '',
    completionPolicy: sprint.closeSnapshot?.completionPolicy || sprint.startSnapshot?.completionPolicy || '',
    committed: total(start), completed: total(done),
    completedCommitment: total(start.filter(card => doneIds.has(card.cardId))),
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
module.exports = { total, sprintReport, velocityRows, reportChartGroups };
