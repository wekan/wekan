// Event handlers for the 10 board report chart views in
// chartPlaceholderViews.jade - see that file, and charts/boardCharts.js, for
// what each one renders. Same stopPropagation as statsView.js/timeView.js:
// the board canvas's drag-to-scroll otherwise swallows the pointer/touch
// events native text selection needs on the chart's `.stats-view`.
const PLACEHOLDER_VIEW_TEMPLATES = [
  'dashboardView',
  'burndownView',
  'burnupView',
  'cumulativeFlowView',
  'controlChartView',
  'cycleTimeView',
  'flowEfficiencyView',
  'leadTimeView',
  'throughputHistogramView',
  'wipRunView',
];

PLACEHOLDER_VIEW_TEMPLATES.forEach(name => {
  Template[name].events({
    'mousedown .stats-view'(event) {
      event.stopPropagation();
    },
    'touchstart .stats-view'(event) {
      event.stopPropagation();
    },
  });
});
