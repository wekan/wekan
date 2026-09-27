'use strict';

// Turns one chart's data (server/lib/boardChartData.js's return value) into a
// plain { title, headers, rows } table - the same shape for both the PDF and
// the Excel chart exporters, so a chart's export is one function away from
// either format. `translate(key, fallback)` is the exporter's own `__()`.

const { translateGroupLabel, formatRemainingTime } = require('./chartCalculations');

const CHART_TITLE_KEYS = {
  scrumDaily: ['scrum-daily-observations', 'Daily scope and remaining work (observations)'],
  scrumSprint: ['board-view-sprint-report', 'Sprint Report'],
  scrumVelocity: ['board-view-velocity', 'Velocity'],
  agingWip: ['board-view-aging-wip', 'Aging WIP'],
  blockerAnalysis: ['board-view-blocker-analysis', 'Blocker Analysis'],
  monteCarlo: ['board-view-monte-carlo', 'Monte Carlo Forecasts'],
  processBehavior: ['board-view-process-behavior', 'Process Behavior (XmR)'],
  sizeCycleTime: ['board-view-size-cycle-time', 'Work Item Size vs. Cycle Time'],

  dashboard: ['board-view-dashboard', 'Dashboard'],
  burndown: ['board-view-burndown', 'Burndown'],
  burnup: ['board-view-burnup', 'Burnup'],
  cumulativeFlow: ['board-view-cumulative-flow', 'Cumulative Flow Diagram'],
  controlChart: ['board-view-control-chart', 'Control Chart'],
  cycleTime: ['board-view-cycle-time', 'Cycle Time'],
  flowEfficiency: ['board-view-flow-efficiency', 'Flow Efficiency'],
  leadTime: ['board-view-lead-time', 'Lead Time'],
  throughputHistogram: ['board-view-throughput-histogram', 'Throughput Histogram'],
  wipRun: ['board-view-wip-run', 'WIP Run'],
  gantt: ['board-view-gantt', 'Gantt'],
  time: ['board-view-time', 'Time'],
  pulse: ['board-view-pulse', 'Pulse'],
};

