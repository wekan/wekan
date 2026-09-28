'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { Readable } = require('node:stream');
const { createOutboundDeadline } = require('../server/lib/outboundDeadline');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function load(file, dependencies, names) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  return new Function(...Object.keys(dependencies), `${source}\nreturn {${names.join(',')}};`)(...Object.values(dependencies));
}
function guard({ lookup = async () => [{ address: '93.184.216.34', family: 4 }], respond, deadlineFactory = createOutboundDeadline }) {
  const requests = [], responses = [];
  const transport = { request(options, callback) {
    const request = new EventEmitter(); request.setTimeout = () => {}; request.write = () => {};
    request.destroyed = false;
    request.destroy = error => { if (!request.destroyed) { request.destroyed = true; if (error) process.nextTick(() => request.emit('error', error)); } };
    request.end = () => respond?.({ request, number: requests.length, reply(status = 200, headers = {}) {
      const response = new Readable({ read() {} }); response.statusCode = status; response.headers = headers;
      responses.push(response); callback(response); return response;
    } });
    requests.push(request); return request;
  } };
  const { isIpBlocked } = load('models/lib/attachmentUrlValidation.js', { Meteor: { isServer: true }, require }, ['isIpBlocked']);
  const { fetchSafe } = load('server/lib/ssrfGuard.js', { dns: { promises: { lookup } }, fs, net: require('node:net'),
    http: transport, https: transport, URL, isIpBlocked, createOutboundDeadline: deadlineFactory, console: { info() {} } }, ['fetchSafe']);
  return { fetchSafe, requests, responses };
}
test('late DNS completion cannot dial after total deadline', async () => {
  let release;
  const lookup = new Promise(resolve => { release = resolve; });
  const f = guard({ lookup: () => lookup });
  await assert.rejects(f.fetchSafe('https://public.example', { totalTimeoutMs: 25 }), { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
  release([{ address: '93.184.216.34', family: 4 }]); await sleep(5);
  assert.equal(f.requests.length, 0);
});
test('a connection without headers is actively destroyed and a late response is destroyed too', async () => {
  let reply;
  const f = guard({ respond: input => { reply = input.reply; } });
  await assert.rejects(f.fetchSafe('https://public.example', { totalTimeoutMs: 25 }), { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
  assert.equal(f.requests[0].destroyed, true);
  const late = reply(); await sleep(5); assert.equal(late.destroyed, true);
});
test('continually arriving body chunks cannot extend the absolute deadline', async () => {
  let tick, chunks = 0;
  const f = guard({ respond: ({ reply }) => {
    const response = reply(); tick = setInterval(() => { chunks++; response.push('x'); }, 3);
    response.once('close', () => clearInterval(tick));
  } });
  try {
    await assert.rejects(f.fetchSafe('https://public.example', { totalTimeoutMs: 35, timeoutMs: 1000 }), { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
    assert.ok(chunks > 0); assert.equal(f.responses[0].destroyed, true); assert.equal(f.requests[0].destroyed, true);
  } finally { clearInterval(tick); }
});
test('redirects share a deadline instead of resetting the budget', async () => {
  let secondLookup, budgets = 0;
  const f = guard({ deadlineFactory: ms => { budgets++; return createOutboundDeadline(ms); }, lookup: async () => {
    if (secondLookup) return secondLookup;
    secondLookup = new Promise(() => {});
    return [{ address: '93.184.216.34', family: 4 }];
  }, respond: ({ reply }) => { reply(302, { location: '/next' }); } });
  await assert.rejects(f.fetchSafe('https://public.example/start', { totalTimeoutMs: 25, maxRedirects: 2 }), { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
  assert.equal(f.requests.length, 1); assert.equal(f.responses[0].destroyed, true); assert.equal(budgets, 1);
});
test('successful completion disposes the timer and does not destroy completed resources later', async () => {
  const f = guard({ respond: ({ reply }) => { const response = reply(); process.nextTick(() => { response.push('done'); response.push(null); }); } });
  const response = await f.fetchSafe('https://public.example', { totalTimeoutMs: 25 });
  assert.equal(await response.text(), 'done'); await sleep(35);
  assert.equal(f.requests[0].destroyed, false);
});
test('invalid budgets fail before DNS; normal transport failures cancel resources', async () => {
  const f = guard({ lookup: async () => assert.fail('invalid budget must not look up DNS') });
  for (const totalTimeoutMs of [0, 0.5, 1.5, -1, Infinity, NaN, '30', 300001]) {
    await assert.rejects(f.fetchSafe('https://public.example', { totalTimeoutMs }), /total timeout/);
  }
  const broken = guard({ respond: ({ reply }) => { const response = reply(); process.nextTick(() => response.destroy(new Error('body failure'))); } });
  await assert.rejects(broken.fetchSafe('https://public.example', { totalTimeoutMs: 1000 }), /body failure/);
  assert.equal(broken.requests[0].destroyed, true);
});
test('both ordinary and stored webhooks opt in to a complete request budget', () => {
  for (const file of ['server/notifications/outgoing.js', 'server/lib/syncWebhookHttp.js']) {
    assert.match(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), /totalTimeoutMs:\s*30000/);
  }
});

test('late headers after a transport failure are destroyed even though the deadline timer was disposed', async () => {
  let reply;
  const f = guard({ respond: input => { reply = input.reply; process.nextTick(() => input.request.emit('error', new Error('connection failed'))); } });
  await assert.rejects(f.fetchSafe('https://public.example', { totalTimeoutMs: 1000 }), /connection failed/);
  const late = reply(); await sleep(5); assert.equal(late.destroyed, true);
});
