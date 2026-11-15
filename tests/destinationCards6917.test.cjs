'use strict';

// #6917: Copy Checklist's card dropdown stayed empty for a board with more
// cards than the lazy-loading threshold. The destination pickers read the
// cards of the chosen board from the `board` publication, which ships none
// for a board that loads lazily, and a picker opens no list that would fetch
// its window. The pickers now subscribe to `destinationCards`, which ships one
// list's card titles whatever the card-loading mode.
//
// This runs:
//   - the pure selector and field list (models/lib/destinationCards.js);
//   - the real publication handler in a vm, against a stub database: readable
//     board, unreadable board, an assigned-only member, bad arguments;
//   - the real picker dialog with a lazy destination board: the board's
//     swimlanes and lists arrive, its cards only through destinationCards;
//   - a source scan: every client picker that lists another board's cards
//     subscribes to destinationCards.
//
// Run: node tests/destinationCards6917.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const script = rel => read(rel).replace(/^import [\s\S]*?;\n/gm, '').replace(/^export \{[^}]*\};?\n/gm, '').replace(/^export /gm, '');

let checks = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(() => {
    checks += 1;
    console.log('  ok -', name);
  });
}

// A small Mongo-ish matcher, enough for the selectors built here.
function matches(doc, sel) {
  return Object.entries(sel).every(([key, cond]) => {
    if (key === '$and') return cond.every(part => matches(doc, part));
    const value = doc[key];
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      if ('$in' in cond) {
        const values = Array.isArray(value) ? value : [value];
        return cond.$in.some(v => values.includes(v) || (v == null && value == null));
      }
      if ('$nin' in cond) return !cond.$nin.includes(value);
      if ('$ne' in cond) return value !== cond.$ne;
    }
    if (key === 'archived') return !value === !cond;
    return value === cond;
  });
}

