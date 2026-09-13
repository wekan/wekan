'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = fs.readFileSync(path.join(__dirname, '../client/components/boards/multiboardCalendarView.js'), 'utf8');
// Resolve the real module's imports explicitly; no Filter/FlowRouter globals.
const source = file.replace(/^import\s+\{([^}]+)\}\s+from\s+(['"])([^'"]+)\2;/gm,
  (_, names, quote, specifier) => `const {${names}} = require(${JSON.stringify(specifier)});`);
let created, helpers, active = false, ready = true, instance;
const start = new Date('2026-03-21T12:00:00Z'), end = new Date('2026-03-22T12:00:00Z');
const boards = ['a', 'b'].map(id => ({
  _id: id, title: `Board ${id}`, slug: id,
  cardsInInterval(from, to, selector) {
    assert.equal(from, start); assert.equal(to, end);
    assert.equal(Boolean(selector), active);
    return [{ _id: `${id}-visible`, title: 'Visible', startAt: start, endAt: end },
      ...(!selector ? [{ _id: `${id}-hidden`, title: 'Hidden', startAt: start, endAt: end }] : [])];
  },
  cardsReceivedInBetween() { return []; }, cardsDueInBetween() { return []; }, cardsEndInBetween() { return []; },
}));
const dependencies = {
  '/client/lib/filter': { Filter: { isActive: () => active, _getMongoSelector: () => ({ labelIds: 'visible' }) } },
  'meteor/ostrio:flow-router-extra': { FlowRouter: { path(name, params) {
    assert.equal(name, 'card'); return `/b/${params.boardId}/${params.slug}/${params.cardId}`;
  } } },
  '/client/lib/dateDisplay': { calendarDateDisplayOptions: () => ({ initialView: 'selectedCalendarMonth' }) },
  '/imports/reactiveCache': { ReactiveCache: {
    getBoards(query) { assert.equal(query['members.userId'], 'member'); assert.equal(query.archived, false); assert.equal(query.type, 'board'); return boards; },
    getCurrentUser: () => null,
  } },
  '/imports/i18n': { TAPi18n: { __: key => key, getLanguage: () => 'en', isRTL: () => false } },
  'meteor/reactive-var': { ReactiveVar: class { constructor(value) { this.value = value; } get() { return this.value; } set(value) { this.value = value; } } },
  '/client/lib/calendarFirstDay': { toFullCalendarFirstDay: value => value },
  '/models/lib/weekStart': { weekNumberByFirstDay: () => 1 },
  '/models/lib/helperBoards': { notHelperBoardTitle: () => ({ $nin: ['Templates'] }) },
};
vm.runInNewContext(source, {
  Meteor: { userId: () => 'member' },
  Template: { multiboardCalendarView: { onCreated: callback => { created = callback; }, helpers: value => { helpers = value; } }, instance: () => instance },
  require(specifier) { assert.ok(dependencies[specifier], `unexpected import ${specifier}`); return dependencies[specifier]; },
});
instance = { autorun(callback) { callback(); }, subscribe(name, id, lazy) {
  assert.equal(name, 'board'); assert.ok(['a', 'b'].includes(id)); assert.equal(lazy, false);
  return { ready: () => ready || id === 'a' };
} };
created.call(instance); assert.equal(helpers.isLoading(), false);
const options = helpers.multiboardCalendarOptions();
assert.equal(options.initialView, 'selectedCalendarMonth');
let events;
options.events({ start, end }, result => { events = result; });
assert.equal(events.length, 4);
assert.ok(events.some(event => event.title === '[Board a] Visible'));
assert.ok(events.some(event => event.url === '/b/b/b/b-visible'));
active = true;
options.events({ start, end }, result => { events = result; });
assert.equal(events.length, 2); assert.ok(events.every(event => !event.title.includes('Hidden')));
ready = false; created.call(instance); assert.equal(helpers.isLoading(), true);
console.log('multi-board calendar runtime: module imports, membership scope, card URLs, selected view, active filters and subscription readiness pass');
