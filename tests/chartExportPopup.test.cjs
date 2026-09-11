'use strict';

// Regression guard: reported directly - the Frappe Gantt view (and the
// DHTMLX Gantt, WeKan Gantt, Time and the ten report-chart views) each
// carried two untranslated "Export to PDF" / "Export to Excel" links, with
// five copies of the same URL-building helper behind them. They now share
// one translated "Export" button that opens one `exportChartPopup` - the
// same pop-over list of formats the board/swimlane/list/card export popup
// uses - with the URL built in exactly one place
// (client/components/boards/charts/exportChart.js).
//
// Also from the same report: Frappe Gantt's own chrome ("Today" button, the
// "Mode" placeholder, and the Day/Week/Month/... view-mode names) was
// English in every language. The view modes are now translated copies of
// Frappe's defaults; Today/Mode are re-translated by an observer.
//
// Source-read test, no Blaze/Meteor.
//
// Run: node tests/chartExportPopup.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const VIEWS = [
  ['client/components/gantt/frappeGantt.jade', 'gantt'],
  ['client/components/gantt/dhtmlxGantt.jade', 'gantt'],
  ['client/components/gantt/gantt.jade', 'gantt'],
  ['client/components/boards/timeView.jade', 'time'],
  ['client/components/boards/charts/boardCharts.jade', '{{chartKey}}'],
];

console.log('chartExportPopup:');

test('every chart view has ONE translated Export button that opens the shared popup', () => {
  for (const [rel, chartKey] of VIEWS) {
    const jade = read(rel);
    assert.ok(jade.includes(`a.chart-export-button.js-export-chart(href="#" data-chart-key="${chartKey}")`), rel);
    assert.ok(/js-export-chart[\s\S]{0,120}\{\{_ 'export'\}\}/.test(jade), `${rel} label is the translated "export"`);
    assert.ok(!/Export to (PDF|Excel)/.test(jade), `${rel} still has the untranslated links (negative)`);
  }
});

test('no view keeps its own copy of the export URL builder (negative)', () => {
  const files = [
    'client/components/gantt/frappeGantt.js', 'client/components/gantt/dhtmlxGantt.js',
    'client/components/gantt/gantt.js', 'client/components/boards/timeView.js',
    'client/components/boards/charts/boardCharts.js',
  ];
  for (const rel of files) {
    assert.ok(!/ExportUrl\(format\)|exportUrl\(format\)/.test(read(rel)), `${rel} still builds its own export URL`);
  }
  const shared = read('client/components/boards/charts/exportChart.js');
  assert.ok(/export function chartExportUrl\(chartKey, format\)/.test(shared));
  assert.ok(/\/api\/boards\/\$\{boardId\}\/charts\/\$\{chartKey\}\/\$\{path\}/.test(shared));
});

test('the popup offers PDF and Excel like the board export popup and is registered', () => {
  const jade = read('client/components/boards/charts/exportChart.jade');
  assert.ok(/template\(name="exportChartPopup"\)/.test(jade));
  assert.ok(/ul\.pop-over-list/.test(jade) && /a\(href="\{\{url\}\}" download\)/.test(jade));
  const js = read('client/components/boards/charts/exportChart.js');
  assert.ok(/fa-file-pdf-o.*label: 'PDF'/.test(js) && /fa-file-excel-o.*label: 'Excel'/.test(js));
  assert.ok(/Popup\.open\('exportChart'\)\.call\(\{ chartKey \}, evt\)/.test(js));
  assert.ok(read('client/features/boards.js').includes("import '/client/components/boards/charts/exportChart.js';"),
    'the component must be imported into the client bundle');
});

test('the popup has a title in every locale, taken from that locale\'s existing "export" translation', () => {
  const dir = path.join(ROOT, 'imports', 'i18n', 'data');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'))) {
    const json = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.strictEqual(json['exportChartPopup-title'], json.export, f);
  }
});

test('Frappe Gantt gets translated view modes and re-translates its Today/Mode chrome', () => {
  const js = read('client/components/gantt/frappeGantt.js');
  for (const key of ["'day'", "'week'", "'month'", "'gantt-view-hour'", "'gantt-view-quarter-day'", "'gantt-view-half-day'", "'gantt-view-year'"]) {
    assert.ok(js.includes(key), `view mode key ${key}`);
  }
  assert.ok(/view_modes: viewModes,\s*\n\s*view_mode: viewModes\.find\(mode => mode\._key === 'WEEK'\)\.name/.test(js));
  assert.ok(/TAPi18n\.__\('today'\)/.test(js) && /TAPi18n\.__\('gantt-view-mode'\)/.test(js));
  assert.ok(/new MutationObserver\(apply\)/.test(js) && /chromeObserver\.disconnect\(\)/.test(js));
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['gantt-view-hour', 'gantt-view-quarter-day', 'gantt-view-half-day', 'gantt-view-year', 'gantt-view-mode', 'today', 'day', 'week', 'month']) {
    assert.ok(typeof en[key] === 'string' && en[key], `en key ${key}`);
  }
});

console.log(`\nchartExportPopup: ${passed} tests passed`);
