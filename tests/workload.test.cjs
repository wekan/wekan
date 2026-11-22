'use strict';

// models/lib/workload.js: capacity, load, allocation and placeholders, as
// arithmetic. Run: node tests/workload.test.cjs

const assert = require('node:assert/strict');
const W = require('../models/lib/workload.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// 2027-04-05 is a Monday.
const MON = '2027-04-05';
const base = (extra = {}) => ({ from: MON, weeks: 1, today: MON, people: [{ userId: 'a' }], cards: [], ...extra });
const week = (report, userId = 'a', i = 0) => report.people.find(p => p.userId === userId).weeks[i];

test('days: weeks start on Monday, weekdays are ISO', () => {
  assert.equal(W.weekStart('2027-04-08'), MON);
  assert.equal(W.weekStart('2027-04-11'), MON, 'Sunday belongs to the week before');
  assert.equal(W.isoWeekday('2027-04-11'), 7);
  assert.equal(W.addDays('2027-02-28', 1), '2027-03-01');
  assert.throws(() => W.parseDay('2027-02-30'), /Invalid calendar date/);
  assert.throws(() => W.parseDay('5.4.2027'), /YYYY-MM-DD/);
});

test('capacity: 37.5 h a week by default, Monday to Friday', () => {
  const r = W.computeWorkload(base());
  assert.equal(week(r).capacityHours, 37.5);
  // Skills and a utilization target are part of a capacity, empty by default.
  assert.deepEqual(r.people[0].capacity, { hoursPerWeek: 37.5, workPercent: 100, workingDays: [1, 2, 3, 4, 5], skills: [], utilizationTarget: null });
});

test('capacity: part-time 60 % of 37.5 h is 22.5 h', () => {
  const r = W.computeWorkload(base({ people: [{ userId: 'a', capacity: { hoursPerWeek: 37.5, workPercent: 60 } }] }));
  assert.equal(week(r).capacityHours, 22.5);
});

test('negative: a capacity outside its range is refused', () => {
  assert.throws(() => W.normalizeCapacity({ hoursPerWeek: 169 }), /between 0 and 168/);
  assert.throws(() => W.normalizeCapacity({ workPercent: 120 }), /between 0 and 100/);
  assert.throws(() => W.normalizeCapacity({ workingDays: [0] }), /working days/);
  assert.throws(() => W.normalizeCapacity({ hoursPerWeek: '37' }), /between 0 and 168/);
  assert.throws(() => W.normalizeCapacity({ evil: 1 }), /Unsupported field/);
});

test('load: a card estimated 40 h due on Friday, assigned to one person, is 107 %, overloaded', () => {
  const r = W.computeWorkload(base({ cards: [{ _id: 'c1', boardId: 'b1', title: 'Big', assignees: ['a'], startAt: MON, dueAt: '2027-04-09T15:00:00Z', estimatedHours: 40 }] }));
  const w = week(r);
  assert.equal(w.loadHours, 40);
  assert.equal(w.utilization, 107);
  assert.equal(w.overloaded, true);
  assert.deepEqual(w.cards.map(c => [c.cardId, c.hours]), [['c1', 40]]);
});

test('load: exactly the capacity is 100 % and not overloaded; light work is underloaded', () => {
  const full = W.computeWorkload(base({ cards: [{ _id: 'c', assignees: ['a'], startAt: MON, dueAt: '2027-04-09', estimatedHours: 37.5 }] }));
  assert.equal(week(full).utilization, 100);
  assert.equal(week(full).overloaded, false);
  const light = W.computeWorkload(base({ cards: [{ _id: 'c', assignees: ['a'], dueAt: '2027-04-09', estimatedHours: 5 }] }));
  assert.equal(week(light).underloaded, true);
});

test('load: the time already spent is taken off the estimate; done cards count nothing', () => {
  const r = W.computeWorkload(base({ cards: [
    { _id: 'c1', assignees: ['a'], dueAt: '2027-04-09', estimatedHours: 10, spentTime: 4 },
    { _id: 'c2', assignees: ['a'], dueAt: '2027-04-09', estimatedHours: 10, spentTime: 12 },
    { _id: 'c3', assignees: ['a'], dueAt: '2027-04-09', estimatedHours: 10, dueComplete: true },
  ] }));
  assert.equal(week(r).loadHours, 6);
});

test('load: a card shared by two assignees is split; members carry it only when nobody is assigned', () => {
  const people = [{ userId: 'a' }, { userId: 'b' }, { userId: 'm' }];
  const r = W.computeWorkload(base({ people, cards: [
    { _id: 'c1', assignees: ['a', 'b'], members: ['m'], dueAt: '2027-04-09', estimatedHours: 10 },
    { _id: 'c2', members: ['m'], dueAt: '2027-04-09', estimatedHours: 3 },
  ] }));
  assert.equal(week(r, 'a').loadHours, 5);
  assert.equal(week(r, 'b').loadHours, 5);
  assert.equal(week(r, 'm').loadHours, 3);
});

test('load: work spreads over the weeks of its span, by the hours of each day', () => {
  // Two working weeks, 20 h: 10 h each.
  const r = W.computeWorkload(base({ weeks: 2, cards: [{ _id: 'c', assignees: ['a'], startAt: MON, dueAt: '2027-04-16', estimatedHours: 20 }] }));
  assert.equal(week(r, 'a', 0).loadHours, 10);
  assert.equal(week(r, 'a', 1).loadHours, 10);
});

test('load: story points are summed beside hours, the same way', () => {
  const r = W.computeWorkload(base({ cards: [{ _id: 'c', assignees: ['a'], dueAt: '2027-04-09', points: 8 }] }));
  assert.equal(week(r).loadPoints, 8);
  assert.equal(week(r).loadHours, 0);
});

test('load: overdue work is due today; undated work is unscheduled; unestimated cards are counted', () => {
  const r = W.computeWorkload(base({ today: '2027-04-07', cards: [
    { _id: 'late', assignees: ['a'], dueAt: '2027-03-01', estimatedHours: 6 },
    { _id: 'nodate', assignees: ['a'], estimatedHours: 4, points: 2 },
    { _id: 'noest', assignees: ['a'], dueAt: '2027-04-09' },
  ] }));
  const p = r.people[0];
  assert.equal(week(r).loadHours, 6);
  assert.equal(p.overdueCards, 1);
  assert.equal(p.unscheduledHours, 4);
  assert.equal(p.unscheduledPoints, 2);
  assert.equal(p.unestimatedCards, 1);
});

test('load: work nobody carries is shown as unassigned; work of people outside the report is not', () => {
  const r = W.computeWorkload(base({ cards: [
    { _id: 'u', dueAt: '2027-04-09', estimatedHours: 7 },
    { _id: 'x', assignees: ['stranger'], dueAt: '2027-04-09', estimatedHours: 9 },
  ] }));
  assert.equal(r.unassigned.weeks[0].loadHours, 7);
  assert.equal(week(r).loadHours, 0);
});

test('absence: a week of vacation leaves no hours, and work in it is an overload', () => {
  const r = W.computeWorkload(base({
    absences: [{ userId: 'a', start: MON, end: '2027-04-09' }],
    cards: [{ _id: 'c', assignees: ['a'], dueAt: '2027-04-09', estimatedHours: 2 }],
  }));
  assert.equal(week(r).capacityHours, 0);
  assert.equal(week(r).absentDays, 5);
  assert.equal(week(r).overloaded, true);
  assert.equal(week(r).utilization, null, 'no percentage of zero hours');
});

test('absence: work is moved to the days the person is there', () => {
  // Off Monday-Wednesday; a card spanning the week lands on Thursday and Friday.
  const r = W.computeWorkload(base({
    absences: [{ userId: 'a', start: MON, end: '2027-04-07' }],
    cards: [{ _id: 'c', assignees: ['a'], startAt: MON, dueAt: '2027-04-09', estimatedHours: 15 }],
  }));
  assert.equal(week(r).capacityHours, 15);
  assert.equal(week(r).loadHours, 15);
  assert.equal(week(r).utilization, 100);
  assert.equal(week(r).overloaded, false);
});

test("absence: another person's absence does not change anybody else", () => {
  const r = W.computeWorkload(base({ people: [{ userId: 'a' }, { userId: 'b' }], absences: [{ userId: 'b', start: MON, end: MON }] }));
  assert.equal(week(r, 'a').capacityHours, 37.5);
  assert.equal(week(r, 'b').capacityHours, 30);
});

test('holiday: a public holiday takes a day from everyone', () => {
  const r = W.computeWorkload(base({ people: [{ userId: 'a' }, { userId: 'b' }], holidays: [{ date: '2027-04-06' }] }));
  assert.equal(week(r, 'a').capacityHours, 30);
  assert.equal(week(r, 'b').holidayDays, 1);
});

test('negative: an absence or holiday that is not a real period is refused', () => {
  assert.throws(() => W.normalizeAbsence({ start: '2027-04-09', end: '2027-04-05' }), /not be before/);
  assert.throws(() => W.normalizeAbsence({ start: MON, end: MON, type: 'party' }), /absence type/);
  assert.throws(() => W.normalizeAbsence({ start: MON, end: '2035-01-01' }), /too long/);
  assert.throws(() => W.normalizeHoliday({ date: '2027-13-01' }), /Invalid calendar date/);
  assert.deepEqual(W.normalizeAbsence({ start: MON, end: MON }), { start: MON, end: MON, type: 'vacation', note: '' });
});

test('allocation: 50 % of April on board X shows as 50 % in each of its weeks', () => {
  const r = W.computeWorkload(base({ weeks: 2, allocations: [
    W.normalizeAllocation({ userId: 'a', start: '2027-04-01', end: '2027-04-30', percent: 50 }),
  ] }));
  assert.equal(week(r, 'a', 0).allocationPercent, 50);
  assert.equal(week(r, 'a', 0).allocatedHours, 18.75);
  assert.equal(week(r, 'a', 1).allocationPercent, 50);
});

test('allocation: promising more than 100 % over boards is an overload, even with no cards', () => {
  const r = W.computeWorkload(base({ allocations: [
    { boardId: 'x', userId: 'a', start: MON, end: '2027-04-09', percent: 60 },
    { boardId: 'y', userId: 'a', start: MON, end: '2027-04-09', percent: 50 },
  ] }));
  assert.equal(week(r).allocationPercent, 110);
  assert.equal(week(r).overloaded, true);
});

test('allocation: one that covers part of a week counts its share of the working days', () => {
  const r = W.computeWorkload(base({ allocations: [{ boardId: 'x', userId: 'a', start: '2027-04-08', end: '2027-04-20', percent: 100 }] }));
  assert.equal(week(r).allocationPercent, 40, 'Thursday and Friday of five days');
});

test('placeholder: "1 developer and 1 designer next month" is planned before anyone is named', () => {
  const r = W.computeWorkload(base({ people: [], allocations: [
    W.normalizeAllocation({ roleName: 'Developer', start: MON, end: '2027-04-30', percent: 100 }),
    W.normalizeAllocation({ roleName: 'Designer', start: MON, end: '2027-04-30', percent: 50, headcount: 2 }),
  ] }));
  assert.deepEqual(r.placeholders.map(p => [p.roleName, p.headcount, p.weeks[0].allocationPercent, p.weeks[0].demandHours]),
    [['Developer', 1, 100, 37.5], ['Designer', 2, 50, 37.5]]);
});

test('negative: an allocation names a person or a role, for 1-100 %', () => {
  assert.throws(() => W.normalizeAllocation({ start: MON, end: MON, percent: 50 }), /person or a role/);
  assert.throws(() => W.normalizeAllocation({ userId: 'a', start: MON, end: MON, percent: 0 }), /between 1 and 100/);
  assert.throws(() => W.normalizeAllocation({ userId: 'a', start: MON, end: MON, percent: 150 }), /between 1 and 100/);
  assert.throws(() => W.normalizeAllocation({ roleName: 'Dev', start: MON, end: MON, percent: 50, headcount: 0 }), /Headcount/);
  assert.equal(W.normalizeAllocation({ userId: 'a', start: MON, end: MON, percent: 50, headcount: 9 }).headcount, 1,
    'a named person is one person');
});

test('negative: the report refuses more than 26 weeks', () => {
  assert.throws(() => W.computeWorkload(base({ weeks: 27 })), /between 1 and 26/);
  assert.throws(() => W.computeWorkload(base({ weeks: 0 })), /between 1 and 26/);
});

const V = require('../models/lib/workloadView.js');

test('view: an overloaded week is red, its bar full and its percent shown, in hours and in points', () => {
  const over = { capacityHours: 37.5, loadHours: 40, loadPoints: 8, utilization: 107, overloaded: true, underloaded: false, allocationPercent: 0 };
  assert.deepEqual(V.workloadCell(over, 'hours'), { state: 'is-over', barWidth: 100, value: '40 / 37.5 h', percentLabel: '107 %', allocationPercent: 0, absentDays: 0, holidayDays: 0 });
  assert.equal(V.workloadCell(over, 'points').state, 'is-over', 'the colour does not depend on the unit shown');
  assert.equal(V.workloadCell(over, 'points').value, '8 pt');
});

test('view: within capacity is green, under half is grey-blue; an absence with work shows infinity', () => {
  assert.equal(V.workloadCell({ capacityHours: 37.5, loadHours: 30, utilization: 80, overloaded: false, underloaded: false }).state, 'is-ok');
  assert.equal(V.workloadCell({ capacityHours: 37.5, loadHours: 30, utilization: 80 }).barWidth, 80);
  assert.equal(V.workloadCell({ capacityHours: 37.5, loadHours: 2, utilization: 5, underloaded: true }).state, 'is-under');
  const absent = V.workloadCell({ capacityHours: 0, loadHours: 2, utilization: null, overloaded: true });
  assert.deepEqual([absent.state, absent.barWidth, absent.percentLabel], ['is-over', 100, '∞ %']);
});

test('view: ISO week numbers', () => {
  assert.equal(V.isoWeekNumber('2027-04-05'), 14);
  assert.equal(V.isoWeekNumber('2026-12-28'), 53);
  assert.equal(V.isoWeekNumber('2027-01-04'), 1);
});

test('utilization: billable hours logged against the hours a person has, and the target', () => {
  const r = W.computeWorkload({
    from: '2027-04-05', weeks: 2, today: '2027-04-05',
    people: [{ userId: 'u', capacity: { hoursPerWeek: 40, utilizationTarget: 75 } }],
    timeEntries: [
      { userId: 'u', date: '2027-04-05', hours: 20, billable: true },
      { userId: 'u', date: '2027-04-06', hours: 10, billable: false },
      { userId: 'u', date: '2027-04-13', hours: 30 },
      { userId: 'other', date: '2027-04-13', hours: 99 },
      { userId: 'u', date: '2027-05-01', hours: 99 },
    ],
  });
  const p = r.people[0];
  assert.deepEqual(p.weeks.map(w => [w.loggedHours, w.billableHours, w.billablePercent]), [[30, 20, 50], [30, 30, 75]]);
  assert.equal(p.billablePercent, 63, '50 of 80 hours');
  assert.equal(p.belowTarget, true);
  assert.equal(p.loggedHours, 60, 'not somebody else\'s, not outside the weeks');
});

test('skills: a placeholder lists the people with the skill, the most free hours first', () => {
  const r = W.computeWorkload({
    from: '2027-04-05', weeks: 1, today: '2027-04-05',
    people: [
      { userId: 'busy', capacity: { hoursPerWeek: 40, skills: [{ name: 'React', level: 5 }] } },
      { userId: 'free', capacity: { hoursPerWeek: 40, skills: [{ name: 'react', level: 3 }] } },
      { userId: 'junior', capacity: { hoursPerWeek: 40, skills: [{ name: 'React', level: 1 }] } },
      { userId: 'none', capacity: { hoursPerWeek: 40 } },
    ],
    cards: [{ _id: 'c', assignees: ['busy'], estimatedHours: 30, startAt: '2027-04-05', dueAt: '2027-04-09' }],
    allocations: [{ _id: 'a', boardId: 'b', roleName: 'Developer', skill: 'React', skillLevel: 2, start: '2027-04-05', end: '2027-04-09', percent: 50 }],
  });
  assert.deepEqual(r.placeholders[0].candidates, [{ userId: 'free', level: 3, freeHours: 40 }, { userId: 'busy', level: 5, freeHours: 10 }],
    'case does not matter; a level below the one needed does not fit; somebody without the skill is not listed');
  assert.deepEqual(W.normalizeAllocation({ roleName: 'x', start: '2027-01-01', end: '2027-01-02', percent: 10 }).skill, '');
});

test('negative: skills and the utilization target are validated', () => {
  assert.deepEqual(W.parseSkills('React 4, Go,  Finnish 5 ,, C 9'), [{ name: 'React', level: 4 }, { name: 'Go', level: 3 },
    { name: 'Finnish', level: 5 }, { name: 'C 9', level: 3 }], 'a level is 1 to 5; anything else is part of the name');
  assert.equal(W.skillsText(W.parseSkills('React 4, Go')), 'React 4, Go 3');
  assert.deepEqual(W.normalizeSkills([{ name: 'Go', level: 4 }, { name: 'go', level: 1 }]), [{ name: 'Go', level: 4 }], 'one of each');
  assert.throws(() => W.normalizeSkills([{ name: '', level: 3 }]), /has a name/);
  assert.throws(() => W.normalizeSkills([{ name: 'Go', level: 6 }]), /1 to 5/);
  assert.throws(() => W.normalizeSkills([{ name: 'Go', years: 6 }]), /Unsupported/);
  assert.throws(() => W.normalizeSkills(Array.from({ length: 31 }, (_, i) => ({ name: `s${i}` }))), /At most 30/);
  assert.throws(() => W.normalizeCapacity({ utilizationTarget: 101 }), /utilization target/);
  assert.throws(() => W.normalizeAllocation({ roleName: 'x', start: '2027-01-01', end: '2027-01-02', percent: 10, skillLevel: 0 }), /1 to 5/);
  assert.deepEqual(W.capacityOf({ _id: 'x', userId: 'u', hoursPerWeek: 30, workPercent: 100, workingDays: [1] }).hoursPerWeek, 30,
    'a stored document, with its own fields, still reads as a capacity');
});

test('a refresh after a save keeps the planning form (the spinner is only for the first load)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const js = fs.readFileSync(path.join(__dirname, '..', 'client', 'components', 'main', 'workload.js'), 'utf8');
  const jade = fs.readFileSync(path.join(__dirname, '..', 'client', 'components', 'main', 'workload.jade'), 'utf8');
  // The form sits under the spinner's else, so a spinner on every reload
  // destroyed it - the "saved" note never showed (workload-capacity.e2e.js).
  assert.match(jade, /if loading[\s\S]*else[\s\S]*\+workloadPlanning/);
  assert.match(js, /return tpl\.loading\.get\(\) && !tpl\.report\.get\(\);/);
  // Negative: the helper that hid the page on every reload is gone.
  assert.doesNotMatch(js, /loading: \(\) => Template\.instance\(\)\.loading\.get\(\)/);
});

console.log(`\nworkload: ${passed} tests passed`);
