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
  { view: 'board-view-timeline', jsClass: 'js-open-timeline-view', icon: 'fa-history', template: 'timelineView', helper: 'isViewTimeline' },
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

// Between Table and Calendar, between Timeline and Statistics, between
// Statistics and the Gantt group, between the Gantt group (WeKan's own
// Gantt, Frappe Gantt, DHTMLX Gantt) and Roadmap/Dashboard/Bigboard, and
// between those and the charts - like the right sidebar's own hr-separated
// groups (client/components/sidebar/sidebar.jade).
const HR_AFTER = ['board-view-table', 'board-view-timeline', 'board-view-stats', 'board-view-group-by-assignee', 'board-view-gantt-dhtmlx', 'board-view-bigboard'];

// The menu is no longer 25 static entries in the jade: Board Settings / Board
// View (docs/Features/Board/Board-View-Settings.md) lets a board admin hide
// and REORDER the entries per board, so boardChangeViewPopup renders one
// `each boardViewMenuEntries` loop from the shared table in
// models/lib/boardViewSettings.js. The order, icon, label and separator pins
// below therefore read that table - the same thing the template reads - and
// the template is pinned to render every field of it.
const bvs = require('../models/lib/boardViewSettings.js');
const popup = boardHeaderJade.slice(boardHeaderJade.indexOf('template(name="boardChangeViewPopup")'),
  boardHeaderJade.indexOf('\n//- The Create Board form'));

test('the menu lists every view in the required top-to-bottom order', () => {
  // The DEFAULT order (no stored boardViewOrder) is the order this menu had
  // before views became orderable - the static template at commit 525bcab1b,
  // the parent of the Board Settings / Board View feature. VIEWS above is
  // that order; tests/boardViewSettings.test.cjs pins the model's literal
  // list and the separator positions against the same template.
  assert.deepStrictEqual(bvs.BOARD_VIEWS.map(v => v.view), VIEWS.map(v => v.view));
  assert.deepStrictEqual(bvs.DEFAULT_BOARD_VIEW_ORDER, VIEWS.map(v => v.view));
  // A board with no stored order renders exactly that, all of it.
  assert.deepStrictEqual(bvs.boardViewMenuEntries({ permission: 'private' }).map(e => e.view), VIEWS.map(v => v.view));
  assert.match(popup, /each boardViewMenuEntries\n\s*li\n\s*a\(class="\{\{jsClass\}\}"\)/, 'the template loops over the entries');
});

test('every entry carries a font-awesome icon', () => {
  VIEWS.forEach(v => {
    const entry = bvs.BOARD_VIEWS.find(e => e.view === v.view);
    assert.strictEqual(entry.icon, v.icon, `${v.view} uses ${v.icon}`);
    assert.strictEqual(bvs.boardViewJsClass(v.view), v.jsClass, `${v.view} opens via .${v.jsClass}`);
  });
  assert.match(popup, /i\.fa\(class="\{\{icon\}\}"\)/, 'the template renders the icon');
  assert.match(boardHeaderJs, /icon: `fa \$\{entry\.icon\}`/, 'as a fa class');
});

test('a chart view menu entry is no longer parenthesized as "not implemented yet"', () => {
  // These ten used to open a grey "not implemented yet" page and their menu
  // label was wrapped in literal parentheses to say so (#6690). Now each opens
  // a real chart (chartPlaceholderViews.jade + charts/boardCharts.js/.jade),
  // so the parentheses - which meant "coming soon" - would be actively wrong.
  assert.ok(popup.includes("| {{_ labelKey}}"), 'the menu label is the translated key, unwrapped');
  assert.ok(!popup.includes("({{_ labelKey}})"), 'and not parenthesized (negative)');
  VIEWS.filter(v => v.chart).forEach(v => {
    const entry = bvs.BOARD_VIEWS.find(e => e.view === v.view);
    assert.strictEqual(entry.labelKey, v.view, `${v.view}'s label key is its own view key`);
  });
});

test('a separator sits between Table and Calendar, between Timeline and Statistics, and between Gantt and Roadmap', () => {
  // Like the right sidebar's own hr-separated groups
  // (client/components/sidebar/sidebar.jade's homeSidebar).
  assert.deepStrictEqual(bvs.SEPARATOR_AFTER, HR_AFTER);
  const entries = bvs.boardViewMenuEntries({ permission: 'private' });
  entries.forEach(e => {
    assert.strictEqual(e.separatorAfter, HR_AFTER.includes(e.view), `separator after ${e.view}`);
  });
  assert.match(popup, /if separatorAfter\n\s*hr/, 'the template draws it');
  // A custom order has no groups, so no separators.
  const custom = bvs.boardViewMenuEntries({ permission: 'private', boardViewOrder: ['board-view-pulse'] });
  assert.ok(custom.every(e => !e.separatorAfter));
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
  // The PDF/Excel export moved into the one shared "Export" popup
  // (exportChart.js builds the URL for every chart view; see
  // tests/chartExportPopup.test.cjs).
  const exportChartJs = read('client/components/boards/charts/exportChart.js');
  assert.match(exportChartJs, /charts\/\$\{chartKey\}\/\$\{path\}/);
  assert.match(read('client/components/boards/charts/boardCharts.jade'), /js-export-chart\(href="#" data-chart-key="\{\{chartKey\}\}"\)/);
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
