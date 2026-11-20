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

// The JSON documents whose cards are one array (server/lib/renderExternalExport.js
// JSON_PAGED): the first page's document around the array is the whole
// document's, and the pages' arrays together are the whole array.
const JSON_FORMATS = { jira: ['issues'], asana: ['data'], zenkit: ['items'],
  openproject: ['_embedded', 'elements'], github: [], gitea: [], forgejo: [], gitlab: [] };
const at = (doc, path) => path.reduce((node, key) => (node ? node[key] : undefined), doc);
const without = (doc, path) => {
  if (!path.length) return null;
  const copy = JSON.parse(JSON.stringify(doc));
  let node = copy;
  path.slice(0, -1).forEach(key => { node = node[key]; });
  delete node[path[path.length - 1]];
  return copy;
};
const jsonItems = items.map(item => ({ ...item, labels: item.labels || [], labelIds: [], listId: 'l', comments: item.comments || [],
  scrum: { backlogRank: item.cardId.charCodeAt(0) } }));
const jsonLight = jsonItems.map(item => ({ ...item, description: '', comments: item.comments.map(c => ({ ...c, text: '·' })) }));

test('every JSON document: the pages\' card arrays together are the whole array, the rest is the first page\'s', () => {
  const lists2 = lists.map((l, i) => ({ ...l, _id: `l${i}` }));
  const board2 = { ...board, labels: [] };
  for (const [format, path] of Object.entries(JSON_FORMATS)) {
    const whole = JSON.parse(JSON.stringify(fmt[format]({ board: board2, lists: lists2, items: jsonItems })));
    for (const size of [1, 2, 4, 100]) {
      const pages = Math.max(1, Math.ceil(jsonItems.length / size));
      let cards = [];
      let first = null;
      for (let n = 0; n < pages; n += 1) {
        const doc = JSON.parse(JSON.stringify(fmt[format]({ board: board2, lists: lists2, items: jsonItems.slice(n * size, (n + 1) * size),
          page: { all: jsonLight, offset: n * size, first: n === 0, last: n === pages - 1 } })));
        if (n === 0) first = doc;
        cards = cards.concat(at(doc, path) || []);
      }
      assert.deepStrictEqual(cards, at(whole, path), `${format}, ${size} card(s) a page: the cards`);
      assert.deepStrictEqual(without(first, path), without(whole, path), `${format}, ${size}: the document around them`);
    }
  }
  // Trello's three arrays - cards, checklists, comment actions - each the
  // pages' together, and the document around them the first page's.
  const multi = { trello: [['cards'], ['checklists'], ['actions']] };
  for (const [format, paths] of Object.entries(multi)) {
    const whole = JSON.parse(JSON.stringify(fmt[format]({ board: board2, lists: lists2, items: jsonItems })));
    for (const size of [1, 2, 4, 100]) {
      const pages = Math.max(1, Math.ceil(jsonItems.length / size));
      for (const path of paths) {
        let elements = [];
        for (let n = 0; n < pages; n += 1) {
          elements = elements.concat(at(JSON.parse(JSON.stringify(fmt[format]({ board: board2, lists: lists2, items: jsonItems.slice(n * size, (n + 1) * size),
            page: { all: jsonLight, offset: n * size, first: n === 0, last: n === pages - 1 } }))), path) || []);
        }
        assert.deepStrictEqual(elements, at(whole, path), `${format} ${path.join('.')}, ${size} card(s) a page`);
      }
    }
    // As the writer makes it: no cards, the board's light first pass (its members).
    const empty = JSON.parse(JSON.stringify(fmt[format]({ board: board2, lists: lists2, items: [],
      page: { all: jsonLight, offset: 0, first: true, last: true } })));
    paths.forEach(path => { delete empty[path[0]]; delete whole[path[0]]; });
    assert.deepStrictEqual(empty, whole, `${format}: the document around the arrays`);
  }
  // The references across pages: a Jira child names its parent's key from the other page.
  const second = fmt.jira({ board: board2, items: [jsonItems[1]], page: { all: jsonLight, offset: 1, first: false, last: false } });
  assert.strictEqual(second.issues[0].key, 'WEKAN-2');
  assert.strictEqual(second.issues[0].fields.parent.key, 'WEKAN-1');
});

