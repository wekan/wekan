'use strict';
(async () => {

// Unit + negative tests for GitHub issues #3818 ("Trello-like daily-checklist")
// and #4729 ("Timed Reset on Boards"): a checklist can automatically uncheck
// all of its items on a recurring schedule (daily/weekly/monthly).
// Run: node tests/checklistResetSchedule.test.cjs

const assert = require('assert');
const {
  CHECKLIST_RESET_INTERVALS,
  computeNextResetAt,
  isChecklistResetDue,
  selectChecklistsDueForReset,
  selectItemIdsToUncheck,
} = await import('../models/lib/checklistResetSchedule.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const DAY_MS = 24 * 60 * 60 * 1000;

// ── computeNextResetAt ──────────────────────────────────────────────────────

check('#3818/#4729: daily interval advances by exactly 24 hours', () => {
  const from = new Date('2026-01-01T00:00:00Z');
  const next = computeNextResetAt(from, 'daily');
  assert.strictEqual(next.getTime() - from.getTime(), DAY_MS);
});

check('#3818/#4729: weekly interval advances by exactly 7 days', () => {
  const from = new Date('2026-01-01T00:00:00Z');
  const next = computeNextResetAt(from, 'weekly');
  assert.strictEqual(next.getTime() - from.getTime(), 7 * DAY_MS);
});

check('#3818/#4729: monthly interval advances by a calendar month, not ~30 days', () => {
  // Jan 31 + 1 calendar month must not silently become an earlier date every
  // few months the way a fixed 30-day span would.
  const from = new Date('2026-01-31T12:00:00Z');
  const next = computeNextResetAt(from, 'monthly');
  assert.strictEqual(next.getUTCMonth(), 2); // JS rolls Feb 31 forward to March 3
});

check('#3818/#4729: "none" interval has no next reset', () => {
  assert.strictEqual(computeNextResetAt(new Date(), 'none'), null);
});

check('#3818/#4729: unknown interval has no next reset (negative)', () => {
  assert.strictEqual(computeNextResetAt(new Date(), 'yearly'), null);
});

check('#3818/#4729: missing fromDate has no next reset (negative)', () => {
  assert.strictEqual(computeNextResetAt(null, 'daily'), null);
  assert.strictEqual(computeNextResetAt(undefined, 'daily'), null);
});

// ── isChecklistResetDue ──────────────────────────────────────────────────────

check('#3818/#4729: daily checklist is due once 24h have passed since lastResetAt', () => {
  const now = new Date('2026-03-10T12:00:00Z');
  const checklist = {
    resetInterval: 'daily',
    lastResetAt: new Date('2026-03-09T11:59:00Z'),
  };
  assert.strictEqual(isChecklistResetDue(checklist, now), true);
});

check('#3818/#4729: daily checklist is NOT due before 24h have passed (negative)', () => {
  const now = new Date('2026-03-10T12:00:00Z');
  const checklist = {
    resetInterval: 'daily',
    lastResetAt: new Date('2026-03-10T00:00:00Z'),
  };
  assert.strictEqual(isChecklistResetDue(checklist, now), false);
});

check('#3818/#4729: falls back to createdAt when the checklist was never reset', () => {
  const now = new Date('2026-03-10T12:00:00Z');
  const checklist = {
    resetInterval: 'weekly',
    createdAt: new Date('2026-03-01T00:00:00Z'),
  };
  assert.strictEqual(isChecklistResetDue(checklist, now), true);
});

check('#3818/#4729: "none" checklists are never due (negative)', () => {
  const now = new Date('2030-01-01T00:00:00Z');
  const checklist = { resetInterval: 'none', lastResetAt: new Date('2000-01-01') };
  assert.strictEqual(isChecklistResetDue(checklist, now), false);
});

check('#3818/#4729: a checklist with no resetInterval field at all is never due (negative)', () => {
  const now = new Date('2030-01-01T00:00:00Z');
  assert.strictEqual(isChecklistResetDue({ lastResetAt: new Date('2000-01-01') }, now), false);
});

check('#3818/#4729: null/undefined checklist is never due (negative)', () => {
  assert.strictEqual(isChecklistResetDue(null), false);
  assert.strictEqual(isChecklistResetDue(undefined), false);
});

check('#3818/#4729: monthly checklist due after a calendar month, not just 28-29 days', () => {
  const from = new Date('2026-01-31T00:00:00Z');
  const checklist = { resetInterval: 'monthly', lastResetAt: from };
  // 28 days later (still February) must not be due yet.
  assert.strictEqual(
    isChecklistResetDue(checklist, new Date('2026-02-27T00:00:00Z')),
    false,
  );
  // Once the calendar month has actually elapsed, it is due.
  assert.strictEqual(
    isChecklistResetDue(checklist, new Date('2026-03-05T00:00:00Z')),
    true,
  );
});

check('#3818/#4729: CHECKLIST_RESET_INTERVALS covers none + at least three schedules', () => {
  assert.ok(CHECKLIST_RESET_INTERVALS.includes('none'));
  assert.ok(CHECKLIST_RESET_INTERVALS.includes('daily'));
  assert.ok(CHECKLIST_RESET_INTERVALS.includes('weekly'));
  assert.ok(CHECKLIST_RESET_INTERVALS.includes('monthly'));
  assert.strictEqual(CHECKLIST_RESET_INTERVALS.length, 4);
});

// ── selectChecklistsDueForReset (the scheduled job's scan step) ────────────

check('#3818/#4729: selects only the due checklists out of a mixed set', () => {
  const now = new Date('2026-03-10T00:00:00Z');
  const checklists = [
    { _id: 'c-due-daily', resetInterval: 'daily', lastResetAt: new Date('2026-03-08T00:00:00Z') },
    { _id: 'c-not-due-daily', resetInterval: 'daily', lastResetAt: new Date('2026-03-09T23:00:00Z') },
    { _id: 'c-none', resetInterval: 'none', lastResetAt: new Date('2000-01-01') },
    { _id: 'c-due-monthly', resetInterval: 'monthly', lastResetAt: new Date('2026-01-01T00:00:00Z') },
  ];
  const due = selectChecklistsDueForReset(checklists, now);
  const dueIds = due.map(c => c._id).sort();
  assert.deepStrictEqual(dueIds, ['c-due-daily', 'c-due-monthly']);
});

check('#3818/#4729: empty/missing checklist list selects nothing (negative)', () => {
  assert.deepStrictEqual(selectChecklistsDueForReset([]), []);
  assert.deepStrictEqual(selectChecklistsDueForReset(undefined), []);
});

// ── selectItemIdsToUncheck (the reset action itself) ────────────────────────

check('#3818/#4729: resetting a checklist unchecks all of ITS checked items', () => {
  const checklist = { _id: 'checklist-A' };
  const items = [
    { _id: 'item-1', checklistId: 'checklist-A', isFinished: true },
    { _id: 'item-2', checklistId: 'checklist-A', isFinished: true },
    { _id: 'item-3', checklistId: 'checklist-A', isFinished: false },
  ];
  const toUncheck = selectItemIdsToUncheck(checklist, items).sort();
  assert.deepStrictEqual(toUncheck, ['item-1', 'item-2']);
});

check('#3818/#4729: never touches another checklist\'s items (negative)', () => {
  const checklist = { _id: 'checklist-A' };
  const items = [
    { _id: 'item-1', checklistId: 'checklist-A', isFinished: true },
    { _id: 'other-item', checklistId: 'checklist-B', isFinished: true },
  ];
  const toUncheck = selectItemIdsToUncheck(checklist, items);
  assert.deepStrictEqual(toUncheck, ['item-1']);
  assert.ok(!toUncheck.includes('other-item'));
});

check('#3818/#4729: a checklist with nothing checked plans no unchecks (negative)', () => {
  const checklist = { _id: 'checklist-A' };
  const items = [{ _id: 'item-1', checklistId: 'checklist-A', isFinished: false }];
  assert.deepStrictEqual(selectItemIdsToUncheck(checklist, items), []);
});

// ── End-to-end simulation of a scheduled reset, in memory ──────────────────
// Simulates what server/checklistResetSchedule.js's applyChecklistAutoReset()
// does (uncheck the due checklist's items, stamp lastResetAt), using plain
// arrays instead of Mongo so it is testable without Meteor.

check('#3818/#4729: a full scan-and-reset cycle updates only the due checklist and its items', () => {
  const now = new Date('2026-03-10T00:00:00Z');
  const checklists = [
    { _id: 'checklist-due', resetInterval: 'daily', lastResetAt: new Date('2026-03-08T00:00:00Z') },
    { _id: 'checklist-not-due', resetInterval: 'weekly', lastResetAt: new Date('2026-03-09T00:00:00Z') },
  ];
  const items = [
    { _id: 'a1', checklistId: 'checklist-due', isFinished: true },
    { _id: 'a2', checklistId: 'checklist-due', isFinished: true },
    { _id: 'b1', checklistId: 'checklist-not-due', isFinished: true },
  ];

  const due = selectChecklistsDueForReset(checklists, now);
  assert.deepStrictEqual(due.map(c => c._id), ['checklist-due']);

  for (const checklist of due) {
    const idsToUncheck = new Set(selectItemIdsToUncheck(checklist, items));
    for (const item of items) {
      if (idsToUncheck.has(item._id)) item.isFinished = false;
    }
    checklist.lastResetAt = now;
  }

  assert.strictEqual(items.find(i => i._id === 'a1').isFinished, false);
  assert.strictEqual(items.find(i => i._id === 'a2').isFinished, false);
  // The other checklist's item is untouched.
  assert.strictEqual(items.find(i => i._id === 'b1').isFinished, true);
  assert.strictEqual(
    checklists.find(c => c._id === 'checklist-due').lastResetAt.getTime(),
    now.getTime(),
  );
  // The not-due checklist's lastResetAt is unchanged.
  assert.strictEqual(
    checklists.find(c => c._id === 'checklist-not-due').lastResetAt.getTime(),
    new Date('2026-03-09T00:00:00Z').getTime(),
  );
});

console.log(`checklistResetSchedule.test.cjs: ${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });
