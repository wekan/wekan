'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = p => fs.readFileSync(p, 'utf8');
const script = p => read(p).replace(/^import .*;\n/gm, '').replace(/export /g, '');
class ReactiveVar { constructor(value) { this.value = value; } get() { return this.value; } set(value) { this.value = value; } }
const i18n = { __: key => key };

(async () => {
  const position = vm.runInNewContext(script('models/lib/relativePosition.js') + '\nrelativePosition');
  for (const ranks of [[0, .25, .3], [0, 0, 0], [-1, 0, 0, 1], [1e30, 1e30, 1e30]]) {
    for (const direction of ['above', 'below']) {
      const cards = ranks.map((sort, i) => ({ _id: String(i), sort }));
      const target = '1';
      const plan = position(cards, target, direction);
      for (const update of plan.updates) cards.find(c => c._id === update.id).sort = update.sort;
      cards.push({ _id: 'new', sort: plan.sort });
      cards.sort((a, b) => a.sort - b.sort);
      const idx = cards.findIndex(c => c._id === target);
      assert.equal(cards[idx + (direction === 'above' ? -1 : 1)]._id, 'new');
      assert.equal(cards.filter(c => c.sort === plan.sort).length, 1, 'the inserted slot is unambiguous');
    }
  }
  assert.equal(position([{ _id: 'a', sort: 0 }, { _id: 'b', sort: .25 }], 'b', 'above').sort, .125);
  assert.equal(position([{ _id: 'a', sort: 0 }, { _id: 'b', sort: .25 }], 'b', 'above').updates.length, 0);
  assert.throws(() => position([], 'missing', 'above'));
  const normal = position([{ _id: 'a', sort: 0 }, { _id: 'b', sort: 1 }, { _id: 'c', sort: 2 }], 'b', 'below', 'a');
  assert.equal(normal.sort, 1.5);
  assert.equal(normal.updates.length, 0, 'ordinary keyboard reordering requires only the moved card write');
  // Bulk insertion retains caller order in both directions.
  for (const direction of ['above', 'below']) {
    const items = [{ _id: 'target', sort: .25 }];
    let anchor = 'target';
    for (const id of ['one', 'two', 'three']) {
      const plan = position(items, anchor, direction);
      items.push({ _id: id, sort: plan.sort });
      items.sort((a, b) => a.sort - b.sort);
      if (direction === 'below') anchor = id;
    }
    assert.deepEqual(items.filter(c => c._id !== 'target').map(c => c._id), ['one', 'two', 'three']);
  }

  // Execute both real destination classes, with controllable subscription order.
  const handles = [];
  let destroy;
  const cache = {
    getBoard: id => id ? { swimlanes: () => [{ _id: `${id}-lane` }] } : null,
    getSwimlane: q => q._id === `${q.boardId}-lane` ? q : null,
    getList: q => q._id === `${q.boardId}-list` ? { cards: () => [{ _id: `${q.boardId}-card`, sort: 0 }] } : null,
    getLists: q => [{ _id: `${q.boardId}-list` }],
  };
  const context = {
    ReactiveVar, ReactiveCache: cache,
    Boards: { findOne: id => id ? { _id: id } : null },
    Swimlanes: { find: q => ({ fetch: () => [{ _id: `${q.boardId}-lane` }] }) },
    Lists: { find: q => ({ fetch: () => [{ _id: `${q.boardId}-list` }] }) },
    Utils: { getCurrentBoardId: () => 'A' }, TAPi18n: i18n,
  };
  const Base = vm.runInNewContext(script('client/lib/dialogWithBoardSwimlaneList.js') + '\nBoardSwimlaneListDialog', context);
  const CardDialog = vm.runInNewContext(script('client/lib/dialogWithBoardSwimlaneListCard.js') + '\nBoardSwimlaneListCardDialog', { ...context, BoardSwimlaneListDialog: Base });
  for (const Class of [Base, CardDialog]) {
    const tpl = { view: { onViewDestroyed(fn) { destroy = fn; } }, subscribe(name, ...args) {
      const handle = { stopped: false, stop() { this.stopped = true; }, callbacks: args.at(-1) };
      if (name === 'board') handles.push(handle);
      return handle;
    } };
    const dialog = new Class(tpl);
    dialog.getBoardData('B'); const b = handles.at(-1);
    dialog.getBoardData('C'); const c = handles.at(-1);
    assert.equal(b.stopped, true);
    assert.equal(dialog.selectedBoardId.get(), 'C');
    assert.equal(dialog.selectedListId.get(), '');
    assert.equal(dialog.loading.get(), true);
    c.callbacks.onReady(); b.callbacks.onReady();
    assert.equal(dialog.selectedBoardId.get(), 'C');
    assert.equal(dialog.selectedListId.get(), 'C-list');
    // A ready subscription already has documents even if the cached query
    // has not rerun yet. Both selectors must use those fresh documents.
    const oldBoard = cache.getBoard;
    const oldLists = cache.getLists;
    cache.getBoard = () => ({ swimlanes: () => [] });
    cache.getLists = () => [];
    dialog.getBoardData('fresh');
    handles.at(-1).callbacks.onReady();
    assert.equal(dialog.selectedSwimlaneId.get(), 'fresh-lane');
    assert.equal(dialog.selectedListId.get(), 'fresh-list');
    assert.equal(dialog.loading.get(), false);
    cache.getBoard = oldBoard;
    cache.getLists = oldLists;
    dialog.getBoardData('B'); const firstB = handles.at(-1);
    dialog.getBoardData('A');
    dialog.getBoardData('B'); const secondB = handles.at(-1);
    firstB.callbacks.onReady();
    assert.equal(dialog.loading.get(), true, 'A→B→A→B rejects stale callbacks for the same board');
    secondB.callbacks.onStop(new Error('denied'));
    assert.equal(dialog.selectedListId.get(), '');
    assert.equal(dialog.error.get(), 'server-error');
    dialog.getBoardData('C'); const closing = handles.at(-1);
    destroy(); closing.callbacks.onReady();
    assert.equal(closing.stopped, true);
    assert.equal(dialog.selectedListId.get(), '');
  }

  // Execute the real list mover: invisible/deleted neighbors are not candidates,
  // normal moves write once, and boundary activation does not write.
  let listSelector; const listWrites = []; const alerts = [];
  const listSource = read('client/components/lists/listHeader.js');
  const moveList = vm.runInNewContext(listSource.slice(listSource.indexOf('async function moveListBy('), listSource.indexOf('Template.listHeader.events({')) + '\nmoveListBy', {
    resolveContainerSwimlaneId: () => 'lane', Utils: { boardView: () => 'board-view-swimlanes' },
    ReactiveCache: { getLists(selector) { listSelector = selector; return [{ _id: 'a', sort: 0 }, { _id: 'b', sort: 1 }]; } },
    relativePosition: position, Meteor: { async callAsync(...args) { listWrites.push(args); } },
    window: { alert: message => alerts.push(message) }, TAPi18n: i18n,
  });
  await moveList({ _id: 'a', boardId: 'board' }, -1);
  assert.equal(listWrites.length, 0);
  await moveList({ _id: 'a', boardId: 'board' }, 1);
  assert.equal(listWrites.length, 1);
  assert.equal(listSelector.deletedAt, null);
  assert.equal(listSelector.archived, false);
  assert.deepEqual(Array.from(listSelector.swimlaneId.$in), ['lane', null, '']);
  assert.equal(listWrites[0][0], 'updateListSort');
  assert.equal(listWrites[0][3].sort, 2);

  let events;
  const details = read('client/components/cards/cardDetails.js');
  const register = details.slice(details.indexOf('function registerCardDialogTemplate('), details.indexOf('/** Move Card Dialog */'));
  let closed = 0;
  vm.runInNewContext(register + '\nregisterCardDialogTemplate("test");', {
    Template: { test: { helpers() {}, events(value) { events = value; } } },
    Popup: { back() { closed++; } }, TAPi18n: i18n, console: { error() {} },
  });
  const dialog = { loading: new ReactiveVar(true), saving: new ReactiveVar(false), error: new ReactiveVar(''),
    selectedBoardId: new ReactiveVar('B'), selectedSwimlaneId: new ReactiveVar('S'), selectedListId: new ReactiveVar('L'),
    async setDone() { throw new Error('Rejected'); } };
  const done = () => events['click .js-done']({ preventDefault() {} }, { dialog, $: () => [] });
  await done(); assert.equal(closed, 0);
  dialog.loading.set(false); await done();
  assert.equal(closed, 0); assert.equal(dialog.error.get(), 'Rejected'); assert.equal(dialog.saving.get(), false);
  dialog.setDone = async () => {};
  await done(); assert.equal(closed, 1); assert.equal(dialog.error.get(), '');

  let rule;
  vm.runInNewContext(script('client/components/rules/actions/checklistActions.js'), {
    Template: { checklistActions: { onCreated() {}, events(value) { events = value; } }, currentData: () => ({ ruleName: new ReactiveVar('rule'), triggerVar: new ReactiveVar({}) }) },
    Session: { get: () => 'board' }, Utils: { getTriggerActionDesc: () => '' },
    saveRuleTriggerAction(...args) { rule = args.at(-1); },
  });
  events['click .js-add-check-item-action']({}, { find: selector => ({ value: ({ '#checkitem-name': 'Item', '#checklist-name3': 'List', '#check-item-action': 'check' })[selector] }) });
  assert.equal(rule.checkItemName, 'Item'); assert.equal(rule.checklistName, 'List');

  const translationSource = read('client/components/settings/translationBody.js');
  const regexLine = translationSource.split('\n').find(line => line.includes('const regex = new RegExp'));
  for (const value of ['[', '(', '\\', 'a.*b', 'normal']) {
    assert.equal(vm.runInNewContext(regexLine + '\nregex.test(value)', { value }), true);
  }
  assert.equal(vm.runInNewContext(regexLine + '\nregex.test("axb")', { value: 'a.b' }), false);
  const calendar = read('packages/wekan-fullcalendar/template.js').match(/if \(preservedViewType[^]*?\n    }/)[0];
  const options = { initialView: 'dayGridMonth' };
  vm.runInNewContext(calendar, { options, preservedViewType: 'timeGridWeek' });
  assert.equal(options.initialView, 'timeGridWeek');

  let created; let timeEvents;
  const writes = [];
  const card = { getIsOvertime: () => false, setSpentTime: v => writes.push(['time', v]), setIsOvertime: v => writes.push(['overtime', v]) };
  vm.runInNewContext(script('client/components/cards/cardTime.js'), {
    ReactiveVar, Cards: { findOne: () => card }, getCurrentCardIdFromContext: () => 'card',
    Template: { editCardSpentTimePopup: { onCreated(fn) { created = fn; }, helpers() {}, events(value) { timeEvents = value; } }, cardSpentTime: { helpers() {}, events() {} } },
    Popup: { back() {}, open() {} }, TAPi18n: i18n,
  });
  const time = {}; created.call(time);
  timeEvents['click a.js-toggle-overtime']({ preventDefault() {} }, time);
  assert.equal(writes.length, 0, 'closing the time editor without Save leaves persistence untouched');
  timeEvents['submit .edit-time']({ preventDefault() {}, target: { time: { value: '2.5' } } }, time);
  assert.deepEqual(writes, [['time', 2.5], ['overtime', true]]);

  let attachmentEvents; let resolveBackground; let rejectBackground;
  const backgroundEffects = [];
  const attachmentsSource = read('client/components/cards/attachments.js');
  const actions = attachmentsSource.slice(attachmentsSource.indexOf('Template.attachmentActionsPopup.events({'), attachmentsSource.indexOf('Template.attachmentRenamePopup.helpers({'));
  vm.runInNewContext(actions, {
    Template: { attachmentActionsPopup: { events(value) { attachmentEvents = value; } } },
    Utils: { getCurrentBoard: () => ({ setBackgroundImageURL: () => new Promise((resolve, reject) => { resolveBackground = resolve; rejectBackground = reject; }) }),
      setBackgroundImage: () => backgroundEffects.push('style'), reload: () => backgroundEffects.push('reload') },
    Popup: { back: () => backgroundEffects.push('close') }, TAPi18n: i18n,
    window: { alert: () => backgroundEffects.push('error') },
  });
  const removal = attachmentEvents['click .js-remove-background-image']({ preventDefault() {} });
  assert.deepEqual(backgroundEffects, [], 'no reload before the background write completes');
  resolveBackground(1); await removal;
  assert.deepEqual(backgroundEffects, ['style', 'close', 'reload']);
  backgroundEffects.length = 0;
  const rejectedRemoval = attachmentEvents['click .js-remove-background-image']({ preventDefault() {} });
  rejectBackground(new Error('denied')); await rejectedRemoval;
  assert.deepEqual(backgroundEffects, ['error'], 'a rejected write keeps the popup open and never reloads');

  const errorKey = vm.runInNewContext(script('client/lib/accountOperationError.js') + '\naccountOperationErrorKey');
  assert.equal(errorKey({ error: 'not-authorized', reason: 'Cannot delete the last administrator' }), 'last-admin-desc');
  assert.equal(errorKey({ error: 'not-authorized' }), 'error-notAllowed');
  assert.equal(errorKey({ error: 'user-not-found' }), 'error-user-doesNotExist');
  assert.equal(errorKey({ reason: 'untranslated diagnostic' }), 'server-error');
  console.log('  ok - accepted audit fixes: ordering, stale requests, disposal, failed operations, rules, search, calendar, drafts and localized errors');
})().catch(error => { console.error(error); process.exitCode = 1; });
