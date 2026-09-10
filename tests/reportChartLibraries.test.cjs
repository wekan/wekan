'use strict';

// Frappe Gantt and DHTMLX Gantt Community Edition (each a SEPARATE Board
// View menu entry/page, alongside WeKan's own hand-rolled Gantt view) and
// Chart.js (replacing the 10 board report charts' plain CSS bars) are all
// MIT-licensed, have a near-zero runtime dependency tree, and are loaded
// with a dynamic import() so their code only reaches the browser when the
// relevant view is actually opened - never bundled into every page load.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// License and dependency footprint.
const pkg = JSON.parse(read('package.json'));
const frappe_pkg = JSON.parse(read('node_modules/frappe-gantt/package.json'));
const dhtmlx_pkg = JSON.parse(read('node_modules/dhtmlx-gantt/package.json'));
const chartjs_pkg = JSON.parse(read('node_modules/chart.js/package.json'));
assert.ok(pkg.dependencies['frappe-gantt'], 'frappe-gantt must be a direct dependency');
assert.ok(pkg.dependencies['dhtmlx-gantt'], 'dhtmlx-gantt must be a direct dependency');
assert.ok(pkg.dependencies['chart.js'], 'chart.js must be a direct dependency');
assert.equal(frappe_pkg.license, 'MIT');
assert.equal(dhtmlx_pkg.license, 'MIT');
assert.equal(chartjs_pkg.license, 'MIT');
for (const license of [frappe_pkg.license, dhtmlx_pkg.license, chartjs_pkg.license]) {
  assert.doesNotMatch(license, /GPL/i);
}
// dhtmlx-gantt's npm "license" field claims MIT; verify the actual LICENSE.md
// text inside the installed package says the same thing, not just the field
// (a stale/wrong license field is exactly how #2870 rejected an earlier
// DHTMLX Gantt proposal for being GPL - the field alone is not proof).
const dhtmlxLicenseText = read('node_modules/dhtmlx-gantt/LICENSE.md');
assert.match(dhtmlxLicenseText, /The MIT License \(MIT\)/);
assert.doesNotMatch(dhtmlxLicenseText, /GNU GENERAL PUBLIC LICENSE/);
assert.deepEqual(frappe_pkg.dependencies || {}, {}, 'frappe-gantt must stay dependency-free');
assert.deepEqual(dhtmlx_pkg.dependencies || {}, {}, 'dhtmlx-gantt must stay dependency-free');
assert.deepEqual(Object.keys(chartjs_pkg.dependencies || {}), ['@kurkle/color']);
const color = JSON.parse(read('node_modules/@kurkle/color/package.json'));
assert.equal(color.license, 'MIT');

