'use strict';

// Pomodoro timer (#4862): the classic FIXED-interval technique - a 25-minute
// work interval, then a break (5 minutes, or a longer break every 4th
// completed work interval), unlike the separate open-ended Flowtime feature
// (#3919, cardFlowtime.js/.jade/.css). This is additive: it sits alongside
// Flowtime in cardDetails.jade with its own fields, its own methods and its
// own template, and reuses the SAME setSpentTime()-based helper the manual
// time-entry popup (cardTime.js) and Flowtime both already use, rather than
// keeping a separate total.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const cardsSrc = read('models/cards.js');

// --- schema fields exist, mirroring the Flowtime fields' shape ---
assert.match(cardsSrc, /pomodoroStartAt: \{[\s\S]{0,220}?type: Date,\s*optional: true,\s*\},/);
assert.match(cardsSrc, /pomodoroPhase: \{[\s\S]{0,220}?type: String,\s*optional: true,\s*allowedValues: \['work', 'break'\],\s*\},/);
assert.match(cardsSrc, /pomodoroCount: \{[\s\S]{0,220}?type: Number,\s*optional: true,\s*defaultValue: 0,\s*\},/);
assert.match(cardsSrc, /pomodoroUserId: \{[\s\S]{0,220}?type: String,\s*optional: true,\s*\},/);
assert.match(cardsSrc, /pomodoroWorkMinutes: \{[\s\S]{0,220}?type: Number,\s*optional: true,\s*defaultValue: 25,\s*\},/);