function chartTitle(chartKey, translate) {
  const [key, fallback] = CHART_TITLE_KEYS[chartKey] || [chartKey, chartKey];
  return translate ? translate(key, fallback) : fallback;
}

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function chartExportRows(chartKey, data, translate = (key, fallback) => fallback) {
  const title = chartTitle(chartKey, translate);
  if (chartKey === 'scrumDaily') {
    const headers = [translate('scrum-sprint', 'Sprint'), translate('date', 'Date'), 'UTC', translate('scrum-estimate-unit', 'Unit')];
    for (const [key, fallback] of [['scrum-observed-scope', 'Observed scope'], ['scrum-incomplete', 'Incomplete'], ['scrum-completed', 'Completed']]) {
      const label = translate(key, fallback);
      headers.push(`${label}: ${translate('cards', 'Cards')}`, `${label}: ${translate('scrum-estimate', 'Estimate')}`,
        `${label}: ${translate('scrum-unknown-estimate', 'Unknown estimate')}`);
    }
    const notices = [translate('scrum-daily-observations-export-help',
      'First recorded observation of each UTC day; missing days are omitted. Observations do not record every change or end-of-day totals. Unknown estimates are not zero.')];
    headers.push(translate('scrum-estimate-source', 'Estimate source'), translate('custom-field', 'Custom field'),
      translate('scrum-completion-policy', 'Completion policy'));
    if (data.partial) notices.push(translate('scrum-partial-report', 'Visible assigned cards only'));
    if (data.rows?.some(row => row.partial)) notices.push(translate('scrum-partial-snapshot', 'Partial original snapshot'));
    if (data.truncated) notices.push(translate('scrum-daily-truncated', 'Only the most recent 366 observations are shown.'));
    return { title, notices, headers, rows: (data.rows || []).map(row => [data.sprintName || '', row.day,
      new Date(row.capturedAt).toISOString(), row.unit,
      ...['scope', 'remaining', 'completed'].flatMap(key => [row[key].count, row[key].estimate, row[key].unknown]),
      row.estimateSource || '', row.estimateCustomFieldId || '', row.completionPolicy || '']) };
  }
  if (['agingWip', 'blockerAnalysis', 'monteCarlo', 'processBehavior', 'sizeCycleTime'].includes(chartKey)) {
    return { title, ...require('./flowAnalyticsRows').flowAnalyticsRows(chartKey, data, translate) };
  }

  if (['scrumSprint', 'scrumVelocity'].includes(chartKey)) {
    const totals = ['committed', 'completed', 'added', 'removed', 'incomplete'];
    const headers = [translate('scrum-sprint', 'Sprint'), translate('scrum-estimate-unit', 'Unit')];
    for (const key of totals) {
      const label = translate(`scrum-${key}`, key);
      headers.push(`${label}: ${translate('cards', 'Cards')}`,
        `${label}: ${translate('scrum-estimate', 'Estimate')}`,
        `${label}: ${translate('scrum-unknown-estimate', 'Unknown estimate')}`);
    }
    headers.push(translate('scrum-working-days', 'Working days'));
    headers.push(translate('scrum-estimate-source', 'Estimate source'),
      translate('custom-field', 'Custom field'), translate('scrum-completion-policy', 'Completion policy'));
    const commitment = `${translate('scrum-completed', 'Completed')} / ${translate('scrum-committed', 'Committed')}`;
    headers.push(`${commitment}: ${translate('cards', 'Cards')}`,
      `${commitment}: ${translate('scrum-estimate', 'Estimate')}`,
      `${commitment}: ${translate('scrum-unknown-estimate', 'Unknown estimate')}`);
    return { title: data.partial ? `${title} — ${translate('scrum-partial-report', 'Visible assigned cards only')}` : title, headers, rows: (data.reports || []).map(report =>
      [report.partial ? `${report.name} — ${translate('scrum-partial-snapshot', 'Partial original snapshot')}` : report.name, report.unit, ...totals.flatMap(key => [report[key].count, report[key].estimate, report[key].unknown]), report.plannedWorkingDays ?? '',
        report.estimateSource || '', report.estimateCustomFieldId || '', report.completionPolicy || '',
        report.completedCommitment?.count ?? '', report.completedCommitment?.estimate ?? '', report.completedCommitment?.unknown ?? '']) };
  }

  if (chartKey === 'cumulativeFlow') {
    const listTitles = data.lists.map(list => list.title);
    return {
      title,
      headers: [translate('date', 'Date'), ...listTitles],
      rows: data.series.map(day => [day.day, ...data.lists.map(list => day.counts[list._id] || 0)]),
    };
  }

  if (chartKey === 'wipRun') {
    return {
      title,
      headers: [translate('date', 'Date'), translate('board-view-wip-run', 'WIP'), translate('wipLimit', 'Limit')],
      rows: data.series.map(day => [day.day, day.count, day.limit ?? '-']),
    };
  }

  if (chartKey === 'controlChart') {
    return {
      title,
      headers: [
        translate('card', 'Card'), translate('completed', 'Completed'),
        translate('board-view-cycle-time', 'Cycle (days)'), 'Average', 'StdDev',
      ],
      rows: data.points.map(point => [
        point.title || point.cardId, point.completedAt,
        round(point.cycleDays), round(point.average), round(point.stddev),
      ]),
    };
  }

  if (chartKey === 'leadTime' || chartKey === 'cycleTime') {
    return {
      title,
      headers: [
        translate('card', 'Card'), translate('completed', 'Completed'),
        translate('board-view-lead-time', 'Lead (days)'), translate('board-view-cycle-time', 'Cycle (days)'),
      ],
      rows: data.points.map(point => [
        point.title || point.cardId, point.completedAt, round(point.leadDays), round(point.cycleDays),
      ]),
    };
  }

  if (chartKey === 'burndown') {
    return {
      title,
      headers: [translate('date', 'Date'), translate('board-view-burndown', 'Remaining'), 'Ideal'],
      rows: data.series.map(day => [day.day, day.remaining, day.ideal]),
    };
  }

  if (chartKey === 'burnup') {
    return {
      title,
      headers: [translate('date', 'Date'), 'Total', translate('completed', 'Completed')],
      rows: data.series.map(day => [day.day, day.total, day.completed]),
    };
  }

  if (chartKey === 'throughputHistogram') {
    return {
      title,
      headers: [translate('board-view-throughput-histogram', 'Week'), translate('cards', 'Cards')],
      rows: data.series.map(bucket => [bucket.bucket, bucket.count]),
    };
  }

  if (chartKey === 'flowEfficiency') {
    return {
      title,
      headers: [
        translate('card', 'Card'), translate('board-view-flow-efficiency', 'Efficiency %'),
        'Active (h)', 'Total (h)',
      ],
      rows: data.points.map(point => [
        point.title || point.cardId, round(point.efficiency), round(point.activeHours), round(point.totalHours),
      ]),
    };
  }

  if (chartKey === 'pulse') {
    return {
      title,
      headers: [translate('date', 'Date'), translate('board-view-pulse', 'Pulse')],
      rows: data.series.map(day => [day.day, day.count]),
    };
  }

  if (chartKey === 'gantt') {
    return {
      title,
      headers: [
        translate('card', 'Card'), translate('card-start', 'Start'),
        translate('card-due', 'Due'), translate('card-end', 'End'),
      ],
      rows: data.cards.map(card => [card.title, card.startAt || '-', card.dueAt || '-', card.endAt || '-']),
    };
  }

  if (chartKey === 'dashboard') {
    const section = (name, groups) => [
      [name, ''],
      ...groups.map(group => [translateGroupLabel(group.label, translate), `${group.count} (${group.percent}%)`]),
      ['', ''],
    ];
    return {
      title,
      headers: [translate('name', 'Name'), translate('cards', 'Cards')],
      rows: [
        ...section(translate('assignees', 'Assignees'), data.byAssignee),
        ...section(translate('labels', 'Labels'), data.byLabel),
        ...section(translate('lists', 'Lists'), data.byList),
      ],
    };
  }

  if (chartKey === 'time') {
    // #812 ("reporting total hours by resource and task type"): the same
    // sectioned two-column shape as 'dashboard' above, one section per
    // breakdown - who logged how many hours, and which cards they went to.
    const section = (name, rows) => [[name, ''], ...rows, ['', '']];
    const overtimeSuffix = card => card.isOvertime ? ` (${translate('overtime', 'Overtime')})` : '';
    return {
      title,
      headers: [translate('name', 'Name'), translate('hours', 'Hours')],
      rows: [
        // #1121: the sum of remaining time until due date, as its own
        // one-row section ahead of the hours breakdowns, so the export
        // carries the same summary the Time view shows on screen.
        ...section(translate('board-status-remaining-time-total', 'Remaining time until due'),
          [[translate('board-status-remaining-time-total', 'Remaining time until due'),
            formatRemainingTime(data.remaining, translate)]]),
        ...section(translate('time-adjustments', 'Time adjustments by author'), (data.adjustments?.groups || []).map(group => [group.label, group.hours])),
        ...section(translate('assignees', 'Assignees'), data.byAssignee.map(group =>
          [translateGroupLabel(group.label, translate), group.hours])),
        ...section(translate('card', 'Card'), data.byCard.map(card =>
          [`${card.title}${overtimeSuffix(card)}`, card.hours])),
      ],
    };
  }

  return { title, headers: [], rows: [] };
}

module.exports = { chartExportRows, chartTitle };
