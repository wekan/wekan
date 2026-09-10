import { TAPi18n } from '/imports/i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Utils } from '/client/lib/utils';
const { chartExportRows } = require('/models/lib/chartExportRows');
const { translateGroupLabel } = require('/models/lib/chartCalculations');

// Shared by the 10 chart views registered in chartPlaceholderViews.jade: reads
// `boardChartData` (server/publications/boards.js) for whichever `chartKey`
// the wrapper template passed in, and draws it the same way statsView/
// timeView draw the board's status - onCreated calls the method, a
// ReactiveVar holds the answer, helpers read it. Drawn with Chart.js (MIT,
// canvas-based), loaded with a dynamic import() so its code only reaches the
// browser when a chart view actually mounts, following
// docs/Features/Reports/charts.tsv for what each chartKey means.
Template.boardChartView.onCreated(function() {
  this.chartData = new ReactiveVar(null);
  this.loading = new ReactiveVar(true);
  this.chartJsInstance = null;
  this.destroyed = false;
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

Template.boardChartView.onDestroyed(function() {
  this.destroyed = true;
  if (this.chartJsInstance) {
    this.chartJsInstance.destroy();
    this.chartJsInstance = null;
  }
});

Template.boardChartView.events({
  'mousedown .stats-view'(event) {
    event.stopPropagation();
  },
  'touchstart .stats-view'(event) {
    event.stopPropagation();
  },
});

// The one series (or point/group list) each chart draws, capped to a
// readable number of bars - a year of burndown days as one bar each would
// not fit any screen, so the most recent window is shown, newest last.
const MAX_BARS = 24;
const BAR_COLOR = '#3498db';

function barsFromSeries(series, valueKey, labelKey) {
  const slice = series.slice(-MAX_BARS);
  return slice.map(row => ({
    label: row[labelKey],
    value: Math.round((Number(row[valueKey]) || 0) * 100) / 100,
  }));
}

function computeBarRows(chartKey, data) {
  if (!data) return [];
  if (chartKey === 'burndown') return barsFromSeries(data.series, 'remaining', 'day');
  if (chartKey === 'burnup') return barsFromSeries(data.series, 'completed', 'day');
  if (chartKey === 'wipRun') return barsFromSeries(data.series, 'count', 'day');
  if (chartKey === 'throughputHistogram') return barsFromSeries(data.series, 'count', 'bucket');
  if (chartKey === 'pulse') return barsFromSeries(data.series, 'count', 'day');
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
  if (chartKey === 'dashboard') {
    return barsFromSeries(data.byAssignee, 'count', 'label')
      .map(row => ({ ...row, label: translateGroupLabel(row.label, key => TAPi18n.__(key)) }));
  }
  return [];
}

// Loaded once per page, reused by every chart view opened afterward.
let ChartJsPromise = null;
function loadChartJs() {
  if (!ChartJsPromise) {
    ChartJsPromise = import('chart.js/auto').then(mod => mod.Chart || mod.default || mod);
  }
  return ChartJsPromise;
}

Template.boardChartView.onRendered(function() {
  const templateInstance = this;

  loadChartJs().then(Chart => {
    if (templateInstance.destroyed) return;
    templateInstance.autorun(() => {
      const chartKey = Template.currentData().chartKey;
      const rows = computeBarRows(chartKey, templateInstance.chartData.get());
      // The `<canvas>` only exists in the DOM once isLoading/hasNoData flip
      // jade to the "else" branch - a sibling reactive change driven by the
      // SAME chartData update this autorun also depends on, with no
      // guaranteed ordering between the two. Without afterFlush, the very
      // first successful data load can run this body before Blaze has
      // patched the DOM: templateInstance.find() returns null, the chart is
      // silently never built, and nothing triggers a retry afterward - the
      // canvas area stays empty (#Dashboard-charts-invisible).
      Tracker.afterFlush(() => {
        if (templateInstance.destroyed) return;
        const canvas = templateInstance.find('.js-chart-canvas');
        if (!canvas) return;
        if (templateInstance.chartJsInstance) {
          templateInstance.chartJsInstance.destroy();
          templateInstance.chartJsInstance = null;
        }
        if (!rows.length) return;
        templateInstance.chartJsInstance = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: rows.map(row => row.label),
            datasets: [{
              label: TAPi18n.__(Template.currentData().titleKey),
              data: rows.map(row => row.value),
              backgroundColor: BAR_COLOR,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          },
        });
      });
    });
  }).catch(error => {
    console.error('Could not load Chart.js:', error);
  });
});

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
  // #1476 ("completion estimates based on velocity"): only the Throughput
  // Histogram view carries a `forecast` field (server/lib/boardChartData.js),
  // computed from that same series by computeCompletionForecast.
  forecastNote() {
    if (Template.currentData().chartKey !== 'throughputHistogram') return null;
    const data = Template.instance().chartData.get();
    const forecast = data && data.forecast;
    if (!forecast) return null;
    if (forecast.remaining === 0) return TAPi18n.__('chart-forecast-none-remaining');
    if (!forecast.projectedDate) return TAPi18n.__('chart-forecast-no-velocity', { remaining: forecast.remaining });
    return TAPi18n.__('chart-forecast-projected', {
      remaining: forecast.remaining,
      average: forecast.averagePerBucket,
      date: forecast.projectedDate,
    });
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