// Lazy loading: none of the three libraries may be statically imported at
// module top level, or its code ships on every page load regardless of
// whether the relevant view is ever opened.
const frappe = read('client/components/gantt/frappeGantt.js');
assert.match(frappe, /import\('frappe-gantt'\)/);
assert.doesNotMatch(frappe, /^import .*['"]frappe-gantt['"]/m,
  'a static top-level import would ship frappe-gantt\'s JavaScript on every page load');
// frappe-gantt's package.json "exports" map has no "./dist/frappe-gantt.css"
// subpath (only a "style" CONDITION on "."), so that CSS cannot be reached
// by a dynamic import() at all - rspack rejects the build outright when it
// is tried. It is vendored verbatim instead and loaded statically, same as
// gantt.css/ganttCard.css.
assert.match(frappe, /^import '\.\/frappeGanttLib\.css';/m);
const vendoredCss = read('client/components/gantt/frappeGanttLib.css');
assert.match(vendoredCss, /Vendored verbatim from frappe-gantt@/);
assert.match(vendoredCss, /\.gantt-container/, 'the vendored file must actually contain frappe-gantt\'s CSS');
assert.match(frappe, /let GanttLibPromise = null/);
assert.match(frappe, /if \(!GanttLibPromise\)/);

const dhtmlx = read('client/components/gantt/dhtmlxGantt.js');
assert.match(dhtmlx, /import\('dhtmlx-gantt'\)/);
assert.doesNotMatch(dhtmlx, /^import .*['"]dhtmlx-gantt['"]/m,
  'a static top-level import would ship dhtmlx-gantt\'s JavaScript on every page load');
// Unlike frappe-gantt, dhtmlx-gantt has no "exports" map at all (only "main"/
// "module"/"style" fields), so its CSS subpath resolves through plain file
// resolution and needs no vendoring - a static CSS import is fine and
// expected here (CSS is not the part worth lazy-loading; the JS is).
assert.match(dhtmlx, /^import 'dhtmlx-gantt\/codebase\/dhtmlxgantt\.css';/m);
assert.match(dhtmlx, /let GanttSingletonPromise = null/);
assert.match(dhtmlx, /if \(!GanttSingletonPromise\)/);

const charts = read('client/components/boards/charts/boardCharts.js');
assert.match(charts, /import\('chart\.js\/auto'\)/);
assert.doesNotMatch(charts, /^import .*['"]chart\.js/m,
  'a static top-level import would ship Chart.js on every page load');
assert.match(charts, /let ChartJsPromise = null/);
assert.match(charts, /if \(!ChartJsPromise\)/);

// A chart/gantt instance must be destroyed when its template is destroyed
// or rebuilt, not leaked - repeatedly opening/closing a view must not
// accumulate detached instances. dhtmlx-gantt is a page-wide SINGLETON
// (`gantt`, not a class instantiated per container), so it is torn down
// with destructor() rather than merely cleared.
assert.match(frappe, /Template\.frappeGanttView\.onDestroyed/);
assert.match(dhtmlx, /Template\.dhtmlxGanttView\.onDestroyed/);
assert.match(dhtmlx, /gantt\.destructor\(\)/);
assert.match(charts, /Template\.boardChartView\.onDestroyed/);
assert.match(charts, /chartJsInstance\.destroy\(\)/);

// WeKan's existing hand-rolled Gantt view is untouched; Frappe Gantt and
// DHTMLX Gantt are each a SEPARATE Board View menu entry and page (their own
// isView* helper + boardBody.jade branch, checked in full in
// tests/boardViewMenu.test.cjs), not embedded inside/below it.
const ganttJade = read('client/components/gantt/gantt.jade');
assert.match(ganttJade, /table\.gantt-table/, 'the original week-grid Gantt table must still render');
assert.doesNotMatch(ganttJade, /\+frappeGanttView|\+dhtmlxGanttView/,
  'Frappe/DHTMLX Gantt are their own Board View pages, not embedded in the original Gantt view (negative)');
const ganttJs = read('client/components/gantt/gantt.js');
assert.match(ganttJs, /Template\.ganttView\.helpers/, 'the original Gantt helpers are untouched');
const boardBodyJade = read('client/components/boards/boardBody.jade');
assert.match(boardBodyJade, /else if isViewGanttFrappe\s*\n\s*\+frappeGanttView/);
assert.match(boardBodyJade, /else if isViewGanttDhtmlx\s*\n\s*\+dhtmlxGanttView/);

// Both Gantt alternatives draw the same task set as the existing Gantt, so
// their export reuses the existing 'gantt' chart export route rather than
// adding a second, parallel export pipeline for identical data. Board
// report charts keep exporting through the same per-chartKey route as
// before.
assert.match(frappe, /\/api\/boards\/\$\{board\._id\}\/charts\/gantt\/\$\{path\}/);
assert.match(dhtmlx, /\/api\/boards\/\$\{board\._id\}\/charts\/gantt\/\$\{path\}/);
const exportRoutes = read('models/exportCharts.js');
assert.match(exportRoutes, /'gantt'/, 'the shared export route catalog must still include gantt');
assert.match(charts, /\/api\/boards\/\$\{boardId\}\/charts\/\$\{chartKey\}\/\$\{path\}/);
assert.match(charts, /chartExportRows/);

// Every jade/client-registration file this feature touches is wired into the
// central import lists tests/templateRegistration.test.cjs checks - a
// dynamic-import-only component still needs its .jade/.css reachable from
// client/features/*.js or it never compiles into a real template.
const ganttFeature = read('client/features/gantt.js');
for (const file of ['frappeGantt.jade', 'frappeGantt.js', 'frappeGantt.css',
  'dhtmlxGantt.jade', 'dhtmlxGantt.js', 'dhtmlxGantt.css']) {
  assert.ok(ganttFeature.includes(`'/client/components/gantt/${file}'`),
    `client/features/gantt.js imports ${file}`);
}

console.log('reportChartLibraries: Frappe Gantt / DHTMLX Gantt / Chart.js license, dependency and lazy-load coverage passed');
