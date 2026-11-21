'use strict';

// Workload and capacity (docs/Features/Workload/Workload.md): how much work the
// people on a set of boards have, week by week, against the hours they have.
//
// Pure - no Meteor, no database - so every rule here is tested as arithmetic
// (tests/workload.test.cjs) and the server method that reads the data
// (server/workload.js) only gathers inputs and returns this module's answer.
//
// Days are UTC calendar days written 'YYYY-MM-DD'; a week starts on Monday;
// weekdays are ISO numbers, 1 = Monday ... 7 = Sunday.

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CAPACITY = Object.freeze({ hoursPerWeek: 37.5, workPercent: 100, workingDays: [1, 2, 3, 4, 5] });
const ABSENCE_TYPES = Object.freeze(['vacation', 'sick', 'holiday', 'training', 'other']);
const MAX_WEEKS = 26;
const MAX_HOURS = 10000;
const MAX_SPAN_DAYS = 3 * 366;
const EPSILON = 1e-9;

function fail(message) { throw new Error(message); }

// ---------------------------------------------------------------- days

function dayKey(value) {
  // No date is no day - `new Date(null)` would be 1970-01-01.
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function parseDay(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? dayKey(value) : fail('Invalid date');
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)) fail('Use a date written YYYY-MM-DD');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) fail('Invalid calendar date');
  return value;
}

function addDays(day, n) { return dayKey(new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS)); }
function daysBetween(a, b) { return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS); }
function isoWeekday(day) { const d = new Date(`${day}T00:00:00Z`).getUTCDay(); return d === 0 ? 7 : d; }
function weekStart(day) { return addDays(day, 1 - isoWeekday(day)); }

// ---------------------------------------------------------------- input rules

function number(value, min, max, message) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(message);
  return value;
}

function plainObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Expected an object');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`Unsupported field: ${key}`);
  return value;
}

function text(value, max, message) {
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) fail(message);
  return value.trim();
}

// A person's own working time: 37.5 h a week, part-time 60 %, Monday to Friday.
function normalizeCapacity(value) {
  const v = plainObject(value, ['hoursPerWeek', 'workPercent', 'workingDays']);
  const workingDays = v.workingDays === undefined ? [...DEFAULT_CAPACITY.workingDays] : v.workingDays;
  if (!Array.isArray(workingDays) || workingDays.length > 7) fail('Invalid working days');
  const days = [...new Set(workingDays.map(d => (Number.isInteger(d) && d >= 1 && d <= 7 ? d : fail('Invalid working days'))))].sort();
  return {
    hoursPerWeek: v.hoursPerWeek === undefined ? DEFAULT_CAPACITY.hoursPerWeek
      : number(v.hoursPerWeek, 0, 168, 'Hours per week must be between 0 and 168'),
    workPercent: v.workPercent === undefined ? DEFAULT_CAPACITY.workPercent
      : number(v.workPercent, 0, 100, 'Work percent must be between 0 and 100'),
    workingDays: days,
  };
}

function capacityOf(value) {
  try { return value ? normalizeCapacity(value) : { ...DEFAULT_CAPACITY, workingDays: [...DEFAULT_CAPACITY.workingDays] }; } catch (e) {
    return { ...DEFAULT_CAPACITY, workingDays: [...DEFAULT_CAPACITY.workingDays] };
  }
}

function dateRange(value) {
  const start = parseDay(value.start);
  const end = parseDay(value.end);
  if (end < start) fail('The end must not be before the start');
  if (daysBetween(start, end) > MAX_SPAN_DAYS) fail('The period is too long');
  return { start, end };
}

// A leave or absence of one person, inclusive of both days.
function normalizeAbsence(value) {
  const v = plainObject(value, ['start', 'end', 'type', 'note']);
  const type = v.type === undefined ? 'vacation' : v.type;
  if (!ABSENCE_TYPES.includes(type)) fail('Invalid absence type');
  return { ...dateRange(v), type, note: v.note === undefined ? '' : text(v.note, 200, 'The note is too long') };
}

// A public holiday: one day off for everyone.
function normalizeHoliday(value) {
  const v = plainObject(value, ['date', 'name']);
  return { date: parseDay(v.date), name: text(v.name === undefined ? '' : v.name, 100, 'The name is too long') };
}

