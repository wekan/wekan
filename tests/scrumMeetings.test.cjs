'use strict';
// The Scrum meeting helpers (models/lib/scrumMeetings.js): the daily standup
// timer and the retrospective board - their logic, and that each is hidden
// both by the board's Scrum settings and by Admin Panel / Features.
// Run: node --test tests/scrumMeetings.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const m = require('../models/lib/scrumMeetings');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('the standup gives everyone the same timebox, in turn, and counts overtime', () => {
  const t0 = Date.UTC(2026, 10, 20, 9, 0, 0);
  let state = m.startStandup(['ann', 'bob'], 2, t0);
  let view = m.standupView(state, t0 + 30 * 1000);
  assert.deepStrictEqual([view.speaker, view.position, view.count, view.remainingSeconds, view.overtime], ['ann', 1, 2, 90, false]);
  view = m.standupView(state, t0 + 130 * 1000);
  assert.strictEqual(view.remainingSeconds, -10);
  assert.strictEqual(view.overtime, true, 'over the timebox');
  state = m.nextSpeaker(state, t0 + 130 * 1000);
  view = m.standupView(state, t0 + 140 * 1000);
  assert.deepStrictEqual([view.speaker, view.remainingSeconds, view.elapsedSeconds], ['bob', 110, 140], 'bob starts with the whole timebox');
  state = m.nextSpeaker(state, t0 + 200 * 1000);
  view = m.standupView(state, t0 + 200 * 1000);
  assert.strictEqual(view.done, true);
  assert.strictEqual(view.speaker, null);
  assert.strictEqual(m.nextSpeaker(state, t0 + 300 * 1000), state, 'negative: nothing after the last');
  assert.strictEqual(m.clock(125), '2:05');
  assert.strictEqual(m.clock(-7), '-0:07');
});

test('the order is shuffled, without losing or doubling anybody; minutes are kept in 1-15', () => {
  const order = m.shuffle(['a', 'b', 'c', 'd', 'a', '', null], () => 0);
  assert.deepStrictEqual([...order].sort(), ['a', 'b', 'c', 'd']);
  assert.deepStrictEqual(m.shuffle(['a', 'b', 'c'], () => 0.999), ['a', 'b', 'c'], 'the random source decides');
  assert.strictEqual(m.standupMinutes('3'), 3);
  assert.strictEqual(m.standupMinutes(0), 1);
  assert.strictEqual(m.standupMinutes(99), 15);
  assert.strictEqual(m.standupMinutes('x'), 2, 'negative: not a number is the default');
});

test('the retrospective board has the four lists, titled for its board and day', () => {
  const plan = m.retrospectivePlan('Team', '2026-11-20T15:00:00Z');
  assert.strictEqual(plan.title, 'Team - retrospective 2026-11-20');
  assert.deepStrictEqual(plan.lists, ['Start doing', 'Stop doing', 'Keep doing', 'Action items']);
  const translated = m.retrospectivePlan('Team', '2026-11-20', (key, fallback, o) => (o ? `${o.board}/${o.date}` : `[${key}]`));
  assert.strictEqual(translated.title, 'Team/2026-11-20');
  assert.deepStrictEqual(translated.lists, ['[retro-start]', '[retro-stop]', '[retro-continue]', '[action-items]']);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const [key, fallback] of m.RETRO_LISTS) assert.strictEqual(en[key], fallback, `${key} in English`);
  assert.strictEqual(en['retrospective-board-title'], '__board__ - retrospective __date__');
});

test('each is hidden by the board\'s Scrum settings and by Admin Panel / Features', () => {
  const { FEATURE_KEYS } = require('../models/lib/instanceFeatures');
  for (const key of ['standup-timer', 'retrospective-board']) assert.ok(FEATURE_KEYS.includes(key), key);
  const { DEFAULT_SCRUM_SETTINGS, normalizeScrumSettings } = require('../models/lib/scrum');
  assert.strictEqual(DEFAULT_SCRUM_SETTINGS.standupTimer, true);
  assert.strictEqual(DEFAULT_SCRUM_SETTINGS.retrospectiveBoard, true);
  assert.deepStrictEqual(normalizeScrumSettings({ standupTimer: false, standupMinutes: 3, retrospectiveBoard: false }),
    { standupTimer: false, standupMinutes: 3, retrospectiveBoard: false });
  for (const bad of [{ standupTimer: 'no' }, { standupMinutes: 0 }, { standupMinutes: 2.5 }, { retrospectiveBoard: 1 }]) {
    assert.throws(() => normalizeScrumSettings(bad), JSON.stringify(bad));
  }
  const client = read('client/components/sidebar/scrumMeetings.js');
  assert.match(client, /allowFeature\('standup-timer'\) && settingsOf\(board\)\.standupTimer !== false/);
  assert.match(client, /allowFeature\('retrospective-board'\) && settingsOf\(board\)\.retrospectiveBoard !== false/);
  // The new board goes through the server's board creation and its "who may
  // create boards" check; nothing else makes a board here (negative).
  assert.match(client, /Meteor\.callAsync\('createBoardWithInitialSwimlanes', \{/);
  assert.doesNotMatch(client, /Boards\.insert/);
  const menu = read('client/components/sidebar/sidebar.jade');
  assert.match(menu, /if showsStandupTimer\n\s+li\n\s+a\.js-open-daily-standup/);
  assert.match(menu, /if showsRetrospectiveBoard\n\s+li\n\s+a\.js-create-retrospective-board/);
  const scrumForm = read('client/components/boards/scrum/scrumView.jade');
  for (const name of ['standupTimer', 'standupMinutes', 'retrospectiveBoard']) assert.ok(scrumForm.includes(`name="${name}"`), name);
});
