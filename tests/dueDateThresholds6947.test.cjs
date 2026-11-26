'use strict';
// #6947: when a due date turns amber (due soon) and red (overdue) is the
// board's (Board Settings / Date): hours before the due date, WeKan's 48 until
// set, and hours after it, 0 until set. The colours are computed by
// client/lib/dueDateColor.js dueDateClass, the thresholds read by
// models/lib/dueDateThresholds.js dueThresholdsOf, and set by a board admin
// through setBoardDueThresholds.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const { dueThresholdsOf, validThresholdHours, MAX_THRESHOLD_HOURS } = require('../models/lib/dueDateThresholds');

function loadDueDateClass() {
  const context = {};
  vm.runInNewContext(read('client/lib/dueDateColor.js').replace(/^export function/gm, 'function')
    .concat('\nresult = { dueDateClass };'), context);
  return context.result.dueDateClass;
}
const dueDateClass = loadDueDateClass();
const now = new Date('2026-11-26T12:00:00Z');
const inHours = h => new Date(now.getTime() + h * 3600000);

test('without thresholds, and with the defaults, the colours are as before: 48 hours, overdue at the due time', () => {
  for (const t of [undefined, dueThresholdsOf(null), dueThresholdsOf({})]) {
    assert.equal(dueDateClass(inHours(49), now, null, t), 'not-due');
    assert.equal(dueDateClass(inHours(48), now, null, t), 'due-soon');
    assert.equal(dueDateClass(inHours(1), now, null, t), 'due-soon');
    assert.equal(dueDateClass(inHours(-0.1), now, null, t), 'overdue');
  }
});

test('the requester\'s board: grey above 24 hours, amber within them, red when overdue', () => {
  const t = dueThresholdsOf({ dueSoonHours: 24 });
  assert.equal(dueDateClass(inHours(30), now, null, t), 'not-due');
  assert.equal(dueDateClass(inHours(24), now, null, t), 'due-soon');
  assert.equal(dueDateClass(inHours(-1), now, null, t), 'overdue');
});

test('hours after the due date before it is overdue; a done card is done whatever the thresholds', () => {
  const t = dueThresholdsOf({ dueSoonHours: 0, overdueAfterHours: 2 });
  assert.equal(dueDateClass(inHours(1), now, null, t), 'not-due');
  assert.equal(dueDateClass(inHours(-1), now, null, t), 'due-soon');
  assert.equal(dueDateClass(inHours(-3), now, null, t), 'overdue');
  assert.equal(dueDateClass(inHours(-3), now, inHours(-4), t), 'completed-early');
  assert.equal(dueDateClass(inHours(-3), now, inHours(-1), t), 'completed');
});

test('negative: a threshold that is no number of hours from 0 to a year is no setting', () => {
  for (const bad of [-1, NaN, Infinity, '24', null, true, MAX_THRESHOLD_HOURS + 1, { valueOf: () => 24 }]) {
    assert.equal(validThresholdHours(bad), false, String(bad));
    assert.deepEqual(dueThresholdsOf({ dueSoonHours: bad, overdueAfterHours: bad }), { soonHours: 48, overdueAfterHours: 0 });
    // dueDateClass itself takes nothing but a number either.
    assert.equal(dueDateClass(inHours(30), now, null, { soonHours: bad, overdueAfterHours: bad }), 'due-soon');
  }
  assert.equal(validThresholdHours(0), true);
  assert.equal(validThresholdHours(1.5), true);
});

test('every due date colour reads the board\'s thresholds: no caller left on the fixed 48 hours', () => {
  const callers = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (!['tests', 'node_modules'].includes(entry.name)) walk(rel); continue; }
      if (!rel.endsWith('.js') || rel === path.join('client', 'lib', 'dueDateColor.js')) continue;
      const src = read(rel);
      // Each call's arguments, to its matching parenthesis (not an import).
      for (let at = src.indexOf('dueDateClass('); at >= 0; at = src.indexOf('dueDateClass(', at + 1)) {
        let depth = 0, end = at + 'dueDateClass'.length;
        for (; end < src.length; end++) {
          if (src[end] === '(') depth++;
          else if (src[end] === ')' && --depth === 0) break;
        }
        callers.push([rel, src.slice(at + 'dueDateClass('.length, end)]);
      }
    }
  };
  walk('client');
  walk('models');
  assert.ok(callers.length >= 3, JSON.stringify(callers));
  for (const [file, args] of callers) assert.match(args, /dueThresholdsOf\(/, `${file}: dueDateClass(${args})`);
});

test('setBoardDueThresholds: a board admin\'s, a number of hours or null, refused otherwise', () => {
  const src = read('server/models/boards.js');
  const body = src.slice(src.indexOf('async setBoardDueThresholds('), src.indexOf('async setBoardDateFormat('));
  assert.match(body, /check\(dueSoonHours, Match\.OneOf\(Number, null\)\)/);
  assert.match(body, /validThresholdHours\(value\)/);
  assert.match(body, /allowIsBoardAdmin\(this\.userId, board\)/);
  assert.ok(body.indexOf('invalid-due-threshold') < body.indexOf('updateAsync'), 'refused before anything is written');
  const schema = read('models/boards.js');
  assert.match(schema, /dueSoonHours: \{ type: Number, optional: true, min: 0, max: 24 \* 366 \}/);
  assert.match(schema, /overdueAfterHours: \{ type: Number, optional: true, min: 0, max: 24 \* 366 \}/);
  const jade = read('client/components/forms/dateFormatSettings.jade');
  assert.match(jade, /form\.js-due-thresholds-form/);
  assert.match(jade, /js-due-soon-hours\(type="number" min="0"/);
  assert.match(jade, /disabled=notBoardAdmin/);
});

test('the two words are in every language, with no English left outside English', () => {
  const dir = path.join(root, 'imports/i18n/data');
  const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.i18n.json'), 'utf8'));
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const key of ['due-soon-hours', 'overdue-after-hours']) {
      assert.ok(typeof data[key] === 'string' && data[key].trim(), `${file} ${key}`);
      if (!file.startsWith('en')) assert.notEqual(data[key], en[key], `${file} ${key} is still English`);
    }
  }
});
