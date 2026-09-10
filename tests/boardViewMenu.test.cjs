'use strict';

// The "Board View" switcher menu (client/components/boards/boardHeader.jade,
// template boardChangeViewPopup) and the views it opens.
// Run: node tests/boardViewMenu.test.cjs
//
// Pins: the menu's top-to-bottom order, that every new entry carries a font-
// awesome icon, that each entry's click handler and isView* helper actually
// exist (a menu item that opens nothing is worse than no menu item), that
// every not-yet-built view is a real grey placeholder page titled like its
// menu entry, and that "Time spent summary" moved out of Statistics into its
// own Time view rather than being duplicated in both.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('boardViewMenu:');

const boardHeaderJade = read('client/components/boards/boardHeader.jade');
const boardHeaderJs = read('client/components/boards/boardHeader.js');
const boardBodyJade = read('client/components/boards/boardBody.jade');
const boardBodyJs = read('client/components/boards/boardBody.js');
const utilsJs = read('client/lib/utils.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

// view key -> { jsClass, view, icon, template, i18nKey }
const VIEWS = [
  { view: 'board-view-swimlanes', jsClass: 'js-open-swimlanes-view', icon: 'fa-th-large' },
  { view: 'board-view-lists', jsClass: 'js-open-lists-view', icon: 'fa-trello' },
  { view: 'board-view-table', jsClass: 'js-open-table-view', icon: 'fa-table' },
  { view: 'board-view-cal', jsClass: 'js-open-cal-view', icon: 'fa-calendar' },
  { view: 'board-view-multiboard-cal', jsClass: 'js-open-multiboard-cal-view', icon: 'fa-calendar-plus-o', template: 'multiboardCalendarView', helper: 'isViewMultiboardCalendar' },
  { view: 'board-view-time', jsClass: 'js-open-time-view', icon: 'fa-clock-o', template: 'timeView', helper: 'isViewTime' },
  { view: 'board-view-stats', jsClass: 'js-open-stats-view', icon: 'fa-pie-chart' },
  { view: 'board-view-group-by-assignee', jsClass: 'js-open-group-by-assignee-view', icon: 'fa-users', template: 'groupByAssigneeView', helper: 'isViewGroupByAssignee' },
  { view: 'board-view-gantt', jsClass: 'js-open-gantt-view', icon: 'fa-bar-chart' },
  { view: 'board-view-gantt-frappe', jsClass: 'js-open-gantt-frappe-view', icon: 'fa-tasks', template: 'frappeGanttView', helper: 'isViewGanttFrappe' },
  { view: 'board-view-gantt-dhtmlx', jsClass: 'js-open-gantt-dhtmlx-view', icon: 'fa-list-alt', template: 'dhtmlxGanttView', helper: 'isViewGanttDhtmlx' },
  { view: 'board-view-roadmap', jsClass: 'js-open-roadmap-view', icon: 'fa-road', template: 'roadmapView', helper: 'isViewRoadmap' },
  { view: 'board-view-dashboard', jsClass: 'js-open-dashboard-view', icon: 'fa-tachometer', template: 'dashboardView', helper: 'isViewDashboard', chart: true },
  { view: 'board-view-bigboard', jsClass: 'js-open-bigboard-view', icon: 'fa-th', template: 'bigboardView', helper: 'isViewBigboard' },
  { view: 'board-view-burndown', jsClass: 'js-open-burndown-view', icon: 'fa-line-chart', template: 'burndownView', helper: 'isViewBurndown', chart: true },
  { view: 'board-view-burnup', jsClass: 'js-open-burnup-view', icon: 'fa-area-chart', template: 'burnupView', helper: 'isViewBurnup', chart: true },
  { view: 'board-view-cumulative-flow', jsClass: 'js-open-cumulative-flow-view', icon: 'fa-signal', template: 'cumulativeFlowView', helper: 'isViewCumulativeFlow', chart: true },
  { view: 'board-view-control-chart', jsClass: 'js-open-control-chart-view', icon: 'fa-crosshairs', template: 'controlChartView', helper: 'isViewControlChart', chart: true },
  { view: 'board-view-cycle-time', jsClass: 'js-open-cycle-time-view', icon: 'fa-refresh', template: 'cycleTimeView', helper: 'isViewCycleTime', chart: true },
  { view: 'board-view-flow-efficiency', jsClass: 'js-open-flow-efficiency-view', icon: 'fa-percent', template: 'flowEfficiencyView', helper: 'isViewFlowEfficiency', chart: true },
  { view: 'board-view-lead-time', jsClass: 'js-open-lead-time-view', icon: 'fa-hourglass-half', template: 'leadTimeView', helper: 'isViewLeadTime', chart: true },
  { view: 'board-view-throughput-histogram', jsClass: 'js-open-throughput-histogram-view', icon: 'fa-columns', template: 'throughputHistogramView', helper: 'isViewThroughputHistogram', chart: true },
  { view: 'board-view-wip-run', jsClass: 'js-open-wip-run-view', icon: 'fa-flag-checkered', template: 'wipRunView', helper: 'isViewWipRun', chart: true },
  { view: 'board-view-pulse', jsClass: 'js-open-pulse-view', icon: 'fa-heartbeat', template: 'pulseView', helper: 'isViewPulse', chart: true },
];

// Between Table and Calendar, between Time and Statistics, between
// Statistics and the Gantt group, and between the Gantt group (WeKan's own
// Gantt, Frappe Gantt, DHTMLX Gantt) and Dashboard - like the right
// sidebar's own hr-separated groups (client/components/sidebar/sidebar.jade).
const HR_AFTER = ['board-view-table', 'board-view-time', 'board-view-stats', 'board-view-group-by-assignee', 'board-view-gantt-dhtmlx'];

test('the menu lists every view in the required top-to-bottom order', () => {
  const popup = boardHeaderJade.slice(boardHeaderJade.indexOf('template(name="boardChangeViewPopup")'));
  const positions = VIEWS.map(v => ({ view: v.view, at: popup.indexOf(`"${v.view}"`) }));
  positions.forEach(p => assert.ok(p.at !== -1, `${p.view} is in the menu`));
  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i].at > positions[i - 1].at,
      `${positions[i].view} must come after ${positions[i - 1].view}`);
  }
});

