'use strict';

// #6901: the Move / Copy card popup remembered only the board chosen last
// time, not its swimlane and list. BoardSwimlaneListDialog.setOption() checked
// the remembered swimlane and list against the client's documents right after
// subscribing to the remembered board; when that board is not the open one,
// its documents had not arrived yet, so both were replaced by the first of
// nothing. This runs the real dialog classes with the remembered board's data
// arriving only when its subscription is ready, as in the browser.
//
// Run: node tests/moveCopyRemembersDestination6901.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const script = rel => read(rel).replace(/^import .*;\n/gm, '').replace(/export /g, '');

class ReactiveVar {
  constructor(value) { this.value = value; }
  get() { return this.value; }
  set(value) { this.value = value; }
}

// Client documents: board A (the open one) is there from the start; board B
// arrives when its subscription becomes ready.
function world() {
  const docs = {
    swimlanes: [{ _id: 'A-lane1', boardId: 'A', sort: 0 }],
    lists: [{ _id: 'A-list1', boardId: 'A', swimlaneId: '', sort: 0 }],
    cards: [],
  };
  const boardB = {
    swimlanes: [
      { _id: 'B-lane1', boardId: 'B', sort: 0 },
      { _id: 'B-lane2', boardId: 'B', sort: 1 },
    ],
    lists: [
      { _id: 'B-list1', boardId: 'B', swimlaneId: '', sort: 0 },
      { _id: 'B-list2', boardId: 'B', swimlaneId: '', sort: 1 },
    ],
    cards: [{ _id: 'B-card2', boardId: 'B', listId: 'B-list2', swimlaneId: 'B-lane2', sort: 0 }],
  };
  const match = (doc, q) => Object.entries(q).every(([k, v]) => {
    if (v && typeof v === 'object' && Array.isArray(v.$in)) return v.$in.includes(doc[k] ?? null) || v.$in.includes(doc[k]);
    if (k === 'archived') return !doc.archived === !v;
    if (k === 'deletedAt') return doc.deletedAt == null;
    return doc[k] === v;
  });
  const find = coll => q => ({ fetch: () => docs[coll].filter(d => match(d, q)).sort((a, b) => a.sort - b.sort) });
  const lists = find('lists');
  const cache = {
    getSwimlane: q => docs.swimlanes.find(d => match(d, q)) || null,
    getList: q => {
      const l = docs.lists.find(d => match(d, q));
      return l ? { ...l, cards: sl => docs.cards.filter(c => c.listId === l._id && c.swimlaneId === sl) } : null;
    },
    getCurrentUser: () => ({ getTemplatesBoardId: () => 'T' }),
  };
  const context = {
    ReactiveVar, ReactiveCache: cache,
    Boards: { findOne: id => (id === 'A' || id === 'B' ? { _id: id } : null), find: () => ({ fetch: () => [] }) },
    Swimlanes: { find: find('swimlanes') },
    Lists: { find: lists },
    Utils: { getCurrentBoardId: () => 'A' },
    TAPi18n: { __: k => k },
    Meteor: { userId: () => 'u' },
  };
  const arrive = () => {
    docs.swimlanes.push(...boardB.swimlanes);
    docs.lists.push(...boardB.lists);
    docs.cards.push(...boardB.cards);
  };
  return { context, arrive, docs };
}

function classes(context) {
  const Base = vm.runInNewContext(`${script('client/lib/dialogWithBoardSwimlaneList.js')}\nBoardSwimlaneListDialog`, context);
  const Card = vm.runInNewContext(`${script('client/lib/dialogWithBoardSwimlaneListCard.js')}\nBoardSwimlaneListCardDialog`,
    { ...context, BoardSwimlaneListDialog: Base });
  return { Base, Card };
}

function open(Class, saved) {
  const subs = [];
  const tpl = {
    view: { onViewDestroyed() {} },
    subscribe(name, ...args) {
      const handle = { name, args, stop() {}, callbacks: args.at(-1) };
      subs.push(handle);
      return handle;
    },
  };
  const dialog = new Class(tpl, { getDialogOptions: () => saved });
  return { dialog, boardSub: () => subs.filter(s => s.name === 'board').at(-1) };
}

const remembered = { A: { boardId: 'B', swimlaneId: 'B-lane2', listId: 'B-list2', cardId: 'B-card2' } };
let checks = 0;

// 1. Positive: another board's remembered swimlane, list (and card) survive
//    until that board's documents arrive, and are still selected after.
for (const kind of ['Base', 'Card']) {
  const w = world();
  const { dialog, boardSub } = open(classes(w.context)[kind], remembered);
  assert.equal(dialog.selectedBoardId.get(), 'B', `${kind}: remembered board`);
  assert.equal(dialog.selectedSwimlaneId.get(), 'B-lane2', `${kind}: remembered swimlane kept while loading`);
  assert.equal(dialog.selectedListId.get(), 'B-list2', `${kind}: remembered list kept while loading`);
  assert.deepEqual(Array.from(boardSub().args.slice(0, 1)), ['B']);
  w.arrive();
  boardSub().callbacks.onReady();
  assert.equal(dialog.selectedSwimlaneId.get(), 'B-lane2', `${kind}: remembered swimlane after ready`);
  assert.equal(dialog.selectedListId.get(), 'B-list2', `${kind}: remembered list after ready`);
  assert.equal(dialog.loading.get(), false);
  if (kind === 'Card') assert.equal(dialog.selectedCardId.get(), 'B-card2', 'remembered card after ready');
  checks += 1;
}

// 2. Negative: a remembered swimlane or list that no longer exists falls back
//    to the first one - once the board's documents are there, not before.
{
  const w = world();
  const gone = { A: { boardId: 'B', swimlaneId: 'B-deleted-lane', listId: 'B-deleted-list' } };
  const { dialog, boardSub } = open(classes(w.context).Base, gone);
  w.arrive();
  boardSub().callbacks.onReady();
  assert.equal(dialog.selectedSwimlaneId.get(), 'B-lane1');
  assert.equal(dialog.selectedListId.get(), 'B-list1');
  checks += 1;
}

// 3. Nothing remembered for this board: the open board's first swimlane and
//    list are selected at once, as before.
{
  const w = world();
  const { dialog } = open(classes(w.context).Base, {});
  assert.equal(dialog.selectedBoardId.get(), 'A');
  assert.equal(dialog.selectedSwimlaneId.get(), 'A-lane1');
  assert.equal(dialog.selectedListId.get(), 'A-list1');
  checks += 1;
}

// 4. Source: setOption() does not test the remembered ids against the client's
//    documents before the subscription is ready (the #6901 shape).
{
  const src = read('client/lib/dialogWithBoardSwimlaneList.js');
  const start = src.indexOf('  setOption(boardId) {');
  const body = src.slice(start, src.indexOf('\n  }\n', start));
  assert.ok(start > 0);
  assert.doesNotMatch(body, /ReactiveCache\.get(Swimlane|List)\(/, 'setOption must leave the existence check to onReady');
  checks += 1;
}

console.log(`moveCopyRemembersDestination6901: ${checks} checks passed`);
