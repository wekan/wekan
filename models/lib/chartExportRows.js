'use strict';

// Turns one chart's data (server/lib/boardChartData.js's return value) into a
// plain { title, headers, rows } table - the same shape for both the PDF and
// the Excel chart exporters, so a chart's export is one function away from
// either format. `translate(key, fallback)` is the exporter's own `__()`.

const CHART_TITLE_KEYS = {
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
      ...groups.map(group => [group.label, `${group.count} (${group.percent}%)`]),
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

  return { title, headers: [], rows: [] };
}

module.exports = { chartExportRows, chartTitle };