// "Person A works on board X 50 % of their time in April", or, with no person
// yet, "board X needs 1 developer and 1 designer next month" (a placeholder).
function normalizeAllocation(value) {
  const v = plainObject(value, ['userId', 'roleName', 'start', 'end', 'percent', 'headcount']);
  const userId = v.userId === undefined || v.userId === null || v.userId === '' ? null
    : text(v.userId, 100, 'Invalid person');
  const roleName = v.roleName === undefined ? '' : text(v.roleName, 100, 'The role is too long');
  if (!userId && !roleName) fail('Name a person or a role');
  return {
    userId,
    roleName,
    ...dateRange(v),
    percent: number(v.percent, 1, 100, 'Allocation must be between 1 and 100 %'),
    headcount: userId ? 1 : (v.headcount === undefined ? 1 : number(v.headcount, 1, 100, 'Headcount must be between 1 and 100')),
  };
}

// ---------------------------------------------------------------- capacity

function holidaySet(holidays) {
  return new Set((holidays || []).map(h => h && h.date).filter(Boolean));
}

function absentDays(absences, userId) {
  const days = new Set();
  for (const a of absences || []) {
    if (!a || a.userId !== userId) continue;
    let day = a.start;
    for (let i = 0; i <= MAX_SPAN_DAYS && day <= a.end; i += 1, day = addDays(day, 1)) days.add(day);
  }
  return days;
}

// The hours a person has on one day: their weekly hours, times their work
// percent, shared over their working days - none on a holiday or an absence.
function dayCapacity(capacity, day, holidays, absent) {
  if (!capacity.workingDays.includes(isoWeekday(day))) return 0;
  if (holidays.has(day) || absent.has(day)) return 0;
  return (capacity.hoursPerWeek * capacity.workPercent / 100) / capacity.workingDays.length;
}

// ---------------------------------------------------------------- cards

// The hours still to do on a card: its estimate less the time spent, never
// below zero. null when the card has no estimate in hours.
function remainingHours(card) {
  const estimate = card.estimatedHours;
  if (typeof estimate !== 'number' || !Number.isFinite(estimate) || estimate < 0) return null;
  const spent = typeof card.spentTime === 'number' && Number.isFinite(card.spentTime) && card.spentTime > 0 ? card.spentTime : 0;
  return Math.max(estimate - spent, 0);
}

function isCardDone(card) {
  return card.dueComplete === true || card.archived === true;
}

// Who carries a card: its assignees, or - when it has none - its members.
function cardPeople(card) {
  const assignees = (card.assignees || []).filter(Boolean);
  return [...new Set(assignees.length ? assignees : (card.members || []).filter(Boolean))];
}

// The days a card's work is spread over, or null when it has no dates.
// A card whose dates are past is overdue: its remaining work is due now, today.
function cardSpan(card, today) {
  const start = dayKey(card.startAt || card.receivedAt || null);
  const end = dayKey(card.dueAt || card.endAt || null);
  if (!start && !end) return null;
  let first = start || end;
  let last = end || start;
  if (last < first) [first, last] = [last, first];
  if (last < today) return { first: today, last: today, overdue: true };
  if (first < today) first = today;
  return { first, last, overdue: false };
}

// ---------------------------------------------------------------- report

function emptyWeek(start) {
  return {
    start, capacityHours: 0, loadHours: 0, loadPoints: 0, allocationPercent: 0, allocatedHours: 0,
    absentDays: 0, holidayDays: 0, utilization: 0, overloaded: false, underloaded: false, cards: [],
  };
}

function finishWeek(week) {
  const round = n => Math.round(n * 100) / 100;
  week.capacityHours = round(week.capacityHours);
  week.loadHours = round(week.loadHours);
  week.loadPoints = round(week.loadPoints);
  week.allocatedHours = round(week.allocatedHours);
  week.allocationPercent = Math.round(week.allocationPercent);
  week.utilization = week.capacityHours > 0 ? Math.round(week.loadHours / week.capacityHours * 100)
    : (week.loadHours > 0 ? null : 0);
  // Over 100 %: more hours than the person has, or more of them promised to
  // boards than they work. A week with work and no hours at all is over too.
  week.overloaded = week.loadHours > week.capacityHours + EPSILON || week.allocationPercent > 100
    || (week.capacityHours === 0 && week.loadHours > 0);
  // Under half full, with hours to give: someone who could take more.
  week.underloaded = !week.overloaded && week.capacityHours > 0 && week.loadHours < week.capacityHours * 0.5
    && week.allocationPercent < 50;
  week.cards = week.cards
    .map(c => ({ ...c, hours: round(c.hours), points: round(c.points) }))
    .sort((a, b) => b.hours - a.hours || b.points - a.points);
  return week;
}

