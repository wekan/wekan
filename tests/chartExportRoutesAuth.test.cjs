'use strict';

// The chart PDF/Excel export routes (models/exportCharts.js) exist and follow
// the same auth pattern as every other export route in this codebase - safe
// against unhandled rejections (safeRoute) and gated on board visibility, not
// left open just because they are new. See models/export.js's exportZip route
// for the pattern this pins.
//
// Run: node tests/chartExportRoutesAuth.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('chartExportRoutesAuth:');

const routes = read('models/exportCharts.js');

test('both chart export routes are registered', () => {
  assert.match(routes, /\/api\/boards\/:boardId\/charts\/:chartKey\/exportPDF/);
  assert.match(routes, /\/api\/boards\/:boardId\/charts\/:chartKey\/exportExcel/);
});

test('both routes are wrapped in safeRoute', () => {
  const pdfRoute = routes.split("'/api/boards/:boardId/charts/:chartKey/exportPDF'")[1].slice(0, 40);
  const excelRoute = routes.split("'/api/boards/:boardId/charts/:chartKey/exportExcel'")[1].slice(0, 40);
  assert.match(pdfRoute, /safeRoute\(/);
  assert.match(excelRoute, /safeRoute\(/);
});

test('an unlisted chartKey is rejected before any board data is loaded', () => {
  assert.match(routes, /CHART_KEYS\.has\(req\.params\.chartKey\)/g);
});

test('access is gated on board visibility (canExport -> isVisibleBy) and denial is logged', () => {
  assert.match(routes, /exporter\.canExport\(user\)/);
  assert.match(routes, /logExportDenied\(\)/);
});

test('a private board without a valid authToken still requires a logged-in user', () => {
  assert.match(routes, /Authentication\.checkLoggedIn\(req\.userId\)/);
});

const pdfExporter = read('models/server/ExporterChartPDF.js');
const excelExporter = read('models/server/ExporterChartExcel.js');

test('ExporterChartPDF.canExport checks board.isVisibleBy', () => {
  assert.match(pdfExporter, /board\.isVisibleBy\(user\)/);
});

test('ExporterChartExcel.canExport checks board.isVisibleBy', () => {
  assert.match(excelExporter, /board\.isVisibleBy\(user\)/);
});

test('the chart PDF exporter reuses the shared pdfDocument/buildUnicodePdf renderer', () => {
  assert.match(pdfExporter, /from '\/models\/lib\/pdfDocument'/);
  assert.match(pdfExporter, /buildUnicodePdf/);
});

test('the chart Excel exporter reuses the shared createWorkbook helper', () => {
  assert.match(excelExporter, /from '\.\/createWorkbook'/);
});

test('the new export module is loaded by the server bundle', () => {
  const imports = read('server/imports.js');
  assert.match(imports, /import '\/models\/exportCharts';/);
});

console.log(`chartExportRoutesAuth: ${passed} passed`);
