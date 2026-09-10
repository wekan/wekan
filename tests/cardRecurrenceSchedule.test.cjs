'use strict';
(async () => {

// Unit + negative tests for the Kanboard-style whole-card recurrence feature:
// a card can automatically spawn a fresh copy of itself, in the same list, on
// a recurring schedule (daily/weekly/monthly) - the same idea as WeKan's
// existing checklist automatic-reset (#3818/#4729), applied to a whole card.
// Run: node tests/cardRecurrenceSchedule.test.cjs

const assert = require('assert');
const {
  CARD_RECURRENCE_INTERVALS,
  computeNextRecurrenceAt,
  isCardRecurrenceDue,
  selectCardsDueForRecurrence,
} = await import('../models/lib/cardRecurrenceSchedule.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const DAY_MS = 24 * 60 * 60 * 1000;

// ── computeNextRecurrenceAt ─────────────────────────────────────────────────

check('card recurrence: daily interval advances by exactly 24 hours', () => {
  const from = new Date('2026-01-01T00:00:00Z');
  const next = computeNextRecurrenceAt(from, 'daily');
  assert.strictEqual(next.getTime() - from.getTime(), DAY_MS);
});

check('card recurrence: weekly interval advances by exactly 7 days', () => {
  const from = new Date('2026-01-01T00:00:00Z');
  const next = computeNextRecurrenceAt(from, 'weekly');
  assert.strictEqual(next.getTime() - from.getTime(), 7 * DAY_MS);
});

check('card recurrence: monthly interval advances by a calendar month, not ~30 days', () => {
  const from = new Date('2026-01-31T12:00:00Z');
  const next = computeNextRecurrenceAt(from, 'monthly');
  assert.strictEqual(next.getUTCMonth(), 2); // JS rolls Feb 31 forward to March 3
});

check('card recurrence: "none" interval has no next occurrence', () => {
  assert.strictEqual(computeNextRecurrenceAt(new Date(), 'none'), null);
});

check('card recurrence: unknown interval has no next occurrence (negative)', () => {
  assert.strictEqual(computeNextRecurrenceAt(new Date(), 'yearly'), null);
});

check('card recurrence: missing fromDate has no next occurrence (negative)', () => {
  assert.strictEqual(computeNextRecurrenceAt(null, 'daily'), null);
  assert.strictEqual(computeNextRecurrenceAt(undefined, 'daily'), null);
});

// ── isCardRecurrenceDue ──────────────────────────────────────────────────────

check('card recurrence: daily card is due once 24h have passed since lastRecurrenceAt', () => {
  const now = new Date('2026-03-10T12:00:00Z');
  const card = {
    recurrenceInterval: 'daily',
    lastRecurrenceAt: new Date('2026-03-09T11:59:00Z'),
  };
  assert.strictEqual(isCardRecurrenceDue(card, now), true);
});

check('card recurrence: daily card is NOT due before 24h have passed (negative)', () => {
  const now = new Date('2026-03-10T12:00:00Z');
  const card = {
    recurrenceInterval: 'daily',
    lastRecurrenceAt: new Date('2026-03-10T00:00:00Z'),
  };
  assert.strictEqual(isCardRecurrenceDue(card, now), false);
});

check('card recurrence: falls back to createdAt when the card never recurred', () => {
  const now = new Date('2026-03-10T12:00:00Z');
  const card = {
    recurrenceInterval: 'weekly',
    createdAt: new Date('2026-03-01T00:00:00Z'),
  };
  assert.strictEqual(isCardRecurrenceDue(card, now), true);
});

check('card recurrence: "none" cards are never due (negative)', () => {
  const now = new Date('2030-01-01T00:00:00Z');
  const card = { recurrenceInterval: 'none', lastRecurrenceAt: new Date('2000-01-01') };
  assert.strictEqual(isCardRecurrenceDue(card, now), false);
});

check('card recurrence: a card with no recurrenceInterval field at all is never due (negative)', () => {
  const now = new Date('2030-01-01T00:00:00Z');
  assert.strictEqual(isCardRecurrenceDue({ lastRecurrenceAt: new Date('2000-01-01') }, now), false);
});

check('card recurrence: null/undefined card is never due (negative)', () => {
  assert.strictEqual(isCardRecurrenceDue(null), false);
  assert.strictEqual(isCardRecurrenceDue(undefined), false);
});

check('card recurrence: an ARCHIVED card never spawns further copies, even if due (negative)', () => {
  const now = new Date('2030-01-01T00:00:00Z');
  const card = {
    recurrenceInterval: 'daily',
    lastRecurrenceAt: new Date('2000-01-01'),
    archived: true,
  };
  assert.strictEqual(isCardRecurrenceDue(card, now), false);
});

check('card recurrence: monthly card due after a calendar month, not just 28-29 days', () => {
  const from = new Date('2026-01-31T00:00:00Z');
  const card = { recurrenceInterval: 'monthly', lastRecurrenceAt: from };
  assert.strictEqual(isCardRecurrenceDue(card, new Date('2026-02-27T00:00:00Z')), false);
  assert.strictEqual(isCardRecurrenceDue(card, new Date('2026-03-05T00:00:00Z')), true);
});

check('card recurrence: CARD_RECURRENCE_INTERVALS covers none + at least three schedules', () => {
  assert.ok(CARD_RECURRENCE_INTERVALS.includes('none'));
  assert.ok(CARD_RECURRENCE_INTERVALS.includes('daily'));
  assert.ok(CARD_RECURRENCE_INTERVALS.includes('weekly'));
  assert.ok(CARD_RECURRENCE_INTERVALS.includes('monthly'));
  assert.strictEqual(CARD_RECURRENCE_INTERVALS.length, 4);
});

// ── selectCardsDueForRecurrence (the scheduled job's scan step) ────────────

check('card recurrence: selects only the due cards out of a mixed set', () => {
  const now = new Date('2026-03-10T00:00:00Z');
  const cards = [
    { _id: 'c-due-daily', recurrenceInterval: 'daily', lastRecurrenceAt: new Date('2026-03-08T00:00:00Z') },
    { _id: 'c-not-due-daily', recurrenceInterval: 'daily', lastRecurrenceAt: new Date('2026-03-09T23:00:00Z') },
    { _id: 'c-none', recurrenceInterval: 'none', lastRecurrenceAt: new Date('2000-01-01') },
    { _id: 'c-due-monthly', recurrenceInterval: 'monthly', lastRecurrenceAt: new Date('2026-01-01T00:00:00Z') },
    { _id: 'c-due-but-archived', recurrenceInterval: 'daily', lastRecurrenceAt: new Date('2026-03-08T00:00:00Z'), archived: true },
  ];
  const due = selectCardsDueForRecurrence(cards, now);
  const dueIds = due.map(c => c._id).sort();
  assert.deepStrictEqual(dueIds, ['c-due-daily', 'c-due-monthly']);
});

check('card recurrence: empty/missing card list selects nothing (negative)', () => {
  assert.deepStrictEqual(selectCardsDueForRecurrence([]), []);
  assert.deepStrictEqual(selectCardsDueForRecurrence(undefined), []);
});

console.log(`cardRecurrenceSchedule.test.cjs: ${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });
