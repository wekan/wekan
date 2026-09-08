// Event handlers for the not-yet-implemented board views in
// chartPlaceholderViews.jade - see that file for what each one is. Same
// stopPropagation as statsView.js/timeView.js: the board canvas's drag-to-
// scroll otherwise swallows the pointer/touch events native text selection
// needs on the placeholder's `.stats-view`.
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
