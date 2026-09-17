'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('client/components/settings/notificationSettingsPopup.js', 'utf8');
let helpers, events, instance;
const calls = [];
const board = { setNotifyOverride: (...args) => calls.push(['board', ...args]) };
const user = { profile: {}, setNotifyOverride: (...args) => calls.push(['member', ...args]) };
vm.runInNewContext(source.replace(/^import .*;\n/gm, ''), {
  Template: {
    notificationSettingsPopup: {
      helpers: value => { helpers = value; },
      events: value => { events = value; },
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
for (const [file, scope] of [['users/userHeader', 'member'], ['sidebar/sidebar', 'board']]) {
  assert.ok(fs.readFileSync(`client/components/${file}.js`, 'utf8').includes(`dataContext: { scope: '${scope}' }`));
}
assert.match(fs.readFileSync('client/lib/popup.js', 'utf8'), /dataContext: openOptions\.dataContext \|\|/);
const jade = fs.readFileSync('client/components/settings/notificationSettingsPopup.jade', 'utf8');
assert.doesNotMatch(jade, /a\.flex\.js-notify-option[^\n]*is-checked/);
assert.match(jade, /\.materialCheckBox\(class="\{\{#if onSelected/);
console.log('Notification settings route each row to the owning panel scope');