/**
 * The workload of `people` over `weeks` weeks from the Monday of `from`.
 *
 * @param {Object} input
 * @param {string} input.from      a day; the report starts on its Monday
 * @param {number} input.weeks     1..26
 * @param {string} input.today     the day work cannot be scheduled before
 * @param {Array}  input.people    [{ userId, capacity }]
 * @param {Array}  input.cards     [{ _id, boardId, title, assignees, members, startAt, receivedAt,
 *                                    dueAt, endAt, dueComplete, archived, estimatedHours, spentTime, points }]
 * @param {Array}  input.absences  [{ userId, start, end }]
 * @param {Array}  input.holidays  [{ date }]
 * @param {Array}  input.allocations [{ _id, boardId, userId|null, roleName, start, end, percent, headcount }]
 */
function computeWorkload(input) {
  const weeks = Math.floor(number(input.weeks, 1, MAX_WEEKS, `Weeks must be between 1 and ${MAX_WEEKS}`));
  const first = weekStart(parseDay(input.from));
  const last = addDays(first, weeks * 7 - 1);
  const today = parseDay(input.today);
  const weekIndex = day => Math.floor(daysBetween(first, day) / 7);
  const inWindow = day => day >= first && day <= last;
  const holidays = holidaySet(input.holidays);
  const weekStarts = Array.from({ length: weeks }, (_, i) => addDays(first, i * 7));

  const people = new Map();
  for (const p of input.people || []) {
    if (!p || !p.userId || people.has(p.userId)) continue;
    const capacity = capacityOf(p.capacity);
    const absent = absentDays(input.absences, p.userId);
    const row = { userId: p.userId, capacity, weeks: weekStarts.map(emptyWeek), unscheduledHours: 0,
      unscheduledPoints: 0, unestimatedCards: 0, overdueCards: 0, days: new Map() };
    for (let day = first; day <= last; day = addDays(day, 1)) {
      const hours = dayCapacity(capacity, day, holidays, absent);
      row.days.set(day, hours);
      const week = row.weeks[weekIndex(day)];
      week.capacityHours += hours;
      if (capacity.workingDays.includes(isoWeekday(day))) {
        if (holidays.has(day)) week.holidayDays += 1;
        else if (absent.has(day)) week.absentDays += 1;
      }
    }
    people.set(p.userId, row);
  }

  const unassigned = { weeks: weekStarts.map(emptyWeek), unscheduledHours: 0, unscheduledPoints: 0 };

  for (const card of input.cards || []) {
    if (!card || isCardDone(card)) continue;
    const hours = remainingHours(card);
    const points = typeof card.points === 'number' && Number.isFinite(card.points) && card.points >= 0 ? card.points : null;
    const carriers = cardPeople(card).filter(id => people.has(id));
    const span = cardSpan(card, today);
    if (!carriers.length) {
      // Work nobody in the report carries: shown once, as unassigned.
      if (cardPeople(card).length) continue;
      if (hours === null && points === null) continue;
      if (!span) { unassigned.unscheduledHours += hours || 0; unassigned.unscheduledPoints += points || 0; continue; }
      const days = [];
      for (let d = span.first; d <= span.last && days.length <= MAX_SPAN_DAYS; d = addDays(d, 1)) days.push(d);
      const share = 1 / days.length;
      for (const d of days) {
        if (!inWindow(d)) continue;
        const week = unassigned.weeks[weekIndex(d)];
        week.loadHours += (hours || 0) * share;
        week.loadPoints += (points || 0) * share;
      }
      continue;
    }
    const perPersonHours = hours === null ? 0 : hours / carriers.length;
    const perPersonPoints = points === null ? 0 : points / carriers.length;
    for (const userId of carriers) {
      const row = people.get(userId);
      if (hours === null && points === null) { row.unestimatedCards += 1; continue; }
      if (!span) { row.unscheduledHours += perPersonHours; row.unscheduledPoints += perPersonPoints; continue; }
      if (span.overdue) row.overdueCards += 1;
      // Spread over the days of the span the person works, in proportion to
      // their hours that day. With no working day in it, all of it falls on
      // the last day - work due on a day off is still work due.
      const days = [];
      for (let d = span.first; d <= span.last && days.length <= MAX_SPAN_DAYS; d = addDays(d, 1)) days.push(d);
      const weightOf = d => (row.days.has(d) ? row.days.get(d) : dayCapacity(row.capacity, d, holidays, absentDays(input.absences, userId)));
      const weights = days.map(weightOf);
      const total = weights.reduce((s, w) => s + w, 0);
      const shares = total > 0 ? weights.map(w => w / total) : days.map((d, i) => (i === days.length - 1 ? 1 : 0));
      const byWeek = new Map();
      days.forEach((d, i) => {
        if (!inWindow(d) || shares[i] === 0) return;
        const w = weekIndex(d);
        const sum = byWeek.get(w) || { hours: 0, points: 0 };
        sum.hours += perPersonHours * shares[i];
        sum.points += perPersonPoints * shares[i];
        byWeek.set(w, sum);
      });
      for (const [w, sum] of byWeek) {
        const week = row.weeks[w];
        week.loadHours += sum.hours;
        week.loadPoints += sum.points;
        week.cards.push({ cardId: card._id, boardId: card.boardId, title: card.title || '', hours: sum.hours,
          points: sum.points, overdue: span.overdue });
      }
    }
  }

  // Allocations: the share of each week's working days a promise covers.
  const placeholders = [];
  for (const a of input.allocations || []) {
    if (!a || a.end < first || a.start > last) continue;
    const row = a.userId ? people.get(a.userId) : null;
    if (a.userId && !row) continue;
    const capacity = row ? row.capacity : capacityOf(null);
    const holder = row ? null : {
      allocationId: a._id || null, boardId: a.boardId, roleName: a.roleName, headcount: a.headcount || 1,
      weeks: weekStarts.map(start => ({ start, allocationPercent: 0, demandHours: 0 })),
    };
    for (let w = 0; w < weeks; w += 1) {
      let working = 0;
      let covered = 0;
      let coveredHours = 0;
      for (let i = 0; i < 7; i += 1) {
        const day = addDays(weekStarts[w], i);
        if (!capacity.workingDays.includes(isoWeekday(day))) continue;
        working += 1;
        if (day >= a.start && day <= a.end) {
          covered += 1;
          coveredHours += row ? row.days.get(day) : dayCapacity(capacity, day, holidays, new Set());
        }
      }
      if (!covered) continue;
      const percent = a.percent * covered / working;
      if (row) {
        row.weeks[w].allocationPercent += percent;
        row.weeks[w].allocatedHours += coveredHours * a.percent / 100;
      } else {
        holder.weeks[w].allocationPercent += percent;
        holder.weeks[w].demandHours += coveredHours * a.percent / 100 * (a.headcount || 1);
      }
    }
    if (holder) {
      holder.weeks.forEach(week => {
        week.allocationPercent = Math.round(week.allocationPercent);
        week.demandHours = Math.round(week.demandHours * 100) / 100;
      });
      placeholders.push(holder);
    }
  }

  const round = n => Math.round(n * 100) / 100;
  return {
    from: first,
    to: last,
    weeks: weekStarts,
    people: [...people.values()].map(row => ({
      userId: row.userId,
      capacity: row.capacity,
      weeks: row.weeks.map(finishWeek),
      unscheduledHours: round(row.unscheduledHours),
      unscheduledPoints: round(row.unscheduledPoints),
      unestimatedCards: row.unestimatedCards,
      overdueCards: row.overdueCards,
    })),
    unassigned: {
      weeks: unassigned.weeks.map(w => ({ start: w.start, loadHours: round(w.loadHours), loadPoints: round(w.loadPoints) })),
      unscheduledHours: round(unassigned.unscheduledHours),
      unscheduledPoints: round(unassigned.unscheduledPoints),
    },
    placeholders,
  };
}

module.exports = {
  DEFAULT_CAPACITY, ABSENCE_TYPES, MAX_WEEKS, MAX_HOURS,
  dayKey, parseDay, addDays, isoWeekday, weekStart,
  normalizeCapacity, normalizeAbsence, normalizeHoliday, normalizeAllocation, capacityOf,
  remainingHours, cardPeople, cardSpan, computeWorkload,
};
