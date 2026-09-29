'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('client/components/settings/notificationSettingsPopup.js', 'utf8');
let helpers, events, instance, created;
const calls = [];
const board = { setNotifyOverride: (...args) => calls.push(['board', ...args]) };
const user = { profile: {}, setNotifyOverride: (...args) => calls.push(['member', ...args]) };
vm.runInNewContext(source.replace(/^import .*;\n/gm, ''), {
  Template: {
    notificationSettingsPopup: {
      helpers: value => { helpers = value; },
      events: value => { events = value; },
      // #5323: the popup keeps its due-reminder toggles on the instance.
      onCreated: value => { created = value; },
    },
    instance: () => instance,
    // Inside #each this is the service row, not the panel scope.
    currentData: () => ({ service: 'email' }),
  },
  ReactiveCache: {
    getCurrentSetting: () => ({ notifyDefaultEmail: false }),
    getBoard: () => board,
    getCurrentUser: () => user,
  },
  Utils: { getCurrentBoardId: () => 'board-id' },
  NOTIFICATION_SERVICES: { email: {}, tray: {} },
  Meteor: { call: (...args) => calls.push(args) },
  ReactiveVar: class { constructor(v) { this.v = v; } get() { return this.v; } set(v) { this.v = v; } },
  TAPi18n: { __: key => key },
  parseDueReminderInput: text => {
    const trimmed = String(text).trim();
    if (!trimmed) return null;
    const days = trimmed.split(',').map(Number);
    return days.every(d => Number.isInteger(d) && d >= -14 && d <= 14) ? days : undefined;
  },
});
for (const scope of ['admin', 'board', 'member']) {
  instance = { data: { scope } };
  assert.equal(helpers.isAdminScope(), scope === 'admin');
  for (const [raw, value] of [['true', true], ['false', false], ['', null]]) {
    if (scope === 'admin' && value === null) continue;
    calls.length = 0;
    events['click .js-notify-option']({
      preventDefault() {}, currentTarget: { dataset: { service: 'email', value: raw } },
    }, instance);
    assert.deepEqual(calls, [[scope === 'admin' ? 'setAdminNotifyDefault' : scope, 'email', value]]);
  }
}
// #5323: due-date reminder settings exist only at board scope, and invalid
// input never reaches the server.
board._id = 'board-id';
board.dueReminderDays = [3];
for (const scope of ['admin', 'board', 'member']) {
  instance = { data: { scope } };
  created.call(instance);
  assert.equal(helpers.isBoardScope.call({}), scope === 'board');
}
instance = { data: { scope: 'board' } };
created.call(instance);
const form = values => ({ $: selector => ({ val: () => values[selector] }) });
// Arrays created inside the VM have another realm's prototype; compare as JSON.
const plain = value => JSON.parse(JSON.stringify(value));
const submit = values => events['submit .js-due-reminder-form']({ preventDefault() {} }, Object.assign(instance, form(values)));
calls.length = 0;
submit({ '.js-due-reminder-days': '3, 0, -1' });
assert.deepEqual(plain(calls[0].slice(0, 4)), ['setBoardDueReminders', 'board-id', [3, 0, -1], false]);
calls.length = 0;
submit({ '.js-due-reminder-days': '20' });
assert.deepEqual(calls, [], 'an out-of-range day is refused before any server call');
assert.equal(instance.dueReminderMessage.get(), 'due-reminder-invalid');
events['click .js-due-reminder-off']({ preventDefault() {} }, instance);
events['click .js-due-reminder-webhook']({ preventDefault() {} }, instance);
calls.length = 0;
submit({ '.js-due-reminder-days': 'ignored while off' });
assert.deepEqual(plain(calls[0].slice(0, 4)), ['setBoardDueReminders', 'board-id', [], true], '"no reminders" saves an empty list');
events['click .js-due-reminder-off']({ preventDefault() {} }, instance);
calls.length = 0;
submit({ '.js-due-reminder-days': '' });
assert.deepEqual(plain(calls[0].slice(0, 4)), ['setBoardDueReminders', 'board-id', null, true], 'an empty field restores the server default');

for (const [file, scope] of [['users/userHeader', 'member'], ['sidebar/sidebar', 'board']]) {
  assert.ok(fs.readFileSync(`client/components/${file}.js`, 'utf8').includes(`dataContext: { scope: '${scope}' }`));
}
assert.match(fs.readFileSync('client/lib/popup.js', 'utf8'), /dataContext: openOptions\.dataContext \|\|/);
const jade = fs.readFileSync('client/components/settings/notificationSettingsPopup.jade', 'utf8');
assert.doesNotMatch(jade, /a\.flex\.js-notify-option[^\n]*is-checked/);
assert.match(jade, /\.materialCheckBox\(class="\{\{#if onSelected/);
console.log('Notification settings route each row to the owning panel scope');