test('every entry carries a font-awesome icon', () => {
  const popup = boardHeaderJade.slice(boardHeaderJade.indexOf('template(name="boardChangeViewPopup")'));
  VIEWS.forEach(v => {
    const at = popup.indexOf(`"${v.view}"`);
    const block = popup.slice(at, at + 200);
    assert.ok(block.includes(`i.fa.${v.icon}`), `${v.view} uses ${v.icon}`);
    assert.ok(block.includes(`a.${v.jsClass}`), `${v.view} opens via .${v.jsClass}`);
  });
});

test('a chart view menu entry is no longer parenthesized as "not implemented yet"', () => {
  // These ten used to open a grey "not implemented yet" page and their menu
  // label was wrapped in literal parentheses to say so (#6690). Now each opens
  // a real chart (chartPlaceholderViews.jade + charts/boardCharts.js/.jade),
  // so the parentheses - which meant "coming soon" - would be actively wrong.
  const popup = boardHeaderJade.slice(boardHeaderJade.indexOf('template(name="boardChangeViewPopup")'));
  VIEWS.filter(v => v.chart).forEach(v => {
    const at = popup.indexOf(`"${v.view}"`);
    const block = popup.slice(at, at + 700);
    assert.ok(block.includes(`| {{_ '${v.view}'}}`),
      `${v.view}'s menu label is its translated key, unwrapped`);
    assert.ok(!block.includes(`| ({{_ '${v.view}'}})`),
      `${v.view}'s menu label is no longer parenthesized (negative)`);
  });
});

test('a separator sits between Table and Calendar, between Time and Statistics, and between Gantt and Dashboard', () => {
  // Like the right sidebar's own hr-separated groups
  // (client/components/sidebar/sidebar.jade's homeSidebar).
  const popup = boardHeaderJade.slice(boardHeaderJade.indexOf('template(name="boardChangeViewPopup")'));
  HR_AFTER.forEach(view => {
    const at = popup.indexOf(`"${view}"`);
    const nextLi = popup.indexOf('li', popup.indexOf('i.fa.fa-check', at));
    const between = popup.slice(at, nextLi);
    assert.match(between, /\n\s*hr\s*\n/, `an <hr> follows the ${view} entry`);
  });
});

test('every menu entry has a click handler that sets that board view', () => {
  VIEWS.forEach(v => {
    const re = new RegExp(`'click \\.${v.jsClass}'\\(\\)\\s*\\{[^}]*Utils\\.setBoardView\\('${v.view}'\\)`, 's');
    assert.ok(re.test(boardHeaderJs), `.${v.jsClass} calls Utils.setBoardView('${v.view}')`);
  });
});

test('every new view has an isView* helper and a boardBody.jade branch rendering its template', () => {
  VIEWS.filter(v => v.helper).forEach(v => {
    assert.ok(new RegExp(`${v.helper}\\(\\)\\s*\\{\\s*return Utils\\.boardView\\(\\) === '${v.view}'`).test(boardBodyJs),
      `${v.helper} reads Utils.boardView()`);
    assert.ok(new RegExp(`else if ${v.helper}\\s*\\n\\s*\\+${v.template}`).test(boardBodyJade),
      `boardBody.jade renders +${v.template} when ${v.helper}`);
  });
});

test('the anonymous-user fallback (no logged-in profile) accepts every view', () => {
  VIEWS.forEach(v => {
    assert.ok(utilsJs.includes(`'${v.view}'`), `${v.view} is handled in client/lib/utils.js`);
  });
});

test('every view has an English menu label', () => {
  VIEWS.forEach(v => {
    assert.ok(typeof en[v.view] === 'string' && en[v.view].length > 0, `${v.view} has an en.i18n.json label`);
  });
});

