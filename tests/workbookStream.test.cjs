'use strict';
// Teamwork's workbook written a page of cards at a time
// (server/lib/renderExternalExport.js STREAMED_WORKBOOKS): the pages come in
// the task tree's order planned over the whole board, each card's row at its
// depth, and ExcelJS's streaming writer makes a workbook that reads back as
// the whole one does.
// Run: node --test tests/workbookStream.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { PassThrough } = require('node:stream');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const items = [
  { cardId: 'a', title: 'Epic', listTitle: 'Build', startAt: '2026-11-01T00:00:00Z', labels: ['big'] },
  { cardId: 'b', title: 'Child', listTitle: 'Build', parentCardId: 'a', description: 'Under the epic' },
  { cardId: 'c', title: 'Other list child', listTitle: 'Test', parentCardId: 'a' },
  { cardId: 'd', title: 'Grandchild', listTitle: 'Build', parentCardId: 'b', dueAt: '2026-11-30T00:00:00Z' },
  { cardId: 'e', title: 'Loop one', listTitle: 'Build', parentCardId: 'f' },
  { cardId: 'f', title: 'Loop two', listTitle: 'Build', parentCardId: 'e' },
];
const light = items.map(item => ({ ...item, description: '' }));
const board = { title: 'Plant' };

let tw;
test.before(async () => { tw = await import('../models/lib/teamworkFormat.js'); });

function pagesOf(size) {
  const all = tw.teamworkPageOrder(light);
  const full = new Map(items.map(item => [item.cardId, item]));
  const pages = Math.max(1, Math.ceil(all.length / size));
  const out = [];
  for (let n = 0; n < pages; n += 1) {
    out.push(tw.formatTeamworkSheet({ board, items: all.slice(n * size, (n + 1) * size).map(item => full.get(item.cardId)),
      page: { all, offset: n * size, first: n === 0, last: n === pages - 1 } }));
  }
  return out;
}

test('the pages\' rows together are the whole sheet\'s, in the tree order, at their depths', () => {
  const whole = tw.formatTeamworkSheet({ board, items });
  for (const size of [1, 2, 4, 100]) {
    assert.deepStrictEqual(pagesOf(size).flatMap(page => page.rows), whole.rows, `${size} card(s) a page`);
  }
  const tasks = whole.rows.slice(1).map(row => row[1]);
  assert.deepStrictEqual(tasks, ['Epic', '-Child', '--Grandchild', 'Other list child', 'Loop one', '-Loop two'],
    'a sub-task of another task list is a task of its own; a parent loop is written, not lost');
  // Negative: a later page has no header.
  assert.notStrictEqual(pagesOf(1)[1].rows[0][0], 'Tasklist');
});

test('the streamed workbook reads back as the whole one', async () => {
  const { writeTeamworkWorkbook, streamTeamworkWorkbook, readTeamworkWorkbook } = require('../server/lib/teamworkWorkbook');
  const whole = await readTeamworkWorkbook((await writeTeamworkWorkbook(tw.formatTeamworkSheet({ board, items }))).toString('base64'));
  const sink = new PassThrough();
  const chunks = [];
  sink.on('data', chunk => chunks.push(chunk));
  async function* pages() { for (const page of pagesOf(2)) yield page; }
  await streamTeamworkWorkbook(sink, pages());
  await new Promise(resolve => setImmediate(resolve));
  const streamed = await readTeamworkWorkbook(Buffer.concat(chunks).toString('base64'));
  // The streaming writer leaves an empty cell out where the whole one writes
  // ''; both read as an empty cell.
  const norm = sheet => ({ name: sheet.name, rows: sheet.rows.map(row => {
    const cells = Array.from(row, value => (value === undefined || value === null ? '' : value));
    while (cells.length && cells[cells.length - 1] === '') cells.pop();
    return cells;
  }) });
  assert.deepStrictEqual(norm(streamed), norm(whole));
  // And Teamwork's own reading of the two is the same board.
  assert.deepStrictEqual(tw.parseTeamworkSheet(streamed), tw.parseTeamworkSheet(whole));
  // Negative: an empty board is still a workbook with its header.
  const emptyChunks = [];
  const emptySink = new PassThrough();
  emptySink.on('data', chunk => emptyChunks.push(chunk));
  async function* emptyPages() { yield tw.formatTeamworkSheet({ board, items: [], page: { all: [], offset: 0, first: true, last: true } }); }
  await streamTeamworkWorkbook(emptySink, emptyPages());
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual((await readTeamworkWorkbook(Buffer.concat(emptyChunks).toString('base64'))).rows[0][0], 'Tasklist');
});

