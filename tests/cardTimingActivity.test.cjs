'use strict';
// A card date cleared ($unset - unsetDue/unsetStart/unsetEnd/unsetReceived)
// went through the Cards.before.update timing hook, which read
// modifier.$set[field] whatever the update was: a $unset alone threw a
// TypeError inside the hook, and with a $set beside it an a-dueAt with
// timeValue: undefined was written - counted as a due date change and
// matched by the "date set or changed" rule triggers. Now a date set
// carries timeValue, a date cleared timeOldValue alone (as a rule's
// removeDate records it, and models/lib/boardTimeline.js rewinds), and the
// rules skip a clear.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { deferSyncRecording } = require('../server/lib/syncRecordingScope');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const helper = () => import('../server/lib/timingChangeActivity.js');

test('timingChange: a date set, a date cleared, or no date change', async () => {
  const { timingChange } = await helper();
  const at = new Date('2099-12-31T17:00:00Z');
  assert.deepEqual(timingChange(['dueAt'], { $set: { dueAt: at } }), { field: 'dueAt', set: true, value: at });
  assert.deepEqual(timingChange(['dateLastActivity', 'startAt'], { $set: { dateLastActivity: at, startAt: at } }),
    { field: 'startAt', set: true, value: at });
  // The bug: a $unset alone, and a $unset beside a stamped $set.
  assert.doesNotThrow(() => timingChange(['dueAt'], { $unset: { dueAt: '' } }));
  assert.deepEqual(timingChange(['dueAt'], { $unset: { dueAt: '' } }), { field: 'dueAt', set: false });
  assert.deepEqual(timingChange(['endAt', 'modifiedAt'], { $unset: { endAt: '' }, $set: { modifiedAt: at } }), { field: 'endAt', set: false });
  assert.deepEqual(timingChange(['receivedAt'], { $set: { receivedAt: null } }), { field: 'receivedAt', set: false });
  // Negative: not a date change.
  for (const [fields, modifier] of [[['title'], { $set: { title: 'T' } }], [['title', 'dueAt'], { $set: { title: 'T', dueAt: at } }],
    [[], {}], [['dueAt'], null], [['dueAt'], { $inc: { dueAt: 1 } }]]) {
    assert.equal(timingChange(fields, modifier), null, JSON.stringify([fields, modifier]));
  }
});

test('isTimingClear: an a-<date> without timeValue, and nothing else', async () => {
  const { isTimingClear } = await helper();
  assert.equal(isTimingClear({ activityType: 'a-dueAt', timeOldValue: new Date(1) }), true);
  assert.equal(isTimingClear({ activityType: 'a-startAt', timeValue: null }), true);
  assert.equal(isTimingClear({ activityType: 'a-dueAt', timeValue: new Date(1) }), false);
  for (const activityType of ['a-changedTitle', 'addComment', 'a-isOvertime', undefined]) {
    assert.equal(isTimingClear({ activityType }), false, String(activityType));
  }
});

async function timingHook(card) {
  const { timingChange } = await helper();
  const src = read('server/models/cards.js');
  const start = src.indexOf('Cards.before.update(async (userId, doc, fieldNames, modifier) => {\n  // A date set carries timeValue');
  const end = src.indexOf('// Issue #3619', start);
  assert.ok(start > 0 && end > start, 'the timing hook is where this test looks for it');
  const hooks = [], activities = [];
  const context = {
    Cards: { before: { update: fn => hooks.push(fn) } }, timingChange, deferSyncRecording, console,
    ReactiveCache: { getCard: async () => card, getUser: async () => ({ username: 'writer' }) },
    Lists: { direct: { updateAsync: async () => 1 } }, add: () => ({ toISOString: () => 'x' }), now: () => 0,
    Activities: { insertAsync: async doc => activities.push(doc) },
  };
  vm.runInNewContext(src.slice(start, end), context);
  return { activities, run: (doc, fieldNames, modifier) => hooks[0]('user', doc, fieldNames, modifier) };
}

