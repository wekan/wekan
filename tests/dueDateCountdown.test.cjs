'use strict';

// Regression coverage for GitHub issue #2424: the due-date badge (card
// detail and minicard) shows only a formatted date; this adds a visible
// countdown - "N days left" / "N days overdue" / "Due today" - next to it.
//
// client/lib/dueDateColor.js's dueCountdown() is the pure day-count math
// (no Blaze/DOM), shared by cardDate.js's cardDueDate and minicardDueDate
// badges via a small dueCountdownText() wrapper that looks the phrase up
// with TAPi18n. This pins the pure function directly (arithmetic, no
// server needed) and confirms cardDate.js actually wires it into both
// badges' showDate/showTitle.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

// vm.runInNewContext() objects come from a different realm, so Object
// prototypes differ and assert.deepStrictEqual (used in strict mode by
// require('node:assert/strict')) rejects them despite matching fields.
// Compare the plain shape instead.
const assertCountdown = (actual, expected) =>
  assert.deepStrictEqual({ key: actual.key, days: actual.days }, expected);

function loadDueDateColor() {
  const context = {};
  const source = read('client/lib/dueDateColor.js')
    .replace(/^export function/gm, 'function')
    .concat('\nresult = { dueDateClass, dueCountdown };');
  vm.runInNewContext(source, context);
  return context.result;
}

const { dueCountdown } = loadDueDateColor();

test('dueCountdown: a future due date reports days left', () => {
  const now = new Date(2026, 5, 15, 9, 0, 0); // 2026-06-15 09:00 local
  const due = new Date(2026, 5, 18, 23, 0, 0); // 3 calendar days later
  assertCountdown(dueCountdown(due, now), { key: 'due-days-left', days: 3 });
});

test('dueCountdown: a past due date reports days overdue', () => {
  const now = new Date(2026, 5, 15, 9, 0, 0);
  const due = new Date(2026, 5, 13, 1, 0, 0); // 2 calendar days earlier
  assertCountdown(dueCountdown(due, now), { key: 'due-days-overdue', days: 2 });
});

test('dueCountdown: due later today is "due today", not "0 days left"', () => {
  const now = new Date(2026, 5, 15, 9, 0, 0);
  const due = new Date(2026, 5, 15, 23, 59, 0); // same calendar day, later time
  assertCountdown(dueCountdown(due, now), { key: 'due-today', days: 0 });
});

test('dueCountdown: due earlier today is also "due today"', () => {
  const now = new Date(2026, 5, 15, 22, 0, 0);
  const due = new Date(2026, 5, 15, 6, 0, 0); // same calendar day, earlier time
  assertCountdown(dueCountdown(due, now), { key: 'due-today', days: 0 });
});

test('dueCountdown: exactly one day away rounds to 1, not 0', () => {
  const now = new Date(2026, 5, 15, 23, 0, 0);
  const due = new Date(2026, 5, 16, 1, 0, 0); // 2 hours later, next calendar day
  assertCountdown(dueCountdown(due, now), { key: 'due-days-left', days: 1 });
});

test('cardDate.js wires dueCountdown into the card-detail and minicard due badges', () => {
  const src = read('client/components/cards/cardDate.js');

  assert.match(src, /import \{ dueDateClass, dueCountdown \} from '\/client\/lib\/dueDateColor';/,
    'cardDate.js must import dueCountdown alongside dueDateClass');

  assert.match(src, /function dueCountdownText\(dueDate, nowVal\)/,
    'cardDate.js must have a dueCountdownText() helper turning dueCountdown() into text');

  // cardDueDate and minicardDueDate are both built from CARD_DATE_KINDS.Due,
  // so the countdown is in that one entry's showDate()/showTitle() - which is
  // what both badges render.
  const kinds = src.slice(src.indexOf('const CARD_DATE_KINDS = {'), src.indexOf('\n};', src.indexOf('const CARD_DATE_KINDS = {')));
  const kind = name => {
    const at = kinds.indexOf(`\n  ${name}: {`);
    assert.ok(at !== -1, `CARD_DATE_KINDS has ${name}`);
    const next = kinds.slice(at + 1).search(/\n {2}\w+: \{/);
    return next === -1 ? kinds.slice(at) : kinds.slice(at, at + 1 + next);
  };
  assert.match(kind('Due'), /showDate\(\) \{[\s\S]*dueCountdownText\(/,
    'the due date badges call dueCountdownText()');
  assert.match(src, /for \(const name of \[`card\$\{kind\}Date`, `minicard\$\{kind\}Date`\]\)/,
    'and both the opened-card and the minicard badge are built from it');

  // Negative: the received/start/end date badges must NOT gain a countdown -
  // this is scoped to the due-date badge only (they share the same markup
  // template, dateBadgeBody, but not the same showDate() override).
  for (const name of ['Received', 'Start', 'End']) {
    assert.doesNotMatch(kind(name), /dueCountdownText\(/,
      `${name} must not gain a countdown - only the due-date badge does`);
  }
});

test('en.i18n.json has the three countdown phrases, right after card-due-on, with %s intact', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const keys = Object.keys(en);
  const idx = keys.indexOf('card-due-on');
  assert.ok(idx !== -1, 'card-due-on must exist in en.i18n.json');
  assert.deepStrictEqual(
    keys.slice(idx + 1, idx + 4),
    ['due-today', 'due-days-left', 'due-days-overdue'],
    'the three countdown keys must be inserted right after card-due-on',
  );
  assert.match(en['due-days-left'], /%s/, 'due-days-left must keep the %s day-count placeholder');
  assert.match(en['due-days-overdue'], /%s/, 'due-days-overdue must keep the %s day-count placeholder');
  assert.doesNotMatch(en['due-today'], /%s/, 'due-today takes no count');
});

test('every locale file has the three countdown keys, in the same position, translated (not English)', () => {
  const dataDir = path.join(root, 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const enKeys = Object.keys(en);
  const idx = enKeys.indexOf('card-due-on');
  const expectedSlice = enKeys.slice(idx + 1, idx + 4);

  const locales = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.i18n.json'))
    .filter(f => !/^en(?:[-_]|\.)/.test(f));

  const untouched = [];
  for (const file of locales) {
    const locale = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    const keys = Object.keys(locale);
    const localeIdx = keys.indexOf('card-due-on');
    assert.ok(localeIdx !== -1, `${file}: card-due-on must exist`);
    assert.deepStrictEqual(
      keys.slice(localeIdx + 1, localeIdx + 4),
      expectedSlice,
      `${file}: the three countdown keys must be inserted right after card-due-on, matching English key order`,
    );
    // %s placeholder must survive translation untouched.
    assert.match(locale['due-days-left'], /%s/, `${file}: due-days-left must keep %s`);
    assert.match(locale['due-days-overdue'], /%s/, `${file}: due-days-overdue must keep %s`);

    if (
      locale['due-today'] === en['due-today'] &&
      locale['due-days-left'] === en['due-days-left'] &&
      locale['due-days-overdue'] === en['due-days-overdue']
    ) {
      untouched.push(file);
    }
  }
  assert.deepStrictEqual(untouched, [],
    `these locales still carry the untranslated English placeholder for the countdown keys: ${untouched.join(', ')}`);
});
