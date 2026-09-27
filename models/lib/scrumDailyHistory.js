const { total } = require('./scrumReports');

// A sample is an observation, not proof that no intervening events occurred.
// Return only measured days; the chart must not interpolate missing history.
function dailyHistoryRows(samples, visibleIds = null) {
  return samples.map(sample => {
    const cards = sample.snapshot.cards.filter(card => !visibleIds || visibleIds.has(card.cardId));
    return { day: sample.day, capturedAt: sample.capturedAt,
      unit: sample.snapshot.unit, scope: total(cards),
      estimateSource: sample.snapshot.estimateSource,
      estimateCustomFieldId: sample.snapshot.estimateCustomFieldId,
      completionPolicy: sample.snapshot.completionPolicy,
      remaining: total(cards.filter(card => !card.done)),
      completed: total(cards.filter(card => card.done)),
      partial: Boolean(visibleIds || sample.snapshot.partial), consistency: 'observed' };
  });
}

// Separate units and partial samples before scaling. Missing calendar
// days are not inserted or connected: every bar represents a measured instant.
function dailyChartGroups(rows, metric = 'count') {
  const groups = new Map();
  for (const row of rows) {
    const signature = JSON.stringify([row.unit, Boolean(row.partial)]);
    if (!groups.has(signature)) groups.set(signature, { unit: row.unit, partial: Boolean(row.partial), rows: [], max: 0 });
    const group = groups.get(signature);
    const series = ['scope', 'remaining', 'completed'].map(key => {
      const value = row[key][metric === 'estimate' ? 'estimate' : 'count'];
      group.max = Math.max(group.max, value);
      return { key, value, total: row[key] };
    });
    group.rows.push({ ...row, series });
  }
  return [...groups.values()].map(group => ({ ...group, rows: group.rows.map(row => ({ ...row,
    series: row.series.map(series => ({ ...series, width: group.max ? 100 * series.value / group.max : 0 })),
  })) }));
}

module.exports = { dailyHistoryRows, dailyChartGroups };