test('negative: no part of a paged JSON document skips the export boundary or the field redaction', () => {
  const render = read('server/lib/renderExternalExport.js');
  for (const format of Object.keys(JSON_FORMATS)) assert.match(render, new RegExp(`\\b${format}: \\{ path: `), `${format} is paged`);
  assert.match(render, /trello: \{ paths: \[\['cards'\], \['checklists'\], \['actions'\]\] \}/, 'Trello\'s three arrays, each a pass');
  assert.match(render, /const checked = secureTransfer\(value, context\);\n\s+return containsFields\(checked\) \? require\('\/server\/lib\/adminOnlyCustomFields'\)\.redactFields\(checked, userId\) : checked;/);
  assert.match(render, /JSON\.stringify\(await safe\(card\)\)/, 'and every card');
  // What is written: every card through safe(); every other text is a piece
  // of a JSON text made by around(), which is safe() too - no write of a JSON
  // text made from anything else.
  const writer = render.slice(render.indexOf('async function streamJsonArrays'), render.indexOf('async function streamExternalExport'));
  const stringified = [...writer.matchAll(/JSON\.stringify\(([^()]*(?:\([^()]*\))?[^()]*)\)/g)].map(m => m[1]);
  for (const arg of stringified) {
    assert.ok(/^await safe\(/.test(arg) || ['ARRAY_PLACE', 'mark'].includes(arg) || /^(list|empty|doc|formatters\[format\]\(\{ \.\.\.collected, items: \[\] \}\))$/.test(arg),
      `JSON.stringify(${arg}) is safe(), the placeholder, or a copy that is not written`);
  }
  assert.match(writer, /const text = JSON\.stringify\(await safe\(value\)\);/, 'around() checks what it splits');
  assert.doesNotMatch(writer, /write\([^)]*JSON\.parse/, 'no copy is written');
  assert.match(render, /if \(JSON_PAGED\[format\]\) return streamJsonExport\(res, boardId, format, fields\);/);
});

// Deck's stacks and Kanri's columns hold their cards: the pages come list by
// list (byListIdOrder), and each list's cards across the pages are its cards
// in the whole document; the lists are the document's own on every page.
test('nested JSON documents: each list\'s cards across the pages are its cards in the whole document', async () => {
  const { formatKanri } = await import('../models/lib/kanriFormat.js');
  const nestedLists = [{ _id: 'la', title: 'To Do' }, { _id: 'lb', title: 'Doing' }, { _id: 'lc', title: 'Done' }, { _id: 'ld', title: 'To Do' }];
  const listIdOf = { 'To Do': 'la', Doing: 'lb', Done: 'lc' };
  const nestedItems = jsonItems.map(item => ({ ...item, listId: listIdOf[item.listTitle] }))
    .concat([{ cardId: 'h', title: 'Archived list', listTitle: 'Old', listId: 'gone', labels: [], comments: [] },
      { cardId: 'i', title: 'No list', listTitle: '', listId: '', labels: [], comments: [] },
      { cardId: 'j', title: 'No list either', listTitle: '', listId: '', labels: [], comments: [] }]);
  const nestedLight = nestedItems.map(item => ({ ...item, description: '' }));
  const now = new Date('2026-11-20T00:00:00Z');
  const formats = { deck: c => fmt.deck(c), kanri: c => formatKanri(c, now), nullboard: c => JSON.parse(fmt.nullboard(c)) };
  const listsOf = { deck: doc => doc.stacks, kanri: doc => doc.columns, nullboard: doc => doc.lists };
  const cardsKey = { deck: 'cards', kanri: 'cards', nullboard: 'notes' };
  const unknownBy = { deck: undefined, kanri: undefined, nullboard: item => String(item.listTitle || 'List') };
  for (const [format, run] of Object.entries(formats)) {
    const whole = JSON.parse(JSON.stringify(run({ board, lists: nestedLists, items: nestedItems })));
    const all = paging.byListIdOrder(nestedLight, nestedLists.map(l => l._id), unknownBy[format]);
    const full = new Map(nestedItems.map(item => [item.cardId, item]));
    for (const size of [1, 2, 3, 100]) {
      const pages = Math.max(1, Math.ceil(all.length / size));
      const perList = listsOf[format](whole).map(() => []);
      for (let n = 0; n < pages; n += 1) {
        const pageItems = all.slice(n * size, (n + 1) * size).map(item => full.get(item.cardId));
        const doc = JSON.parse(JSON.stringify(run({ board, lists: nestedLists, items: pageItems,
          page: { all, offset: n * size, first: n === 0, last: n === pages - 1 } })));
        assert.strictEqual(listsOf[format](doc).length, perList.length, `${format}: the same lists on every page`);
        listsOf[format](doc).forEach((list, i) => perList[i].push(...list[cardsKey[format]]));
      }
      assert.deepStrictEqual(perList, listsOf[format](whole).map(list => list[cardsKey[format]]), `${format}, ${size} card(s) a page`);
      const empty = JSON.parse(JSON.stringify(run({ board, lists: nestedLists, items: [], page: { all, offset: 0, first: true, last: true } })));
      const listsKey = { deck: 'stacks', kanri: 'columns', nullboard: 'lists' }[format];
      const shell = doc => ({ ...doc, id: 0, [listsKey]: listsOf[format](doc).map(l => ({ ...l, [cardsKey[format]]: [] })) });
      assert.deepStrictEqual(shell(empty), shell(whole), `${format}: the document around the cards`);
    }
  }
  // Negative: two lists of one name keep their own cards, and the cards of no list are one column.
  const deck = fmt.deck({ board, lists: nestedLists, items: nestedItems });
  assert.strictEqual(deck.stacks[3].cards.length, 0, 'the second "To Do" has none of the first one\'s cards');
  const kanri = formatKanri({ board, lists: nestedLists, items: nestedItems }, now);
  assert.strictEqual(kanri.columns.filter(c => c.id === 'no-list').length, 1);
  assert.strictEqual(kanri.columns.find(c => c.id === 'no-list').cards.length, 2);
  assert.match(read('server/lib/renderExternalExport.js'), /deck: \{ path: \['stacks'\], nested: 'cards', byList: 'listIds' \}/);
  assert.match(read('server/lib/renderExternalExport.js'), /nullboard: \{ path: \['lists'\], nested: 'notes', byList: 'listIdsThenTitles', text: true \}/);
  // Nullboard: the cards of a list that is not exported are one list of its title, on every page.
  const nb = JSON.parse(fmt.nullboard({ board, lists: nestedLists, items: nestedItems }));
  assert.deepStrictEqual(nb.lists.map(l => l.title), ['To Do', 'Doing', 'Done', 'To Do', 'Old', 'List']);
});
