'use strict';

// #812 ("Add feature: Timesheet / Time Tracking"): the community discussion
// (39 comments) repeatedly asked for external integrations (Kimai, Harvest,
// Titra) that were never resourced (the maintainer's own 2021 comment quoted
// a ~1000 EUR / 4-month estimate for a Kimai sync and it was shelved). What
// the thread DID converge on that fits inside WeKan itself, without an
// external service: "reporting total hours by resource and task type"
// (the issue's own words) and export "like other chart views" - this file
// pins exactly those two additions to the Time board view.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// --- 'time' is a real, exportable chartKey, alongside every other board
// report chart - not a second, parallel export pipeline just for Time.
const exportCharts = read('models/exportCharts.js');
// Match 'time' anywhere inside the Set literal - not necessarily last, since
// later chart keys (e.g. 'pulse') are appended after it.
assert.match(exportCharts, /const CHART_KEYS = new Set\(\[[\s\S]*?'time'[\s\S]*?\]\);/);

// --- server/lib/boardChartData.js answers 'time' with an assignee
// breakdown (hours, not card counts) and a per-card breakdown, scoped to
// non-archived cards (matching the existing Time summary's own scope).
const boardChartData = read('server/lib/boardChartData.js');
assert.match(boardChartData, /chartKey === 'time'/);
assert.match(boardChartData, /computeTimeByGroup\(activeCards, card =>/);
assert.match(boardChartData, /computeTimeByCard\(activeCards\)/);
assert.match(boardChartData, /const activeCards = allCards\.filter\(card => !card\.archived\);/);
assert.match(boardChartData, /NO_ASSIGNEE_GROUP/, 'the empty-assignee bucket is the real translated sentinel, not a hardcoded "none"');

// --- models/lib/chartExportRows.js turns that into the same
// {title, headers, rows} table shape the PDF/Excel exporters already share
// with every other chart, and gives it a real title.
const chartExportRows = read('models/lib/chartExportRows.js');
assert.match(chartExportRows, /time: \['board-view-time', 'Time'\]/);
assert.match(chartExportRows, /chartKey === 'time'/);
assert.match(chartExportRows, /translateGroupLabel\(group\.label, translate\)/);

// --- the live Time view calls the SAME boardChartData method (chartKey
// 'time') as every chart view, and offers PDF/Excel export through the SAME
// /api/boards/:boardId/charts/:chartKey/export* routes - "like other chart
// views", not a bespoke Time-only export.
const timeViewJs = read('client/components/boards/timeView.js');
assert.match(timeViewJs, /Meteor\.call\('boardChartData', boardId, 'time'/);
assert.match(timeViewJs, /timeExportUrl\(format\)/);
assert.match(timeViewJs, /\/api\/boards\/\$\{boardId\}\/charts\/time\/\$\{path\}/);

const timeViewJade = read('client/components/boards/timeView.jade');
assert.match(timeViewJade, /a\.chart-export-button\(href="\{\{ timeExportUrl 'PDF' \}\}"/);
assert.match(timeViewJade, /a\.chart-export-button\(href="\{\{ timeExportUrl 'Excel' \}\}"/);
// Negative: the original 3-row summary is kept exactly as it was (this is
// additive - #812's asks are new sections alongside it, not a replacement).
assert.match(timeViewJade, /\{\{_ 'board-status-time-spent-total'\}\}/);
assert.match(timeViewJade, /\{\{_ 'board-status-cards-with-time'\}\}/);
assert.match(timeViewJade, /\{\{_ 'board-status-overtime-cards'\}\}/);

console.log('timeViewReportAndExport: Time view now reports hours by assignee/card and exports like every other chart view');
