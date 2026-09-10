'use strict';

// Frappe Gantt (added below WeKan's own Gantt view) and Chart.js (replacing
// the 10 board report charts' plain CSS bars) are both MIT-licensed, have
// near-zero runtime dependency trees, and are loaded with a dynamic import()
// so their code only reaches the browser when the relevant view is actually
// opened - never bundled into every initial page load.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// License and dependency footprint.
const pkg = JSON.parse(read('package.json'));
const gantt = JSON.parse(read('node_modules/frappe-gantt/package.json'));
const chartjs = JSON.parse(read('node_modules/chart.js/package.json'));
assert.ok(pkg.dependencies['frappe-gantt'], 'frappe-gantt must be a direct dependency');
assert.ok(pkg.dependencies['chart.js'], 'chart.js must be a direct dependency');
assert.equal(gantt.license, 'MIT');
assert.equal(chartjs.license, 'MIT');
assert.doesNotMatch(gantt.license, /GPL/i);
assert.doesNotMatch(chartjs.license, /GPL/i);
assert.deepEqual(gantt.dependencies || {}, {}, 'frappe-gantt must stay dependency-free');
assert.deepEqual(Object.keys(chartjs.dependencies || {}), ['@kurkle/color']);
const color = JSON.parse(read('node_modules/@kurkle/color/package.json'));
assert.equal(color.license, 'MIT');

// Lazy loading: neither library may be statically imported at module top
// level, or its code ships on every page load regardless of whether a Gantt
// or chart view is ever opened.
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

const charts = read('client/components/boards/charts/boardCharts.js');
assert.match(charts, /import\('chart\.js\/auto'\)/);
assert.doesNotMatch(charts, /^import .*['"]chart\.js/m,
  'a static top-level import would ship Chart.js on every page load');
assert.match(charts, /let ChartJsPromise = null/);
assert.match(charts, /if \(!ChartJsPromise\)/);

// A chart instance must be destroyed when its template is destroyed or
// rebuilt, not leaked - repeatedly opening/closing the Gantt or a chart view
// must not accumulate detached Chart.js/Frappe Gantt instances.
assert.match(frappe, /onDestroyed/);
assert.match(charts, /Template\.boardChartView\.onDestroyed/);
assert.match(charts, /chartJsInstance\.destroy\(\)/);

// WeKan's existing hand-rolled Gantt view is kept as-is; Frappe Gantt is
// added below it, not instead of it.
const ganttJade = read('client/components/gantt/gantt.jade');
assert.match(ganttJade, /table\.gantt-table/, 'the original week-grid Gantt table must still render');
assert.match(ganttJade, /\+frappeGanttView/, 'Frappe Gantt must be included in the same view');
const ganttJs = read('client/components/gantt/gantt.js');
assert.match(ganttJs, /Template\.ganttView\.helpers/, 'the original Gantt helpers are untouched');

// Frappe Gantt draws the same task set as the existing Gantt, so its export
// reuses the existing 'gantt' chart export route rather than adding a
// second, parallel export pipeline for identical data. Board report charts
// keep exporting through the same per-chartKey route as before.
assert.match(frappe, /\/api\/boards\/\$\{board\._id\}\/charts\/gantt\/\$\{path\}/);
const exportRoutes = read('models/exportCharts.js');
assert.match(exportRoutes, /'gantt'/, 'the shared export route catalog must still include gantt');
assert.match(charts, /\/api\/boards\/\$\{boardId\}\/charts\/\$\{chartKey\}\/\$\{path\}/);
assert.match(charts, /chartExportRows/);

// Every jade/client-registration file this feature touches is wired into the
// central import lists tests/templateRegistration.test.cjs checks - a
// dynamic-import-only component still needs its .jade/.css reachable from
// client/features/*.js or it never compiles into a real template.
const ganttFeature = read('client/features/gantt.js');
assert.match(ganttFeature, /'\/client\/components\/gantt\/frappeGantt\.jade'/);
assert.match(ganttFeature, /'\/client\/components\/gantt\/frappeGantt\.js'/);
assert.match(ganttFeature, /'\/client\/components\/gantt\/frappeGantt\.css'/);

console.log('reportChartLibraries: Frappe Gantt / Chart.js license, dependency and lazy-load coverage passed');