test('the route streams it, with the order and the export boundary', () => {
  const render = read('server/lib/renderExternalExport.js');
  assert.match(render, /teamwork: \{\n\s+order: \(\) => require\('\/models\/lib\/teamworkFormat'\)\.teamworkPageOrder,/);
  assert.match(render, /yield secureTransfer\(formatters\[format\]\(collected\), context\);/);
  assert.match(render, /if \(STREAMED_WORKBOOKS\[format\]\) return streamWorkbookExport\(res, boardId, format, fields\);/);
  assert.match(read('models/lib/externalExporters.js'), /if \(options\.order\) all = options\.order\(all\);/);
});

test('Planner: the plan\'s head on the first page, each card\'s row after it, and the stream reads back the same', async () => {
  const planner = await import('../models/lib/plannerFormat.js');
  const now = new Date('2026-11-20T12:00:00Z');
  const whole = planner.formatPlannerRows({ board, items }, now);
  for (const size of [1, 2, 4, 100]) {
    const pages = Math.max(1, Math.ceil(items.length / size));
    const rows = [];
    for (let n = 0; n < pages; n += 1) {
      rows.push(...planner.formatPlannerRows({ board, items: items.slice(n * size, (n + 1) * size),
        page: { all: light, offset: n * size, first: n === 0, last: n === pages - 1 } }, now).rows);
    }
    assert.deepStrictEqual(rows, whole.rows, `${size} card(s) a page`);
  }
  const later = planner.formatPlannerRows({ board, items: [items[1]], page: { all: light, offset: 1, first: false, last: false } }, now);
  assert.strictEqual(later.rows.length, 1, 'negative: a later page has no head');
  const { writePlannerWorkbook, streamPlannerWorkbook, readPlannerWorkbook } = require('../server/lib/plannerWorkbook');
  const back = buffer => readPlannerWorkbook(buffer.toString('base64'));
  const norm = rows => rows.map(row => {
    const cells = Array.from(row, value => (value === undefined || value === null ? '' : value));
    while (cells.length && cells[cells.length - 1] === '') cells.pop();
    return cells;
  });
  const sink = new PassThrough();
  const chunks = [];
  sink.on('data', chunk => chunks.push(chunk));
  async function* pages() {
    yield planner.formatPlannerRows({ board, items: items.slice(0, 3), page: { all: light, offset: 0, first: true, last: false } }, now);
    yield planner.formatPlannerRows({ board, items: items.slice(3), page: { all: light, offset: 3, first: false, last: true } }, now);
  }
  await streamPlannerWorkbook(sink, pages());
  await new Promise(resolve => setImmediate(resolve));
  assert.deepStrictEqual(norm(await back(Buffer.concat(chunks))), norm(await back(await writePlannerWorkbook(whole))));
  assert.match(read('server/lib/renderExternalExport.js'), /planner: \{\n\s+order: \(\) => null,\n\s+write: \(\) => require\('\/server\/lib\/plannerWorkbook'\)\.streamPlannerWorkbook,/);
});

test('monday.com: the custom field columns over the whole board, and the stream reads back the same', async () => {
  const monday = await import('../models/lib/mondayFormat.js');
  const fielded = items.map((item, i) => ({ ...item, customFields: i === 4 ? { Cost: 7 } : {} }));
  const lightFielded = fielded.map(item => ({ ...item, description: '' }));
  const whole = monday.formatMondaySheets({ board, items: fielded });
  const rows = [];
  for (let n = 0; n < 3; n += 1) {
    rows.push(...monday.formatMondaySheets({ board, items: fielded.slice(n * 2, n * 2 + 2),
      page: { all: lightFielded, offset: n * 2, first: n === 0, last: n === 2 } }).sheets[0].rows);
  }
  assert.deepStrictEqual(rows, whole.sheets[0].rows);
  assert.ok(whole.sheets[0].rows[0].includes('Cost'), 'a column that only a later page\'s card has is in the header');
  const { writeMondayWorkbook, streamMondayWorkbook, readMondayWorkbook } = require('../server/lib/mondayWorkbook');
  const sink = new PassThrough();
  const chunks = [];
  sink.on('data', chunk => chunks.push(chunk));
  async function* pages() {
    for (let n = 0; n < 3; n += 1) {
      yield monday.formatMondaySheets({ board, items: fielded.slice(n * 2, n * 2 + 2), page: { all: lightFielded, offset: n * 2, first: n === 0, last: n === 2 } });
    }
  }
  await streamMondayWorkbook(sink, pages());
  await new Promise(resolve => setImmediate(resolve));
  // An empty cell is left out by the streaming writer and '' in the whole one.
  const norm = sheets => sheets.map(sheet => ({ ...sheet, rows: sheet.rows.map(row => {
    const cells = Array.from(row, value => (value === undefined || value === null ? '' : value));
    while (cells.length && cells[cells.length - 1] === '') cells.pop();
    return cells;
  }) }));
  const back = async buffer => norm(await readMondayWorkbook(buffer.toString('base64')));
  assert.deepStrictEqual(await back(Buffer.concat(chunks)), await back(await writeMondayWorkbook(whole)));
});

test('Businessmap: columns found over the whole board, a parent named from another page, the stream reads back the same', async () => {
  const bm = await import('../models/lib/businessmapFormat.js');
  const rich = items.map((item, i) => ({ ...item, customFields: { 'Card ID': 100 + i, ...(i === 5 ? { Track: 'Fast', Effort: 3 } : {}) },
    comments: i === 4 ? [{ text: 'One', author: 'ann' }, { text: 'Two', author: 'bob' }] : [] }));
  const lightRich = rich.map(item => ({ ...item, description: '', comments: item.comments.map(c => ({ ...c, text: '·' })) }));
  const whole = bm.formatBusinessmapSheets({ board, items: rich });
  const pageOf = n => bm.formatBusinessmapSheets({ board, items: rich.slice(n * 2, n * 2 + 2), page: { all: lightRich, offset: n * 2, first: n === 0, last: n === 2 } });
  assert.deepStrictEqual([0, 1, 2].flatMap(n => pageOf(n).sheets[0].rows), whole.sheets[0].rows);
  const header = whole.sheets[0].rows[0];
  assert.ok(header.includes('Track') && header.includes('Effort') && header.filter(h => h === 'Comment').length === 2,
    'what only the last page\'s cards have is a column from the first page on');
  const { writeBusinessmapWorkbook, streamBusinessmapWorkbook, readBusinessmapWorkbook } = require('../server/lib/businessmapWorkbook');
  const sink = new PassThrough();
  const chunks = [];
  sink.on('data', chunk => chunks.push(chunk));
  async function* pages() { for (const n of [0, 1, 2]) yield pageOf(n); }
  await streamBusinessmapWorkbook(sink, pages());
  await new Promise(resolve => setImmediate(resolve));
  const norm = sheets => sheets.map(sheet => ({ ...sheet, rows: sheet.rows.map(row => {
    const cells = Array.from(row, value => (value === undefined || value === null ? '' : value));
    while (cells.length && cells[cells.length - 1] === '') cells.pop();
    return cells;
  }) }));
  const back = async buffer => norm(await readBusinessmapWorkbook(buffer.toString('base64')));
  assert.deepStrictEqual(await back(Buffer.concat(chunks)), await back(await writeBusinessmapWorkbook(whole)));
  const render = read('server/lib/renderExternalExport.js');
  for (const format of ['teamwork', 'planner', 'monday', 'businessmap']) assert.match(render, new RegExp(`\\n  ${format}: \\{\\n\\s+order: `), `${format} is streamed`);
});

test('Wrike: the lanes\' folder rows before their first cards, every key the whole board\'s, the stream reads back the same', async () => {
  const wrike = await import('../models/lib/wrikeFormat.js');
  const laned = items.map((item, i) => ({ ...item, swimlaneTitle: ['Default', 'Ops', 'Default', 'Ops', 'Web', 'Default'][i],
    customFields: i === 5 ? { Cost: 9 } : {} }));
  const lightLaned = laned.map(item => ({ ...item, description: '' }));
  const all = wrike.wrikePageOrder(lightLaned);
  const full = new Map(laned.map(item => [item.cardId, item]));
  const whole = wrike.formatWrikeRows({ board, items: laned });
  for (const size of [1, 2, 4, 100]) {
    const pages = Math.max(1, Math.ceil(all.length / size));
    const rows = [];
    for (let n = 0; n < pages; n += 1) {
      rows.push(...wrike.formatWrikeRows({ board, items: all.slice(n * size, (n + 1) * size).map(item => full.get(item.cardId)),
        page: { all, offset: n * size, first: n === 0, last: n === pages - 1 } }).rows);
    }
    assert.deepStrictEqual(rows, whole.rows, `${size} card(s) a page`);
  }
  const titles = whole.rows.slice(1).map(row => row[whole.rows[0].indexOf('Title')]);
  assert.deepStrictEqual(titles, ['Epic', 'Other list child', 'Loop two', '/Ops/', 'Child', 'Grandchild', '/Web/', 'Loop one']);
  const { writeWrikeWorkbook, streamWrikeWorkbook, readWrikeWorkbook } = require('../server/lib/wrikeWorkbook');
  const sink = new PassThrough();
  const chunks = [];
  sink.on('data', chunk => chunks.push(chunk));
  async function* pages() {
    for (let n = 0; n < 3; n += 1) {
      yield wrike.formatWrikeRows({ board, items: all.slice(n * 2, n * 2 + 2).map(item => full.get(item.cardId)), page: { all, offset: n * 2, first: n === 0, last: n === 2 } });
    }
  }
  await streamWrikeWorkbook(sink, pages());
  await new Promise(resolve => setImmediate(resolve));
  const norm = rows => rows.map(row => {
    const cells = Array.from(row, value => (value === undefined || value === null ? '' : value instanceof Date ? value.toISOString() : value));
    while (cells.length && cells[cells.length - 1] === '') cells.pop();
    return cells;
  });
  const back = async buffer => norm(await readWrikeWorkbook(buffer.toString('base64')));
  assert.deepStrictEqual(await back(Buffer.concat(chunks)), await back(await writeWrikeWorkbook(whole)));
});