// --- fields are additive next to Flowtime's, not a rename/repurpose of them ---
assert.match(cardsSrc, /flowStartAt: \{/, 'Flowtime fields must still be present');
assert.match(cardsSrc, /pomodoroStartAt: \{/, 'Pomodoro fields must be their own, separate fields');
assert.notEqual(
  cardsSrc.indexOf('flowStartAt'),
  cardsSrc.indexOf('pomodoroStartAt'),
  'Pomodoro must not reuse/rename a Flowtime field',
);

// --- methods exist and touch the right fields ---
assert.match(cardsSrc, /startPomodoro\(userId, workMinutes\) \{/);
assert.match(cardsSrc, /completePomodoroWorkInterval\(\) \{/);
assert.match(cardsSrc, /completePomodoroBreakInterval\(\) \{/);
assert.match(cardsSrc, /stopPomodoro\(\) \{/);
assert.match(cardsSrc, /isPomodoroActive\(\) \{/);
assert.match(cardsSrc, /getPomodoroBreakMinutes\(\) \{/);

// A completed work interval reuses setSpentTime() - the SAME helper the
// manual time-entry popup and Flowtime already use - rather than a
// duplicate accumulator.
const workIntervalBody = cardsSrc.match(
  /completePomodoroWorkInterval\(\) \{([\s\S]*?)\n  \},/,
)[1];
assert.match(workIntervalBody, /this\.setSpentTime\(/,
  'a completed work interval must add its duration via the existing setSpentTime() helper');
assert.match(workIntervalBody, /pomodoroPhase: 'break'/,
  'a completed work interval must switch the card to the break phase');
assert.match(workIntervalBody, /pomodoroCount: newCount/,
  'a completed work interval must increment the completed-interval count');

// A completed BREAK interval must NOT touch spentTime at all - only the
// work interval adds time.
const breakIntervalBody = cardsSrc.match(
  /completePomodoroBreakInterval\(\) \{([\s\S]*?)\n  \},/,
)[1];
assert.doesNotMatch(breakIntervalBody, /setSpentTime/,
  'completing a break interval must add no time');
assert.match(breakIntervalBody, /pomodoroPhase: null/,
  'completing a break interval must go back to ready-to-start, not auto-start the next work interval');
assert.doesNotMatch(breakIntervalBody, /pomodoroPhase: 'work'/,
  'completing a break interval must not itself start the next work interval');

// stopPomodoro(): credits partial WORK time, adds nothing for a BREAK stop,
// and clears every Pomodoro field back to its empty/null default.
const stopBody = cardsSrc.match(/stopPomodoro\(\) \{([\s\S]*?)\n  \},/)[1];
assert.match(stopBody, /if \(this\.pomodoroPhase === 'work'\) \{/);
assert.match(stopBody, /this\.setSpentTime\(/);
assert.match(stopBody, /pomodoroStartAt: null,/);
assert.match(stopBody, /pomodoroPhase: null,/);
assert.match(stopBody, /pomodoroCount: 0,/);
assert.match(stopBody, /pomodoroUserId: null,/);

// --- the "every 4th completed work interval gets a long break" rule ---
function getPomodoroBreakMinutes(count, BREAK_MINUTES, LONG_BREAK_MINUTES) {
  return count > 0 && count % 4 === 0 ? LONG_BREAK_MINUTES : BREAK_MINUTES;
}
const BREAK = 5;
const LONG_BREAK = 15;
assert.equal(getPomodoroBreakMinutes(0, BREAK, LONG_BREAK), BREAK);
assert.equal(getPomodoroBreakMinutes(1, BREAK, LONG_BREAK), BREAK);
assert.equal(getPomodoroBreakMinutes(2, BREAK, LONG_BREAK), BREAK);
assert.equal(getPomodoroBreakMinutes(3, BREAK, LONG_BREAK), BREAK);
assert.equal(getPomodoroBreakMinutes(4, BREAK, LONG_BREAK), LONG_BREAK,
  'the 4th completed work interval gets the long break');
assert.equal(getPomodoroBreakMinutes(5, BREAK, LONG_BREAK), BREAK);
assert.equal(getPomodoroBreakMinutes(8, BREAK, LONG_BREAK), LONG_BREAK,
  'the 8th completed work interval also gets the long break');
// The same constants and modulo check are actually wired into cards.js.
assert.match(cardsSrc, /BREAK_MINUTES: 5,/);
assert.match(cardsSrc, /LONG_BREAK_MINUTES: 15,/);
assert.match(cardsSrc, /count > 0 && count % 4 === 0/);

// A completed work interval's duration credited to spentTime is computed in
// HOURS from pomodoroWorkMinutes, the same unit setSpentTime() already uses
// (mirrors stopFlowSession()'s own hours conversion).
function workHoursFor(workMinutes) {
  return workMinutes / 60;
}
assert.equal(workHoursFor(25), 25 / 60);
assert.match(workIntervalBody, /this\.getPomodoroWorkMinutes\(\) \/ 60/);

// --- client template: additive, separate block from Flowtime's ---
const cardDetails = read('client/components/cards/cardDetails.jade');
assert.match(cardDetails, /\+cardFlowtime/, 'Flowtime\'s block must still be present');
assert.match(cardDetails, /\+cardPomodoro/, 'Pomodoro gets its own, separate template block');
assert.match(cardDetails, /card-details-item-pomodoro/);

const pomodoroJs = read('client/components/cards/cardPomodoro.js');
assert.match(pomodoroJs, /Template\.cardPomodoro\.onCreated/);
assert.match(pomodoroJs, /Template\.cardPomodoro\.events/);
assert.match(pomodoroJs, /card\.startPomodoro\(/);
assert.match(pomodoroJs, /card\.stopPomodoro\(\)/);
assert.match(pomodoroJs, /completePomodoroWorkInterval\(\)/);
assert.match(pomodoroJs, /completePomodoroBreakInterval\(\)/);

const pomodoroJade = read('client/components/cards/cardPomodoro.jade');
assert.match(pomodoroJade, /template\(name="cardPomodoro"\)/);
assert.match(pomodoroJade, /js-start-pomodoro/);
assert.match(pomodoroJade, /js-stop-pomodoro/);

// Flowtime's own files must be untouched/still present (additive-only scope).
assert.ok(fs.existsSync(path.join(root, 'client/components/cards/cardFlowtime.js')));
assert.ok(fs.existsSync(path.join(root, 'client/components/cards/cardFlowtime.jade')));

// --- i18n: the new keys exist, in the same position/order in every locale,
// and are really translated (never left equal to English, aside from
// English's own en-* regional variants) ---
const dataDir = path.join(root, 'imports/i18n/data');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const enKeys = Object.keys(en);
const newKeys = [
  'pomodoro',
  'pomodoro-start',
  'pomodoro-work',
  'pomodoro-break',
  'pomodoro-completed',
];
for (const k of newKeys) {
  assert.ok(k in en, `en.i18n.json must have "${k}"`);
}
// They sit together, right after the existing "flow-interruptions" key.
const flowIdx = enKeys.indexOf('flow-interruptions');
assert.ok(flowIdx > 0);
for (let i = 0; i < newKeys.length; i += 1) {
  assert.equal(enKeys[flowIdx + 1 + i], newKeys[i],
    'the new Pomodoro keys must sit together, in order, right after flow-interruptions');
}

const tokensOf = value => [...String(value).matchAll(
  /__[A-Za-z0-9_.]+__|%(?:\d+\$)?[A-Za-z%]/g,
)].map(match => match[0]).sort();

const locales = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('.i18n.json'))
  .filter(f => f !== 'en.i18n.json');

let checked = 0;
for (const f of locales) {
  const isEnglishVariant = /^en[-_.]/.test(f);
  const locale = JSON.parse(read(path.join('imports/i18n/data', f)));
  const keys = Object.keys(locale);

  if (isEnglishVariant) {
    // English regional variants are skipped by design (see
    // releases/translations/fill-translations.mjs) - they may simply not
    // carry the new keys at all.
    continue;
  }

  for (const k of newKeys) {
    assert.ok(k in locale, `${f}: missing new key "${k}"`);
    assert.notEqual(locale[k], en[k],
      `${f}: "${k}" must be a real translation, not left equal to English`);
    assert.deepEqual(tokensOf(locale[k]), tokensOf(en[k]),
      `${f}: "${k}" placeholder inventory must match English exactly`);
  }
  // Same relative key order as English (matches
  // tests/boardItemLinks.test.cjs's per-key position rule).
  for (const k of newKeys) {
    const enIndex = enKeys.indexOf(k);
    const localeIndex = keys.indexOf(k);
    assert.equal(localeIndex, enIndex,
      `${f}: "${k}" is at a different position than in en.i18n.json`);
  }
  checked += 1;
}
assert.ok(checked > 200, `expected to check well over 200 locales, checked ${checked}`);

console.log(`pomodoroTimer: fields, methods, template, and ${checked} locales' i18n keys verified`);