test('the timing hook records a set, records a clear without throwing, and nothing for clearing nothing', async () => {
  const card = { _id: 'card', listId: 'list', swimlaneId: 'lane', list: async () => ({ _id: 'list', boardId: 'board' }) };
  const h = await timingHook(card);
  const old = new Date('2026-01-01T00:00:00Z'), at = new Date('2099-12-31T17:00:00Z');
  const doc = { _id: 'card', boardId: 'board', title: 'T', dueAt: old };
  await h.run(doc, ['dueAt'], { $set: { dueAt: at } });
  assert.equal(h.activities[0].activityType, 'a-dueAt');
  assert.equal(h.activities[0].timeValue, at);
  assert.equal(h.activities[0].timeOldValue, old);
  // The bug: this threw "Cannot read properties of undefined".
  await assert.doesNotReject(() => h.run(doc, ['dueAt'], { $unset: { dueAt: '' } }));
  const cleared = h.activities[1];
  assert.equal(cleared.activityType, 'a-dueAt');
  assert.ok(!Object.hasOwn(cleared, 'timeValue'), 'a clear carries no new date');
  assert.equal(cleared.timeOldValue, old);
  // A stamped $set beside the $unset: still a clear, never timeValue: undefined.
  await h.run(doc, ['dueAt', 'modifiedAt'], { $unset: { dueAt: '' }, $set: { modifiedAt: at } });
  assert.ok(!Object.hasOwn(h.activities[2], 'timeValue'));
  // Negative: clearing a date the card does not have records nothing.
  await h.run({ ...doc, dueAt: undefined }, ['dueAt'], { $unset: { dueAt: '' } });
  assert.equal(h.activities.length, 3);
});

test('a clear is recorded as a rule\'s removeDate records it', () => {
  // server/lib/syncRuleCardCommand.js leaves timeValue out when the date is gone.
  const rule = read('server/lib/syncRuleCardCommand.js');
  assert.match(rule, /Object\.hasOwn\(after, field\) \? \{ timeValue: after\[field\] \} : \{\}/);
  assert.match(read('server/models/cards.js'), /\.\.\.\(change\.set \? \{ timeValue: change\.value \} : \{\}\)/);
});

test('the rules skip a cleared date before matching any trigger', () => {
  const src = read('server/rulesHelper.js');
  const body = src.slice(src.indexOf('async findMatchingRules(activity) {'));
  assert.ok(body.indexOf('if (isTimingClear(activity)) return [];') > 0);
  assert.ok(body.indexOf('if (isTimingClear(activity)) return [];') < body.indexOf('TriggersDef[activityType]'),
    'skipped before the triggers are matched');
});

test('the activity feed shows no empty date for a clear', () => {
  const jade = read('client/components/activities/activities.jade');
  assert.match(jade, /if currentData\.timeValue\n\s+i\(title=currentData\.timeValue\)/);
});

// Negative, tree-wide: no hook reads a computed key from a modifier's $set
// without knowing the $set is there - the shape of this bug.
test('nowhere: a modifier.$set[...] read that assumes the $set exists', () => {
  const skip = new Set(['node_modules', '.meteor', '.build', '_build', '.tools', 'tests', 'packages', 'public']);
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name) || e.name.startsWith('_build')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith('.js')) {
        read(path.relative(root, p)).split('\n').forEach((line, i) => {
          // A read (right of =, or an argument), not the assignment of a modifier we built.
          if (/[=(,]\s*modifier\.\$set\[/.test(line) && !/modifier\.\$set\s*&&|\?\.\[/.test(line)) {
            offenders.push(`${path.relative(root, p)}:${i + 1}`);
          }
        });
      }
    }
  };
  for (const dir of ['server', 'models', 'client', 'imports']) walk(path.join(root, dir));
  assert.deepEqual(offenders, []);
});
