'use strict';

// The Dashboard view's "By Assignee"/"By Label" bars grouped a card with no
// assignee/label under the literal English word "none" (models/lib/
// chartCalculations.js's computeDashboardGroups), untranslated in every
// language and shown on the live chart, the data table, and the PDF/Excel
// export alike. Two sentinel keys (NO_ASSIGNEE_GROUP/NO_LABEL_GROUP) plus a
// shared translateGroupLabel() replace it with a real, translated
// "No assignee"/"No label" everywhere that group label is rendered.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const {
  computeDashboardGroups,
  translateGroupLabel,
  NO_ASSIGNEE_GROUP,
  NO_LABEL_GROUP,
} = require('../models/lib/chartCalculations');

// --- pure logic: a card that resolves to no groups falls into the supplied
// emptyGroup, not a hardcoded "none" ---
{
  const cards = [{ _id: 'c1' }, { _id: 'c2' }];
  const groups = computeDashboardGroups(cards, () => [], NO_ASSIGNEE_GROUP);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].key, '__no_assignee__');
  assert.equal(groups[0].label, '__no_assignee__');
  assert.equal(groups[0].count, 2);
}

// Negative: the OLD default (no emptyGroup passed) still exists for any
// other caller, so this is an additive change, not a signature break.
{
  const groups = computeDashboardGroups([{ _id: 'c1' }], () => []);
  assert.equal(groups[0].key, 'none');
  assert.equal(groups[0].label, 'none');
}

// --- translateGroupLabel: the sentinel is translated; real user data (an
// actual assignee/label name) passes through unchanged ---
assert.equal(translateGroupLabel('__no_assignee__', (key, fallback) => fallback), 'No assignee');
assert.equal(translateGroupLabel('__no_label__', (key, fallback) => fallback), 'No label');
assert.equal(translateGroupLabel('__no_assignee__'), 'No assignee', 'works with no translate() at all');
assert.equal(translateGroupLabel('Alice', (key, fallback) => fallback), 'Alice', 'real user data is untouched (negative)');
assert.equal(translateGroupLabel('Bug', (key, fallback) => fallback), 'Bug', 'a real label name is untouched (negative)');

// --- wiring: every renderer of dashboard groups actually uses these, so the
// literal word "none" cannot reach the screen from any of the three places
// it used to (live chart, data table/export, and the server chart-data
// loader that feeds both) ---
const boardChartData = read('server/lib/boardChartData.js');
assert.match(boardChartData, /NO_ASSIGNEE_GROUP/);
assert.match(boardChartData, /NO_LABEL_GROUP/);
assert.match(boardChartData, /computeDashboardGroups\(allCards, card =>\s*\n\s*\(card\.assignees \|\| \[\]\)\.map\(id => \(\{ key: id, label: nameOf\(id\) \}\)\), NO_ASSIGNEE_GROUP\)/);
assert.match(boardChartData, /computeDashboardGroups\(allCards, card =>\s*\n\s*\(card\.labelIds \|\| \[\]\)\.map\(id => \(\{ key: id, label: labelById\[id\] \|\| id \}\)\), NO_LABEL_GROUP\)/);

const chartExportRows = read('models/lib/chartExportRows.js');
assert.match(chartExportRows, /translateGroupLabel\(group\.label, translate\)/,
  'the PDF/Excel/data-table export translates the group label');

const boardCharts = read('client/components/boards/charts/boardCharts.js');
assert.match(boardCharts, /translateGroupLabel\(row\.label, key => TAPi18n\.__\(key\)\)/,
  'the live bar chart translates the group label');

// --- the new i18n keys exist in English and every locale, in the same
// position (order) as English - the same completeness gate
// tests/allTranslationCompleteness.test.cjs enforces for every key ---
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
assert.equal(en['no-assignee'], 'No assignee');
assert.equal(en['no-label'], 'No label');

console.log('dashboardNoneGroupLabel: the "none" group label is now a real, translated string everywhere it is shown');
