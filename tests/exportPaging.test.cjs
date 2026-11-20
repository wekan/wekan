'use strict';
// The exports whose rows refer to other cards are written a page of cards at
// a time (server/lib/renderExternalExport.js PAGED), each page with the
// board's light references (models/lib/exportPaging.js). Whatever the page
// size, the pages together must be byte for byte the file the whole board is
// written as - parents, numbers, counted columns, sections and all.
// Run: node --test tests/exportPaging.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

// A board with what the formats refer to: parents, dependencies, comments,
// checklists, custom fields (Redmine's columns), labels and people (Pivotal's
// and Quire's columns), lists in an order Todoist groups by.
const lists = [{ title: 'To Do' }, { title: 'Doing' }, { title: 'Done' }];
const items = [
  { cardId: 'a', title: 'Epic', listTitle: 'To Do', swimlaneTitle: 'Default', description: 'The big one', labels: ['p1', 'feature'],
    owner: 'ann', assignees: ['bob', 'cid'], createdAt: '2026-11-01T10:00:00.000Z', dueAt: '2026-11-30T00:00:00.000Z',
    comments: [{ text: 'Start', author: 'ann', date: '2026-11-02T10:00:00.000Z' }, { text: 'Go', author: 'bob' }],
    checklists: [{ title: 'Steps', items: [{ title: 'One', done: false }, { title: 'Two', done: true }] }],
    customFields: { Priority: 'High', Estimate: 3, Story: 'x' } },
  { cardId: 'b', title: 'Child', listTitle: 'Doing', parentCardId: 'a', labels: ['bug'], owner: 'bob',
    dependencies: [{ cardId: 'a', type: 'blocks' }], createdAt: '2026-11-03T10:00:00.000Z', customFields: { Sprint: '7' } },
  { cardId: 'c', title: 'Second in To Do', listTitle: 'To Do', description: 'Line\nbreak, comma', labels: [],
    comments: [{ text: 'Only one', author: 'cid' }], createdAt: '2026-11-04T10:00:00.000Z' },
  { cardId: 'd', title: 'Finished', listTitle: 'Done', endAt: '2026-11-10T00:00:00.000Z', parentCardId: 'b', labels: ['chore', 'won\'t do'] },
  { cardId: 'e', title: 'Grandchild', listTitle: 'Doing', parentCardId: 'd', checklists: [{ title: 'Check', items: [{ title: 'Z', done: false }] }] },
  { cardId: 'f', title: 'Last', listTitle: 'To Do', owner: 'dan', assignees: ['eve', 'fay', 'gus'], customFields: { Extra: 'yes' } },
];
const board = { title: 'Plant' };
// What the first pass reads: no description, each comment only counted.
const light = items.map(item => ({ ...item, description: '',
  ...(item.comments ? { comments: item.comments.map(c => ({ ...c, text: '·' })) } : {}) }));

let fmt;
let paging;
test.before(async () => {
  fmt = (await import('../models/lib/externalExportFormatters.js')).formatters;
  paging = await import('../models/lib/exportPaging.js');
});

const PAGED = ['todotxt', 'taskwarrior', 'meistertask', 'linear', 'ticktick', 'clickup', 'pivotal', 'redmine', 'quire', 'todoist', 'notion', 'mattermost'];

function paged(format, size) {
  const byList = format === 'todoist';
  const all = byList ? paging.byFirstListOrder(light, item => item.listTitle || '') : light;
  const order = all.map(item => item.cardId);
  const full = new Map(items.map(item => [item.cardId, item]));
  const pages = Math.max(1, Math.ceil(order.length / size));
  let out = '';
  for (let n = 0; n < pages; n += 1) {
    const pageItems = order.slice(n * size, (n + 1) * size).map(id => full.get(id));
    out += fmt[format]({ board, lists, items: pageItems, page: { all, offset: n * size, first: n === 0, last: n === pages - 1 } });
  }
  return out;
}

