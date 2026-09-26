'use strict';

// Single source for screen, Excel and PDF. Null measurements are unknown,
// never coerced to zero; dates stay Dates for the existing locale exporters.
function flowAnalyticsRows(key, data, translate = (key, fallback) => fallback) {
  const t = (key, fallback) => translate(key, fallback);
  const number = value => value == null ? t('flow-unknown', 'Unknown') : Math.round(value * 100) / 100;
  const card = t('card', 'Card');
  const list = t('list', 'List');
  const cycle = t('flow-cycle-days', 'Cycle time (days)');
  if (key === 'agingWip') return {
    headers: [card, list, t('flow-age-days', 'Age in stage (days)'), t('flow-p85', 'Stage 85th percentile (days)'), t('flow-samples', 'Samples'), t('flow-signal', 'Signal')],
    rows: (data.points || []).map(p => [p.title, p.list, number(p.ageDays), number(p.threshold), p.samples,
      p.unusual ? t('flow-unusual', 'Above limit') : '']),
  };
  if (key === 'blockerAnalysis') return {
    headers: [t('flow-blocker', 'Blocker'), t('flow-episodes', 'Episodes'), t('flow-active', 'Open episodes'), t('flow-blocked-days', 'Blocked card-days'), t('flow-unknown-start', 'Unknown starts'), t('cards', 'Cards'), t('lists', 'Lists')],
    rows: (data.groups || []).map(g => [g.title, g.count, g.active, number(g.days), g.unknown, g.cards, g.lists]),
  };
  if (key === 'monteCarlo') return {
    headers: [t('flow-confidence', 'Confidence'), t('flow-target-count', 'Target cards'), t('flow-finish-days', 'Days to finish'), t('flow-finish-date', 'Finish date'), t('flow-target-date', 'Target date'), t('flow-capacity', 'At least this many cards'), t('flow-history-days', 'History days')],
    rows: (data.forecasts || []).map(p => [`${p.probability}%`, data.options.targetCount,
      number(p.days), p.date || t('flow-beyond-horizon', 'Beyond simulation horizon'),
      data.options.targetDate, p.count, data.history.length]),
  };
  if (key === 'processBehavior') return {
    headers: [card, t('completed', 'Completed'), cycle, t('flow-mean', 'Mean'), 'LCL', 'UCL', t('flow-moving-range', 'Moving range'), t('flow-mr-mean', 'Mean moving range'), 'MR UCL', t('flow-signal', 'Signal')],
    rows: (data.points || []).map(p => [p.title, p.completedAt, number(p.cycleDays), number(data.limits.average),
      number(data.limits.lower), number(data.limits.upper), number(p.movingRange), number(data.limits.mrAverage),
      number(data.limits.mrUpper), p.signal ? t('flow-unusual', 'Above limit') : '']),
  };
  if (key === 'sizeCycleTime') return {
    headers: [card, t('flow-size-source', 'Size field'), t('flow-size', 'Estimate'), cycle, t('completed', 'Completed')],
    rows: (data.points || []).map(p => [p.title, data.options.sizeField === 'poker' ? t('poker-question', 'Planning Poker')
      : data.sizeFields.find(f => f._id === data.options.sizeField)?.name, p.size, number(p.cycleDays), p.completedAt]),
  };
  return { headers: [], rows: [] };
}

function flowDetailRows(key, data, t = (key, fallback) => fallback) {
  if (key === 'blockerAnalysis') return {
    headers: [t('flow-blocker', 'Blocker'), t('card', 'Card'), t('list', 'List'), t('card-start', 'Start'), t('card-end', 'End'), t('days', 'Days')],
    rows: (data.episodes || []).map(p => [p.blocker, p.title, p.list || p.listId,
      p.startAt || t('flow-unknown', 'Unknown'), p.endAt || t('flow-active', 'Open episodes'),
      p.days == null ? t('flow-unknown', 'Unknown') : Math.round(p.days * 100) / 100]),
  };
  if (key === 'monteCarlo') return {
    headers: [t('date', 'Date'), t('completed', 'Completed')],
    rows: (data.history || []).map(row => [row.day, row.count]),
  };
  return { headers: [], rows: [] };
}
module.exports = { flowAnalyticsRows, flowDetailRows };
