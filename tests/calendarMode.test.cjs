'use strict';

// #3194: Calendar Mode - Trello's calendar (models/lib/calendarMode.js,
// client/components/boards/calendarModeView.*). Browser test:
// tests/playwright/specs/calendar-mode.e2e.js.
// Run: node tests/calendarMode.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cm = require('../models/lib/calendarMode');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

console.log('calendarMode:');

test('a month is whole weeks from the user\'s first day of the week', () => {
  // October 2026: the 1st is a Thursday.
  const monday = cm.calendarModeDays({ anchor: new Date(2026, 9, 15), range: 'month', firstDay: 1, today: new Date(2026, 9, 10) });
  assert.equal(monday.weeks[0][0].key, '2026-09-28', 'starts on the Monday before the 1st');
  assert.equal(monday.weeks.length, 5);
  assert.ok(monday.weeks.every(week => week.length === 7));
  assert.equal(monday.weeks[0][3].key, '2026-10-01');
  assert.equal(monday.weeks[0][0].inRange, false, 'September days are outside');
  assert.equal(monday.weeks[1].find(day => day.key === '2026-10-10').isToday, true);
  const sunday = cm.calendarModeDays({ anchor: new Date(2026, 9, 15), range: 'month', firstDay: 0 });
  assert.equal(sunday.weeks[0][0].key, '2026-09-27', 'a Sunday-first week');
  // Negative: a nonsense first day falls back to Monday, a nonsense range to a month.
  assert.equal(cm.calendarModeDays({ anchor: new Date(2026, 9, 15), range: 'year', firstDay: 'x' }).weeks[0][0].key, '2026-09-28');
});

test('a week is one row of seven days, and the anchor moves by a week or a month', () => {
  const week = cm.calendarModeDays({ anchor: new Date(2026, 9, 15), range: 'week', firstDay: 1 });
  assert.deepEqual(week.weeks.map(w => w.map(d => d.key)), [[
    '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']]);
  assert.ok(week.weeks[0].every(day => day.inRange));
  assert.equal(cm.dayKey(cm.shiftAnchor(new Date(2026, 9, 15), 'week', 1)), '2026-10-22');
  assert.equal(cm.dayKey(cm.shiftAnchor(new Date(2026, 0, 31), 'month', 1)), '2026-02-01', 'a month, never past its end');
  assert.equal(cm.dayKey(cm.shiftAnchor(new Date(2026, 0, 15), 'month', -1)), '2025-12-01');
});

test('cards fall on their due day, in the board\'s order: the list, then the card', () => {
  const at = (d, h) => new Date(2026, 9, d, h);
  const cards = [
    { _id: 'c', title: 'Gamma', listId: 'L2', sort: 0, dueAt: at(14, 9) },
    { _id: 'b', title: 'Beta', listId: 'L1', sort: 5, dueAt: at(14, 23) },
    { _id: 'a', title: 'Alpha', listId: 'L1', sort: 1, dueAt: at(14, 1) },
    { _id: 'x', title: 'Unlisted', listId: 'gone', sort: 0, dueAt: at(14, 12) },
    { _id: 'n', title: 'No due', listId: 'L1', sort: 0 },
    { _id: 'd', title: 'Next day', listId: 'L1', sort: 0, dueAt: at(15, 0) },
  ];
  const byDay = cm.cardsByDueDay(cards, { L1: 0, L2: 1 });
  assert.deepEqual(byDay.get('2026-10-14').map(card => card._id), ['a', 'b', 'c', 'x'],
    'the time of day does not order them; the list and the card do, an unknown list last');
  assert.deepEqual(byDay.get('2026-10-15').map(card => card._id), ['d']);
  // Negative: a card without a due date, or with a broken one, is not shown.
  assert.equal([...byDay.values()].flat().some(card => card._id === 'n'), false);
  assert.equal(cm.cardsByDueDay([{ _id: 'bad', dueAt: 'not a date' }]).size, 0);
});

test('the view is offered below Calendar, rendered by the board, and shows labels and the whole title', () => {
  const bvs = require('../models/lib/boardViewSettings');
  const order = bvs.DEFAULT_BOARD_VIEW_ORDER;
  assert.equal(order[order.indexOf('board-view-cal') + 1], 'board-view-calendar-mode');
  assert.ok(bvs.BOARD_VIEWS.some(v => v.view === 'board-view-calendar-mode' && v.labelKey === 'board-view-calendar-mode'));
  assert.match(read('models/users.js'), /'board-view-cal',\s*'board-view-calendar-mode',/);
  assert.match(read('models/lib/instanceFeatures.js'), /views: \['board-view-cal', 'board-view-calendar-mode', 'board-view-multiboard-cal'\]/);
  assert.equal((read('client/lib/utils.js').match(/'board-view-calendar-mode',/g) || []).length, 2, 'set and read back');
  assert.match(read('client/components/boards/boardHeader.js'), /'click \.js-open-calendar-mode-view'\(\) \{\s*Utils\.setBoardView\('board-view-calendar-mode'\);/);
  assert.match(read('client/components/boards/boardBody.jade'), /else if isViewCalendarMode\s*\n\s*\+calendarModeView/);
  const jade = read('client/components/boards/calendarModeView.jade');
  assert.match(jade, /span\.card-label\(class="card-label-\{\{color\}\}" title="\{\{name\}\}"\)= name/);
  assert.match(jade, /\.calendar-mode-card-title= title/);
  const js = read('client/components/boards/calendarModeView.js');
  assert.match(js, /board\.cardsDueInBetween\(start, end, filter\)/, 'the board\'s due cards in range');
  assert.match(js, /Filter\.isActive\(\) \? Filter\._getMongoSelector\(\) : undefined/, 'with the board Filter, as Calendar');
  assert.match(js, /getStartDayOfWeek/);
  for (const file of ['calendarModeView.jade', 'calendarModeView.js', 'calendarModeView.css']) {
    assert.match(read('client/features/boards.js'), new RegExp(`import '/client/components/boards/${file.replace('.', '\\.')}';`));
  }
  assert.equal(JSON.parse(read('imports/i18n/data/en.i18n.json'))['board-view-calendar-mode'], 'Calendar Mode');
});

console.log(`\ncalendarMode: ${passed} tests passed`);