test('every view is an allowed value of the profile.boardView schema', () => {
  // #6675 follow-up: a view can be wired into the menu, the click handler,
  // isView* and the placeholder template and still be unusable end to end -
  // setBoardView's Meteor.call('setBoardView', ...) is rejected server-side
  // (SimpleSchema "is not an allowed value") for anyone with an account,
  // because THIS is the one list of legal values a logged-in user's
  // profile.boardView is actually checked against. It is separate from
  // every client-side list above on purpose (schema validation lives with
  // the collection it guards), which is exactly how it drifted out of sync.
  const usersJs = read('models/users.js');
  const at = usersJs.indexOf("'profile.boardView': {");
  assert.ok(at !== -1, 'the profile.boardView schema field exists');
  const block = usersJs.slice(at, usersJs.indexOf('},', usersJs.indexOf('allowedValues', at)));
  VIEWS.forEach(v => {
    assert.ok(block.includes(`'${v.view}'`), `${v.view} is an allowed profile.boardView value`);
  });
});

test('every view has a tooltip name, through a real translation key', () => {
  const at = boardHeaderJs.indexOf('boardViewName() {');
  assert.ok(at !== -1, 'the boardViewName helper exists');
  const block = boardHeaderJs.slice(at, boardHeaderJs.indexOf('return TAPi18n', at));
  VIEWS.forEach(v => {
    assert.ok(block.includes(`'${v.view}':`), `${v.view} has an entry in the tooltip name map`);
  });
});

test('every chart view renders the shared boardChartView, keyed and titled like its menu entry', () => {
  const placeholders = read('client/components/boards/chartPlaceholderViews.jade');
  VIEWS.filter(v => v.chart).forEach(v => {
    const at = placeholders.indexOf(`template(name="${v.template}")`);
    assert.ok(at !== -1, `${v.template} template exists`);
    const block = placeholders.slice(at, at + 300);
    assert.ok(block.includes('+boardChartView('), `${v.template} renders +boardChartView`);
    assert.ok(block.includes(`titleKey="${v.view}"`),
      `${v.template}'s title uses the same key as its menu entry (${v.view})`);
  });
});

test('the shared chart view calls the board-scoped boardChartData server method and offers PDF/Excel export', () => {
  const boardChartsJs = read('client/components/boards/charts/boardCharts.js');
  const boardsPublications = read('server/publications/boards.js');
  assert.match(boardChartsJs, /Meteor\.call\('boardChartData', boardId, chartKey/);
  assert.match(boardsPublications, /async boardChartData\(boardId, chartKey\)/);
  assert.match(boardsPublications, /board\.isVisibleBy\(\{ _id: this\.userId \}\)/);
  assert.match(boardChartsJs, /charts\/\$\{chartKey\}\/\$\{path\}/);
});

test('"Time spent summary" moved to the Time view and out of Statistics', () => {
  const timeJade = read('client/components/boards/timeView.jade');
  const statsJade = read('client/components/boards/statsView.jade');
  assert.match(timeJade, /board-status-time-summary/);
  assert.match(timeJade, /board-status-time-spent-total/);
  assert.match(timeJade, /board-status-cards-with-time/);
  assert.match(timeJade, /board-status-overtime-cards/);
  assert.doesNotMatch(statsJade, /board-status-time-summary/,
    'Statistics no longer has the time-summary section (negative)');
  assert.doesNotMatch(statsJade, /board-status-time-spent-total/,
    'Statistics no longer has the time-spent-total row (negative)');

  const timeJs = read('client/components/boards/timeView.js');
  const statsJs = read('client/components/boards/statsView.js');
  assert.match(timeJs, /timeSpentTotal\(\)/);
  assert.match(timeJs, /cardsWithTimeSpent\(\)/);
  assert.match(timeJs, /overtimeCards\(\)/);
  assert.doesNotMatch(statsJs, /timeSpentTotal\(\)/,
    'statsView.js no longer computes timeSpentTotal (negative)');
});

test('the new templates and stylesheets are registered, like every other board view', () => {
  const boardsFeature = read('client/features/boards.js');
  ['timeView.jade', 'timeView.js', 'groupByAssigneeView.jade', 'groupByAssigneeView.js', 'chartPlaceholderViews.jade', 'chartPlaceholderViews.js', 'bigboardView.jade', 'bigboardView.js', 'bigboardView.css', 'multiboardCalendarView.jade', 'multiboardCalendarView.js', 'multiboardCalendarView.css', 'roadmapView.jade', 'roadmapView.js', 'roadmapView.css']
    .forEach(f => {
      assert.ok(boardsFeature.includes(`/client/components/boards/${f}`), `${f} is imported`);
    });
  ['charts/boardCharts.jade', 'charts/boardCharts.js', 'charts/boardCharts.css']
    .forEach(f => {
      assert.ok(boardsFeature.includes(`/client/components/boards/${f}`), `${f} is imported`);
    });
});

console.log(`\nboardViewMenu: ${passed} tests passed`);
