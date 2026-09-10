import { TAPi18n } from '/imports/i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Utils } from '/client/lib/utils';
const { chartExportRows } = require('/models/lib/chartExportRows');

// Shared by the 10 chart views registered in chartPlaceholderViews.jade: reads
// `boardChartData` (server/publications/boards.js) for whichever `chartKey`
// the wrapper template passed in, and draws it the same way statsView/
// timeView draw the board's status - onCreated calls the method, a
// ReactiveVar holds the answer, helpers read it. No charting library: bars
// are plain CSS width percentages, following docs/Features/Reports/charts.tsv.
Template.boardChartView.onCreated(function() {
  this.chartData = new ReactiveVar(null);
  this.loading = new ReactiveVar(true);
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    const chartKey = Template.currentData().chartKey;
    if (!boardId || !chartKey) return;
    this.loading.set(true);
    Meteor.call('boardChartData', boardId, chartKey, (err, res) => {
      this.loading.set(false);
      if (!err) this.chartData.set(res);
    });
  });
});

Template.boardChartView.events({
  'mousedown .stats-view'(event) {
    event.stopPropagation();
  },
  'touchstart .stats-view'(event) {
    event.stopPropagation();
  },
});

// The one series (or point/group list) each chart draws as CSS bars, capped
// to a readable number of rows - a year of burndown days as one bar each
// would not fit any screen, so the most recent window is shown, newest last.
const MAX_BARS = 24;
const BAR_COLOR = '#3498db';

function barsFromSeries(series, valueKey, labelKey) {
  const slice = series.slice(-MAX_BARS);
  const max = Math.max(1, ...slice.map(row => Number(row[valueKey]) || 0));
  return slice.map(row => ({
    label: row[labelKey],
    value: Math.round((Number(row[valueKey]) || 0) * 100) / 100,
    percent: Math.round(((Number(row[valueKey]) || 0) / max) * 100),
    color: BAR_COLOR,
  }));
}

function computeBarRows(chartKey, data) {
  if (!data) return [];
  if (chartKey === 'burndown') return barsFromSeries(data.series, 'remaining', 'day');
  if (chartKey === 'burnup') return barsFromSeries(data.series, 'completed', 'day');
  if (chartKey === 'wipRun') return barsFromSeries(data.series, 'count', 'day');
  if (chartKey === 'throughputHistogram') return barsFromSeries(data.series, 'count', 'bucket');
  if (chartKey === 'cumulativeFlow') {
    const last = data.lists.map(list => ({
      list: list.title,
      day: (data.series[data.series.length - 1] || { counts: {} }).counts[list._id] || 0,
    }));
    return barsFromSeries(last, 'day', 'list');
  }
  if (chartKey === 'controlChart' || chartKey === 'leadTime' || chartKey === 'cycleTime') {
    return barsFromSeries(data.points, 'cycleDays' in (data.points[0] || {}) ? 'cycleDays' : 'leadDays', 'title');
  }
  if (chartKey === 'flowEfficiency') return barsFromSeries(data.points, 'efficiency', 'title');
  if (chartKey === 'dashboard') return barsFromSeries(data.byAssignee, 'count', 'label');
  return [];
}

Template.boardChartView.helpers({
  chartTitle() {
    return TAPi18n.__(Template.currentData().titleKey);
  },
  isLoading() {
    return Template.instance().loading.get() && !Template.instance().chartData.get();
  },
  hasNoData() {
    const { rows } = tableOf();
    return !rows.length;
  },
  barRows() {
    const chartKey = Template.currentData().chartKey;
    return computeBarRows(chartKey, Template.instance().chartData.get());
  },
  tableHeaders() {
    return tableOf().headers;
  },
  tableRows() {
    return tableOf().rows;
  },
  exportUrl(format) {
    const boardId = Session.get('currentBoard');
    const chartKey = Template.currentData().chartKey;
    if (!boardId || !chartKey) return '';
    const path = format === 'PDF' ? 'exportPDF' : 'exportExcel';
    const params = new URLSearchParams({
      authToken: Accounts._storedLoginToken() || '',
      lang: TAPi18n.getLanguage ? TAPi18n.getLanguage() : 'en',
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      dateFormat: (Meteor.user() && Meteor.user().profile && Meteor.user().profile.dateFormat) || 'YYYY-MM-DD',
    });
    return `/api/boards/${boardId}/charts/${chartKey}/${path}?${params.toString()}`;
  },
});

// The data table, shared with the export - same `chartExportRows` the PDF/
// Excel routes call server-side, so what a reader sees on screen is the same
// rows the download contains.
function tableOf() {
  const instance = Template.instance();
  const data = instance.chartData.get();
  const chartKey = Template.currentData().chartKey;
  if (!data || !chartKey) return { headers: [], rows: [] };
  return chartExportRows(chartKey, data, key => TAPi18n.__(key));
}
