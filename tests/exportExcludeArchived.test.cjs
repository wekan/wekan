'use strict';
// #6946: a board export can leave the board's archive behind (?archived=false,
// "JSON without archived items"), so moving a board to another WeKan does not
// bring years of archived cards, lists and swimlanes that then have to be
// emptied by hand. An ordinary export stays a complete backup.
// Run: node tests/exportExcludeArchived.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const { liveOnlySelector, liveCardSelector, liveAttachmentSelector } = require('../models/lib/exportArchivedFilter');

// Just enough of Mongo's matching for these selectors: equality, $ne, $in, $nin, $and, $or.
function matches(doc, sel) {
  return Object.entries(sel).every(([k, v]) => {
    if (k === '$and') return v.every(s => matches(doc, s));
    if (k === '$or') return v.some(s => matches(doc, s));
    const value = k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), doc);
    const norm = value === undefined ? null : value;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('$ne' in v) return norm !== v.$ne;
      if ('$in' in v) return v.$in.includes(norm);
      if ('$nin' in v) return !v.$nin.includes(norm);
    }
    return norm === v;
  });
}

const BOARD = { boardId: 'B', linkedId: { $in: ['', null] } };
const cards = [
  { _id: 'live', boardId: 'B', listId: 'L1', swimlaneId: 'S1', archived: false },
  { _id: 'noflag', boardId: 'B', listId: 'L1', swimlaneId: 'S1' },
  { _id: 'archived', boardId: 'B', listId: 'L1', swimlaneId: 'S1', archived: true },
  // Restored from the archive, but its list stayed archived.
  { _id: 'onArchivedList', boardId: 'B', listId: 'L2', swimlaneId: 'S1', archived: false },
  { _id: 'onArchivedLane', boardId: 'B', listId: 'L1', swimlaneId: 'S2', archived: false },
];
const ids = sel => cards.filter(c => matches(c, sel)).map(c => c._id);

test('without the archive: archived cards and the cards on archived lists and swimlanes stay behind', () => {
  assert.deepEqual(ids(liveCardSelector(BOARD, true, ['L2'], ['S2'])), ['live', 'noflag']);
});

test('negative: an ordinary export keeps every card, the selector untouched', () => {
  assert.equal(liveCardSelector(BOARD, false, ['L2'], ['S2']), BOARD);
  assert.equal(liveOnlySelector(BOARD, false), BOARD);
  assert.deepEqual(ids(BOARD), cards.map(c => c._id));
});

test('a list scope keeps its listId, and the input is not changed', () => {
  const scoped = { ...BOARD, listId: 'L1' };
  const out = liveCardSelector(scoped, true, ['L2'], []);
  assert.equal(out.listId, 'L1');
  assert.ok(!('archived' in scoped) && !('$and' in scoped));
  assert.deepEqual(ids(out), ['live', 'noflag', 'onArchivedLane']);
  // No archived containers: no $and at all.
  assert.ok(!('$and' in liveCardSelector(BOARD, true, [], [])));
});

test('lists and swimlanes: archived ones out, a row without the flag kept', () => {
  const lists = [{ _id: 'a', archived: false }, { _id: 'b' }, { _id: 'c', archived: true }];
  const sel = liveOnlySelector({ boardId: 'B' }, true);
  assert.deepEqual(lists.filter(l => matches({ boardId: 'B', ...l }, sel)).map(l => l._id), ['a', 'b']);
});

test('attachments: the exported cards\' files and the board\'s own, not an archived card\'s', () => {
  const atts = [
    { _id: 'ofLive', meta: { boardId: 'B', cardId: 'live' } },
    { _id: 'ofArchived', meta: { boardId: 'B', cardId: 'archived' } },
    { _id: 'background', meta: { boardId: 'B', source: 'board-background' } },
    { _id: 'backgroundEmpty', meta: { boardId: 'B', cardId: '' } },
  ];
  const sel = liveAttachmentSelector({ 'meta.boardId': 'B' }, true, ['live', 'noflag']);
  assert.deepEqual(atts.filter(a => matches(a, sel)).map(a => a._id), ['ofLive', 'background', 'backgroundEmpty']);
  // Negative: off, all of them.
  const all = liveAttachmentSelector({ 'meta.boardId': 'B' }, false, []);
  assert.equal(atts.filter(a => matches(a, all)).length, 4);
});

test('the option is opt-in, at the JSON and the .zip routes', () => {
  const route = read('models/export.js');
  assert.equal((route.match(/excludeArchived: req\.query\.archived === 'false'/g) || []).length, 2);
  const exporter = read('models/exporter.js');
  assert.match(exporter, /this\._excludeArchived = options\.excludeArchived === true;/);
});

test('every board read of cards, lists, swimlanes and attachments goes through the filter', () => {
  const exporter = read('models/exporter.js');
  assert.match(exporter, /return this\._liveCards\(selector, boardId\);/, 'the scoped card selector');
  assert.match(exporter, /getLists\(this\._liveOnly\(byBoard\)/);
  assert.match(exporter, /getSwimlanes\(this\._liveOnly\(byBoard\)/);
  assert.match(exporter, /getCards\(await this\._liveCards\(byBoardNoLinked, this\._boardId\)/);
  assert.match(exporter, /getCards\(await this\._liveCards\(\{\s*boardId: card\.boardId,\s*parentId: card\._id,/, 'subtasks');
  assert.match(exporter, /streamArray\('lists', listsRaw, this\._liveOnly\(listSelector\)/);
  assert.match(exporter, /streamArray\('swimlanes', swimlanesRaw, this\._liveOnly\(swimlaneSelector\)/);
  // Negative: no whole-board attachment read is left unfiltered, here or in the .zip.
  const build = exporter.slice(exporter.indexOf('  async build()'));
  assert.doesNotMatch(build, /:\s*byBoardAttachment;/);
  assert.match(build, /await this\._liveAttachments\(byBoardAttachment, this\._boardId\)/);
  assert.match(build, /: await this\._liveAttachments\(\{ 'meta\.boardId': boardId \}, boardId\)\);/);
  const zip = read('models/server/ExporterZip.js');
  assert.doesNotMatch(zip, /getAttachments\(liveAttachments\(\{ 'meta\.boardId'/);
  assert.match(zip, /const live = liveAttachments\(\{ 'meta\.boardId': this\._boardId \}\);\s*return ReactiveCache\.getAttachments\(await exporter\._liveAttachments\(live, this\._boardId\)\);/);
});

test('the export popup offers it, next to "without attachments", in every language', () => {
  const client = read('client/components/boards/exportScope.js');
  assert.match(client, /key: 'json-no-archive',[\s\S]*?labelKey: 'export-board-without-archive',[\s\S]*?query: \{ archived: 'false' \}/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.equal(en['export-board-without-archive'], 'without archived items');
  const dir = path.join(root, 'imports/i18n/data');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.ok(d['export-board-without-archive'], f);
  }
});