(async () => {
  const { DESTINATION_CARD_FIELDS, MAX_DESTINATION_CARDS, destinationCardsSelector } =
    await import('../models/lib/destinationCards.js');
  const { listCardsSelector } = await import('../models/lib/swimlaneFilter.js');

  await test('selector: one list in one swimlane is exactly the board view\'s list selector', () => {
    assert.deepEqual(destinationCardsSelector('L1', 'S2'), listCardsSelector('L1', 'S2'));
    assert.deepEqual(destinationCardsSelector('L1', 'S1', ['S2']), listCardsSelector('L1', 'S1', ['S2']));
  });

  await test('selector: a list with no swimlane is the whole list, no list is the whole board', () => {
    assert.deepEqual(destinationCardsSelector('L1', null), { listId: 'L1', archived: false });
    assert.deepEqual(destinationCardsSelector(null, null), { archived: false });
    assert.deepEqual(destinationCardsSelector('', 'S1'), { archived: false });
  });

  await test('negative: the picker fields carry no card content beyond the title', () => {
    for (const field of ['description', 'members', 'assignees', 'customFields', 'receivedAt', 'userId']) {
      assert.ok(!(field in DESTINATION_CARD_FIELDS), `${field} must not be published to a picker`);
    }
    for (const field of ['_id', 'title', 'sort', 'listId', 'swimlaneId', 'archived', 'type']) {
      assert.equal(DESTINATION_CARD_FIELDS[field], 1, `${field} is needed by a picker`);
    }
    assert.ok(MAX_DESTINATION_CARDS >= 1144, 'the reported board\'s cards fit');
  });

  // ---- the publication handler, run for real -----------------------------
  const src = read('server/publications/cardsWindow.js');
  const start = src.indexOf("Meteor.publish('destinationCards'");
  assert.ok(start > 0, 'destinationCards is published');
  const open = src.indexOf('async function', start);
  let depth = 0;
  let end = src.indexOf('{', open);
  for (; end < src.length; end += 1) {
    if (src[end] === '{') depth += 1;
    else if (src[end] === '}' && --depth === 0) break;
  }
  const handlerSource = src.slice(open, end + 1);
  const { assignedOnlyCardScope, mergeCardScope } = require('../models/lib/boardCardScope.js');
  const { otherSwimlaneIdsForFirstActive } = await import('../models/lib/swimlaneFilter.js');

  const boards = {
    big: { _id: 'big', members: [
      { userId: 'u', isActive: true },
      { userId: 'ao', isActive: true, isNormalAssignedOnly: true },
    ] },
    secret: { _id: 'secret', members: [] },
  };
  const cards = [];
  for (let i = 0; i < 1144; i += 1) {
    cards.push({ _id: `c${i}`, title: `Card ${i}`, boardId: 'big', listId: i % 2 ? 'L2' : 'L1',
      swimlaneId: 'S1', sort: i, archived: false, description: 'secret text', assignees: i === 4 ? ['ao'] : [] });
  }
  cards.push({ _id: 'gone', title: 'Archived', boardId: 'big', listId: 'L1', swimlaneId: 'S1', sort: 0, archived: true });
  cards.push({ _id: 'orphan', title: 'Orphan', boardId: 'big', listId: 'L1', swimlaneId: 'deleted', sort: 0, archived: false });
  cards.push({ _id: 'lane2', title: 'Lane 2', boardId: 'big', listId: 'L1', swimlaneId: 'S2', sort: 0, archived: false });
  cards.push({ _id: 'hidden', title: 'Other board', boardId: 'secret', listId: 'L1', swimlaneId: 'S1', sort: 0, archived: false });

  const Match = {
    Any: 'any',
    OneOf: (...types) => ({ oneOf: types }),
    test(value, type) {
      if (type && type.oneOf) return type.oneOf.some(t => Match.test(value, t));
      // The handler runs in a vm, whose String is not this file's.
      if (typeof type === 'function' && type.name === 'String') return typeof value === 'string';
      if (type === null) return value === null;
      if (type === undefined) return value === undefined;
      return true;
    },
  };
  const handler = vm.runInNewContext(`(${handlerSource})`, {
    check() {}, Match,
    boardVisibleTo: async (userId, id) => (id === 'big' && userId ? boards.big : null),
    ReactiveCache: { getSwimlanes: async () => [{ _id: 'S1' }, { _id: 'S2' }] },
    otherSwimlaneIdsForFirstActive, mergeCardScope, assignedOnlyCardScope,
    destinationCardsSelector, DESTINATION_CARD_FIELDS, MAX_DESTINATION_CARDS,
    Cards: { find: (selector, options) => ({ selector, options,
      docs: cards.filter(c => matches(c, selector)).sort((a, b) => a.sort - b.sort).slice(0, options.limit) }) },
  });
  const publish = async (userId, ...args) => {
    let readied = false;
    const result = await handler.call({ userId, ready() { readied = true; } }, ...args);
    return { result, readied };
  };

  await test('a lazily loaded board\'s list: every one of its cards, with titles only', async () => {
    const { result } = await publish('u', 'big', 'L1', 'S1');
    // S1 is the first swimlane: its orphaned card is listed too, S2's is not.
    const ids = result.docs.map(c => c._id);
    assert.equal(ids.filter(id => /^c\d+$/.test(id)).length, 572);
    assert.ok(ids.includes('orphan'));
    assert.ok(!ids.includes('lane2'));
    assert.ok(!ids.includes('gone'), 'no archived card');
    assert.equal(result.options.fields, DESTINATION_CARD_FIELDS);
    assert.equal(result.options.limit, MAX_DESTINATION_CARDS);
  });

  await test('the second swimlane lists only its own cards', async () => {
    const { result } = await publish('u', 'big', 'L1', 'S2');
    assert.deepEqual(result.docs.map(c => c._id), ['lane2']);
  });

  await test('no list: the whole board, never another board\'s card', async () => {
    const { result } = await publish('u', 'big', null, null);
    assert.equal(result.docs.length, 1144 + 2);
    assert.ok(!result.docs.some(c => c.boardId !== 'big'));
  });

  await test('negative: an assigned-only member gets only the cards assigned to them', async () => {
    const { result } = await publish('ao', 'big', null, null);
    assert.deepEqual(result.docs.map(c => c._id), ['c4']);
  });

  await test('negative: an unreadable board, no user, or bad arguments publish nothing', async () => {
    for (const args of [
      ['u', 'secret', 'L1', 'S1'],
      [null, 'big', 'L1', 'S1'],
      ['u', null, 'L1', 'S1'],
      ['u', '', 'L1', 'S1'],
      ['u', { $ne: null }, 'L1', 'S1'],
      ['u', 'big', { $ne: null }, 'S1'],
      ['u', 'big', 'L1', { $gt: '' }],
    ]) {
      const { result, readied } = await publish(...args);
      assert.equal(readied, true, `ready for ${JSON.stringify(args)}`);
      assert.equal(result, undefined, `no cursor for ${JSON.stringify(args)}`);
    }
  });

  // ---- the picker dialog, with a lazy destination board ------------------
  class ReactiveVar {
    constructor(value) { this.value = value; }
    get() { return this.value; }
    set(value) { this.value = value; }
  }
  function dialogWorld() {
    const docs = { swimlanes: [{ _id: 'A-lane', boardId: 'A', sort: 0 }],
      lists: [{ _id: 'A-list', boardId: 'A', swimlaneId: '', sort: 0 }], cards: [] };
    const find = coll => q => ({ fetch: () => docs[coll].filter(d => matches(d, Object.fromEntries(
      Object.entries(q).filter(([k]) => k !== 'deletedAt')))).sort((a, b) => a.sort - b.sort) });
    const context = {
      ReactiveVar,
      ReactiveCache: {
        getList: q => {
          const l = docs.lists.find(d => d._id === q._id && d.boardId === q.boardId);
          return l ? { ...l, cardsUnfiltered: sl => docs.cards.filter(c => c.listId === l._id && c.swimlaneId === sl) } : null;
        },
        getCurrentUser: () => ({ getTemplatesBoardId: () => 'T' }),
      },
      Boards: { findOne: id => ({ _id: id }), find: () => ({ fetch: () => [] }) },
      Swimlanes: { find: find('swimlanes') },
      Lists: { find: find('lists') },
      Utils: { getCurrentBoardId: () => 'A' },
      TAPi18n: { __: k => k },
      Meteor: { userId: () => 'u' },
    };
    const Base = vm.runInNewContext(`${script('client/lib/dialogWithBoardSwimlaneList.js')}\nBoardSwimlaneListDialog`, context);
    const Card = vm.runInNewContext(`${script('client/lib/dialogWithBoardSwimlaneListCard.js')}\nBoardSwimlaneListCardDialog`,
      { ...context, BoardSwimlaneListDialog: Base });
    const subs = [];
    const autoruns = [];
    const tpl = {
      view: { onViewDestroyed() {} },
      subscribe(name, ...args) {
        const handle = { name, args, stopped: false, stop() { this.stopped = true; }, callbacks: args.at(-1) };
        subs.push(handle);
        return handle;
      },
      // Enough of Blaze's template autorun: re-run on demand, stopping the
      // subscriptions the previous run made, as Blaze does.
      autorun(fn) {
        const run = { fn, subs: [] };
        run.go = () => {
          run.subs.forEach(s => s.stop());
          const before = subs.length;
          fn();
          run.subs = subs.slice(before);
        };
        autoruns.push(run);
        run.go();
      },
    };
    const rerun = () => autoruns.forEach(r => r.go());
    const big = () => {
      docs.swimlanes.push({ _id: 'B-lane', boardId: 'B', sort: 0 });
      docs.lists.push({ _id: 'B-list', boardId: 'B', swimlaneId: '', sort: 0 });
    };
    const bigCards = () => {
      for (let i = 0; i < 3; i += 1) docs.cards.push({ _id: `B-card${i}`, title: `T${i}`, boardId: 'B', listId: 'B-list', swimlaneId: 'B-lane', sort: i });
    };
    return { Card, tpl, subs, rerun, big, bigCards };
  }

  await test('a lazy destination board: the list\'s cards arrive through destinationCards and fill the dropdown', () => {
    const w = dialogWorld();
    const dialog = new w.Card(w.tpl, { getDialogOptions: () => ({ A: { boardId: 'B', swimlaneId: 'B-lane', listId: 'B-list', cardId: 'B-card2' } }) });
    w.rerun();
    const cardSub = () => w.subs.filter(s => s.name === 'destinationCards').at(-1);
    assert.deepEqual(cardSub().args.slice(0, 3), ['B', 'B-list', 'B-lane']);
    // The board is ready with its swimlanes and lists, and - being lazy - no cards.
    w.big();
    w.subs.filter(s => s.name === 'board').at(-1).callbacks.onReady();
    assert.equal(dialog.loading.get(), false);
    assert.equal(dialog.cardsLoading.get(), true, 'Done waits for the cards');
    assert.equal(dialog.selectedCardId.get(), 'B-card2', 'the remembered card is not dropped before its list\'s cards arrive');
    assert.deepEqual(dialog.cards(), []);
    w.bigCards();
    cardSub().callbacks.onReady();
    assert.equal(dialog.cardsLoading.get(), false);
    assert.deepEqual(dialog.cards().map(c => c._id), ['B-card0', 'B-card1', 'B-card2']);
    assert.equal(dialog.selectedCardId.get(), 'B-card2');
  });

  await test('negative: a remembered card that is gone is cleared once the list\'s cards are there; an old list\'s answer changes nothing', () => {
    const w = dialogWorld();
    const dialog = new w.Card(w.tpl, { getDialogOptions: () => ({ A: { boardId: 'B', swimlaneId: 'B-lane', listId: 'B-list', cardId: 'B-deleted' } }) });
    w.rerun();
    const first = w.subs.filter(s => s.name === 'destinationCards').at(-1);
    w.big();
    w.bigCards();
    w.subs.filter(s => s.name === 'board').at(-1).callbacks.onReady();
    assert.equal(dialog.selectedCardId.get(), 'B-deleted');
    // Another list is chosen before the first list's answer: that answer is stale.
    dialog.selectedListId.set('B-other');
    w.rerun();
    assert.equal(first.stopped, true, 'the previous list\'s subscription stops');
    first.callbacks.onReady();
    assert.equal(dialog.cardsLoading.get(), true);
    dialog.selectedListId.set('B-list');
    w.rerun();
    w.subs.filter(s => s.name === 'destinationCards').at(-1).callbacks.onReady();
    assert.equal(dialog.selectedCardId.get(), '');
    assert.equal(dialog.cardsLoading.get(), false);
  });

  await test('the open board\'s Filter does not empty the destination dropdown', () => {
    const cardSrc = read('client/lib/dialogWithBoardSwimlaneListCard.js');
    assert.match(cardSrc, /list\.cardsUnfiltered\(swimlaneId\)/);
    assert.doesNotMatch(cardSrc, /list\.cards\(swimlaneId\)/);
  });

  // ---- every picker of another board's cards uses the subscription --------
  await test('negative: no client picker lists another board\'s cards from the board publication alone', () => {
    const base = read('client/lib/dialogWithBoardSwimlaneList.js');
    const onReady = base.slice(base.indexOf("this.tpl.subscribe('board'"), base.indexOf('onStop:'));
    assert.doesNotMatch(onReady, /cards\(\)/, 'the board being ready says nothing about a lazy board\'s cards');
    assert.match(read('client/lib/dialogWithBoardSwimlaneListCard.js'), /subscribe\('destinationCards'/);

    const details = read('client/components/cards/cardDetails.js');
    const parent = details.slice(details.indexOf("'change .js-field-parent-board'"));
    assert.match(parent.slice(0, parent.indexOf("'change .js-field-parent-card'")), /subscribe\('destinationCards', selection/);
    assert.match(details, /destinationDisabled\(\)[\s\S]{0,400}cardsLoading/);

    const listBody = read('client/components/lists/listBody.js');
    const link = listBody.slice(listBody.indexOf('Template.linkCardPopup.onCreated'), listBody.indexOf('Template.linkCardPopup.helpers'));
    assert.match(link, /subscribe\('destinationCards'/);

    const checklists = read('client/components/cards/checklists.js');
    assert.match(checklists, /if \(!cardId \|\| !dialog\.cards\(\)\.some/, 'checklist Done needs a card of the list');
    assert.match(read('client/components/cards/checklists.jade'), /js-done\(type="button" disabled=doneDisabled\)/);
  });

  console.log(`destinationCards6917: ${checks} checks passed`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
