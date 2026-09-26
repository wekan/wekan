import { titleViewerText } from '/client/lib/titleViewer';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from '/imports/i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Utils } from '/client/lib/utils';
const { chartExportRows } = require('/models/lib/chartExportRows');
const { translateGroupLabel } = require('/models/lib/chartCalculations');
const FLOW_KEYS = ['agingWip', 'blockerAnalysis', 'monteCarlo', 'processBehavior', 'sizeCycleTime'];
const { flowDetailRows } = require('/models/lib/flowAnalyticsRows');
let flowRenderer;
function loadFlowRenderer() {
  if (!flowRenderer) flowRenderer = import('./flowChartConfig').catch(error => { flowRenderer = null; throw error; });
  return flowRenderer;
}

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
  this.options = new ReactiveVar({});
  this.error = new ReactiveVar(false);
  this.requestId = 0;
  this.secondaryChart = null;
  this.renderVersion = 0;
  this.loading = new ReactiveVar(true);
  this.chartJsInstance = null;
  this.destroyed = false;
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    const chartKey = Template.currentData().chartKey;
    if (!boardId || !chartKey) return;
    const options = this.options.get();
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.error.set(false);
    this.chartData.set(null);
    Meteor.call('boardChartData', boardId, chartKey, options, (err, res) => {
      if (this.destroyed || requestId !== this.requestId) return;
      this.loading.set(false);
      this.error.set(!!err);
      if (!err) this.chartData.set(res);
    });
  });
});

Template.boardChartView.onDestroyed(function() {
  this.destroyed = true;
  if (this.secondaryChart) this.secondaryChart.destroy();
  if (this.chartJsInstance) {
    this.chartJsInstance.destroy();
    this.chartJsInstance = null;
  }
});

Template.boardChartView.events({
  'submit .js-flow-options'(event, instance) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const options = {};
    ['targetCount', 'targetDate', 'historyDays', 'sizeField'].forEach(key => {
      const field = form.elements.namedItem(key);
      if (field) options[key] = field.value;
    });
    instance.options.set(options);
  },
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
    ChartJsPromise = import('chart.js/auto').then(mod => mod.Chart || mod.default || mod)
      .catch(error => { ChartJsPromise = null; throw error; });
  }
  return ChartJsPromise;
}

Template.boardChartView.onRendered(function() {
  const templateInstance = this;

  const advanced = FLOW_KEYS.includes(Template.currentData().chartKey);
  Promise.all([loadChartJs(), advanced ? loadFlowRenderer() : null]).then(([Chart, renderer]) => {
    if (templateInstance.destroyed) return;
    templateInstance.autorun(() => {
      // Read the data context HERE, inside the autorun: Tracker.afterFlush
      // below runs outside any Blaze view, so Template.currentData() there
      // throws "There is no current view" - which killed the whole chart
      // build and left the Dashboard's canvas area empty.
      const data = Template.currentData();
      const chartKey = data.chartKey;
      const titleKey = data.titleKey;
      const chartData = templateInstance.chartData.get();
      const rows = computeBarRows(chartKey, chartData);
      const configs = renderer ? renderer.flowChartConfigs(chartKey, chartData, key => TAPi18n.__(key), titleViewerText) : null;
      const renderVersion = ++templateInstance.renderVersion;
      // Canvas accepts text, not HTML. Preserve viewer text and emoji while
      // tracking policies before the nonreactive afterFlush callback.
      const labels = rows.map(row => titleViewerText(row.label));
      const datasetTitle = titleViewerText(TAPi18n.__(titleKey));
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
        if (renderVersion !== templateInstance.renderVersion) return;
        if (templateInstance.secondaryChart) {
          templateInstance.secondaryChart.destroy();
          templateInstance.secondaryChart = null;
        }
        const canvas = templateInstance.find('.js-chart-canvas');
        if (!canvas) return;
        if (templateInstance.chartJsInstance) {
          templateInstance.chartJsInstance.destroy();
          templateInstance.chartJsInstance = null;
        }
        if (configs) {
          if (configs[0]) templateInstance.chartJsInstance = new Chart(canvas, configs[0]);
          const secondary = templateInstance.find('.js-chart-secondary');
          if (configs[1] && secondary) templateInstance.secondaryChart = new Chart(secondary, configs[1]);
          return;
        }
        if (!rows.length) return;
        templateInstance.chartJsInstance = new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: datasetTitle,
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
    if (!templateInstance.destroyed) templateInstance.error.set(true);
    console.error('Could not load chart:', error);
  });
});

Template.boardChartView.helpers({
  hasError() { return Template.instance().error.get(); },
  isMonteCarlo() { return Template.currentData().chartKey === 'monteCarlo'; },
  isSizeCycleTime() { return Template.currentData().chartKey === 'sizeCycleTime'; },
  hasSecondaryChart() { return ['monteCarlo', 'processBehavior'].includes(Template.currentData().chartKey); },
  reportOptions() { return Template.instance().chartData.get()?.options || {}; },
  reportOptionsJson() { return JSON.stringify(Template.instance().chartData.get()?.options || {}); },
  sizeFields() { return Template.instance().chartData.get()?.sizeFields || []; },
  sizeSelected(id) { return Template.instance().chartData.get()?.options.sizeField === id; },
  flowNote() {
    const key = Template.currentData().chartKey;
    return FLOW_KEYS.includes(key) ? TAPi18n.__(`flow-note-${key}`) : null;
  },
  detailTable() {
    return flowDetailRows(Template.currentData().chartKey, Template.instance().chartData.get() || {}, key => TAPi18n.__(key));
  },
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