test('every paged format: the pages together are the whole file, whatever the page size', () => {
  for (const format of PAGED) {
    const whole = fmt[format]({ board, lists, items });
    for (const size of [1, 2, 3, 4, 100]) assert.strictEqual(paged(format, size), whole, `${format}, ${size} card(s) a page`);
  }
});

test('an empty board is one page with the head and the tail', () => {
  for (const format of PAGED) {
    const whole = fmt[format]({ board, lists, items: [] });
    assert.strictEqual(fmt[format]({ board, lists, items: [], page: { all: [], offset: 0, first: true, last: true } }), whole, format);
  }
  assert.strictEqual(fmt.taskwarrior({ items: [] }), '[]\n');
});

test('negative: a later page has no head, and references point across pages', () => {
  const second = fmt.ticktick({ board, lists, items: [items[1]], page: { all: light, offset: 1, first: false, last: false } });
  assert.doesNotMatch(second, /Version: 7\.2/, 'no TickTick head on a later page');
  assert.match(second, /"1"/, 'the child points at its parent\'s number, 1, from the other page');
  const redmine = fmt.redmine({ items: [items[5]], page: { all: light, offset: 5, first: false, last: true } });
  assert.ok(!redmine.startsWith('\uFEFF'), 'the byte order mark is on the first page only');
  // Pivotal's columns are counted over the board: a page of a card with no comments still has both comment columns.
  const pivotal = fmt.pivotal({ items: [items[3]], page: { all: light, offset: 0, first: true, last: false } });
  assert.strictEqual((pivotal.split('\r\n')[0].match(/Comment/g) || []).length, 2);
  assert.strictEqual(paging.pagingOf({ items }).all, paging.pagingOf({ items }).items, 'without a page, the whole board is its own reference');
});

