'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function fixture() {
  const timers = [], sent = [], buffer = [];
  let notify;
  const f = { timers, sent, buffer, send: async () => {}, add: async () => {}, read: async () => user };
  const user = { _id: 'watcher', profile: {}, emails: [{ address: 'watcher@example.test' }],
    getLanguage: () => 'en', getEmailBuffer: () => buffer,
    addEmailBuffer: async text => { await f.add(); if (!buffer.includes(text)) buffer.push(text); },
    clearEmailBuffer: async texts => { for (let i = buffer.length - 1; i >= 0; i--) if (texts.includes(buffer[i])) buffer.splice(i, 1); },
  };
  f.user = user;
  const source = fs.readFileSync(require.resolve('../server/notifications/email.js'), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, {
    Meteor: { startup: fn => fn(), setTimeout: fn => timers.push(fn) },
    Notifications: { subscribe: (name, fn) => { notify = fn; } },
    ReactiveCache: { getCurrentSetting: async () => ({ notifyDefaultEmail: true }), getBoard: async () => ({}), getUser: () => f.read() },
    TAPi18n: { ensureLanguageLoaded: async () => {}, __: key => key },
    EmailLocalization: { sendEmail: async mail => { sent.push(mail); await f.send(); } },
    Accounts: { emailTemplates: { from: 'sender@example.test' } },
    formatActivityNotificationTitle: title => title,
    resolveNotificationSetting: () => true,
    require: id => id.endsWith('inboundEmailReplyToken') ? { buildReplyToAddress: card => `reply-${card}@example.test` } : require(`..${id}`),
    process: { env: { INBOUND_EMAIL_HMAC_SECRET: 'local-test', INBOUND_EMAIL_DOMAIN: 'example.test' } }, console: { error() {} },
  });
  f.notify = (text, cardId = text) => notify(user, 'Title', text, { url: 'https://example.test/card', user: 'Author', cardId });
  return f;
}
test('persist buffer before scheduling and retain it on SMTP failure or missing address', async () => {
  const f = fixture(), gate = deferred(); f.add = () => gate.promise;
  const preparing = f.notify('first'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.timers.length, 0); gate.resolve(); await preparing;
  assert.equal(f.buffer.length, 1);
  f.send = async () => { throw Error('SMTP unavailable'); };
  await f.timers.shift()(); assert.equal(f.buffer.length, 1);
  f.user.emails = []; await f.notify('second'); await f.timers.shift()();
  assert.equal(f.buffer.length, 2); assert.equal(f.sent.length, 1);
});
test('slow send is serialized and acknowledges only its snapshot', async () => {
  const f = fixture(), gate = deferred(), entered = deferred();
  f.send = async () => { entered.resolve(); await gate.promise; };
  await f.notify('first'); const first = f.timers.shift()(); await entered.promise;
  assert.equal(f.buffer.length, 1, 'nothing removed before SMTP succeeds');
  await f.notify('second'); const second = f.timers.shift()();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(f.sent.length, 1);
  const ack = deferred(), afterAck = deferred();
  const originalClear = f.user.clearEmailBuffer;
  f.user.clearEmailBuffer = async texts => { await originalClear(texts); afterAck.resolve(); await ack.promise; };
  gate.resolve(); await afterAck.promise;
  assert.equal(f.buffer.length, 1); assert.match(f.buffer[0], /second/);
  ack.resolve(); await Promise.all([first, second]);
  assert.equal(f.sent.length, 2); assert.doesNotMatch(f.sent[1].html, /first/);
  assert.match(f.sent[1].html, /second/); assert.equal(f.buffer.length, 0);
});
test('read failure releases the per-user chain so another timer can deliver', async () => {
  const f = fixture(); await f.notify('first');
  f.read = async () => { throw Error('database unavailable'); };
  await f.timers.shift()(); assert.equal(f.buffer.length, 1);
  f.read = async () => f.user; await f.notify('second'); await f.timers.shift()();
  assert.equal(f.sent.length, 1); assert.equal(f.buffer.length, 0);
});
test('actual user helper removes the acknowledged lines instead of clearing newer lines', async () => {
  const source = fs.readFileSync(require.resolve('../models/users.js'), 'utf8');
  const body = source.match(/async clearEmailBuffer\(texts\) \{([\s\S]*?)\n  \},/)[1];
  let modifier;
  const run = vm.runInNewContext(`(async function(texts) {${body}})`, {
    check: (texts) => assert.ok(Array.isArray(texts)), String,
    Users: { updateAsync: async (id, value) => { assert.equal(id, 'watcher'); modifier = value; return 1; } },
  });
  assert.equal(await run.call({ _id: 'watcher' }, ['sent']), 1);
  assert.deepEqual(JSON.parse(JSON.stringify(modifier)), { $pullAll: { 'profile.emailBuffer': ['sent'] } });
});

test('newer notification on the same card keeps its reply target after the first acknowledgement', async () => {
  const f = fixture(), gate = deferred(), entered = deferred();
  f.send = async () => { entered.resolve(); await gate.promise; };
  await f.notify('first', 'same-card'); const first = f.timers.shift()(); await entered.promise;
  await f.notify('second', 'same-card'); const second = f.timers.shift()();
  gate.resolve(); await Promise.all([first, second]);
  assert.equal(f.sent.length, 2);
  assert.equal(f.sent[1].replyTo, 'reply-same-card@example.test');
});