test('the export route streams these formats with the light first pass', () => {
  const render = read('server/lib/renderExternalExport.js');
  for (const format of PAGED) assert.match(render, new RegExp(`\\b${format}: \\{`), `${format} is paged`);
  assert.match(render, /todoist: \{ byList: true \}/);
  const exporters = read('models/lib/externalExporters.js');
  assert.match(exporters, /const light = await collect\(boardId, fields, format, null, true\);\n\s+all = secureTransfer\(light\.items, context\);/,
    'the references pass through the export boundary too');
  assert.match(exporters, /yield \{ \.\.\.collected, \.\.\.safeParts\(collected\), items,/,
    'and every page\'s board, list and swimlane titles, as the whole export\'s');
  assert.match(exporters, /description: light \? '' : c\.description \|\| ''/);
  assert.match(exporters, /fields: \{ cardId: 1, userId: 1, createdAt: 1 \}/, 'no comment text is read in the first pass');
});

// The outlines group the cards under their lists, in the board's list order
// (byList: 'lists'): a list's heading opens before its first card and closes
// after its last, a list with no cards stands where it is, between the cards
// of the lists around it, and a card names a list the board does not have.
const OUTLINES = ['markdown', 'opml', 'orgmode', 'obsidian', 'leo'];
const outlineLists = [{ title: 'Ideas' }, { title: 'To Do' }, { title: 'Review' }, { title: 'Doing' }, { title: 'Done' }, { title: 'Later' }];
const outlineItems = [...items, { cardId: 'g', title: 'Stray', listTitle: 'Elsewhere', description: 'Not on the board' }];

function pagedOutline(format, size) {
  const lightAll = outlineItems.map(item => ({ ...item, description: '' }));
  const all = paging.byListOrder(lightAll, paging.listTitlesOf(outlineLists, lightAll));
  const full = new Map(outlineItems.map(item => [item.cardId, item]));
  const pages = Math.max(1, Math.ceil(all.length / size));
  let out = '';
  for (let n = 0; n < pages; n += 1) {
    const pageItems = all.slice(n * size, (n + 1) * size).map(item => full.get(item.cardId));
    out += fmt[format]({ board, lists: outlineLists, items: pageItems, page: { all, offset: n * size, first: n === 0, last: n === pages - 1 } });
  }
  return out;
}

test('every outline: the pages together are the whole file, list headings and empty lists included', () => {
  for (const format of OUTLINES) {
    const whole = fmt[format]({ board, lists: outlineLists, items: outlineItems });
    for (const size of [1, 2, 3, 5, 100]) assert.strictEqual(pagedOutline(format, size), whole, `${format}, ${size} card(s) a page`);
  }
  // The whole file still groups the cards by list, whatever order they came in.
  const md = fmt.markdown({ board, lists: outlineLists, items: [...outlineItems].reverse() });
  assert.ok(md.indexOf('## To Do') < md.indexOf('## Doing') && md.indexOf('## Doing') < md.indexOf('## Done'));
  assert.doesNotMatch(md, /## Ideas|## Review|## Later|Stray/, 'Markdown leaves out empty lists and a card of no list, as before');
  const opml = fmt.opml({ board, lists: outlineLists, items: outlineItems });
  assert.match(opml, /<outline text="Ideas"\/>[\s\S]*<outline text="To Do">[\s\S]*<outline text="Review"\/>[\s\S]*<outline text="Later"\/>[\s\S]*<outline text="Elsewhere">/,
    'OPML keeps every list in its place, and a list only a card names after them');
  const obsidian = fmt.obsidian({ board, lists: outlineLists, items: outlineItems });
  assert.match(obsidian, /## Ideas\n\n\n\n\n## To Do\n\n/, 'an Obsidian lane with no cards keeps its place and its blank lines');
  // Leo: the outline first, each card's text after it under the card's node
  // number - the same number whichever page the card is on.
  const leo = fmt.leo({ board, lists: outlineLists, items: outlineItems });
  const gnx = /<v t="(wekan\.1\.\d+)"><vh>Second in To Do<\/vh>/.exec(leo)[1];
  assert.ok(leo.includes(`<t tx="${gnx}">Line\nbreak, comma</t>`));
  assert.ok(leo.indexOf('</vnodes>') < leo.indexOf('<t tx='), 'the texts come after the whole outline');
  const org = fmt.orgmode({ board, lists: outlineLists, items: outlineItems });
  assert.match(org, /\* Ideas\n\* To Do\n/, 'an empty list heading stands before the next list\'s');
  assert.match(org, /\* Later\n\* Elsewhere\n/);
});

test('negative: an empty board is one page of headings, and the route streams the outlines list by list', () => {
  for (const format of OUTLINES) {
    const whole = fmt[format]({ board, lists: outlineLists, items: [] });
    assert.strictEqual(fmt[format]({ board, lists: outlineLists, items: [], page: { all: [], offset: 0, first: true, last: true } }), whole, format);
  }
  const render = read('server/lib/renderExternalExport.js');
  for (const format of OUTLINES) assert.match(render, new RegExp(`\\b${format}: \\{ byList: 'lists' \\}`), `${format} is paged list by list`);
});

test('Focalboard: the board\'s options from the whole board on the first page, each card\'s blocks after', async () => {
  const { formatFocalboard } = await import('../models/lib/focalboardFormat.js');
  const at = { now: Date.UTC(2026, 10, 20) };
  const whole = formatFocalboard({ board, lists, items }, at);
  const all = light;
  for (const size of [1, 2, 4, 100]) {
    const pages = Math.max(1, Math.ceil(items.length / size));
    let out = '';
    for (let n = 0; n < pages; n += 1) {
      out += formatFocalboard({ board, lists, items: items.slice(n * size, (n + 1) * size),
        page: { all, offset: n * size, first: n === 0, last: n === pages - 1 } }, at);
    }
    assert.strictEqual(out, whole, `${size} card(s) a page`);
  }
  // Negative: a later page has no head.
  const later = formatFocalboard({ board, lists, items: [items[1]], page: { all, offset: 1, first: false, last: false } }, at);
  assert.doesNotMatch(later, /"type":"board"|"version":1/);
  assert.match(read('server/lib/renderExternalExport.js'), /focalboard: \{\}, mattermost: \{\},/);
});
