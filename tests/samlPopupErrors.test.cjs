'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync('packages/wekan-accounts-saml/saml_client.js', 'utf8');
function setup() {
  let tick, result, calls = 0, cleared = 0;
  const popup = { closed: false, focus() {}, close() { this.closed = true; }, document: { getElementById: () => null } };
  const Meteor = { Error: class extends Error { constructor(code, reason) { super(reason); this.error = code; this.reason = reason; } }, startup() {} };
  vm.runInNewContext(source, { Meteor, Random: { id: () => 'token' }, window: { screenX: 0, screenY: 0, outerWidth: 1000, outerHeight: 800, open: () => popup },
    ServiceConfiguration: { configurations: { findOne: () => ({ service: 'saml' }) } }, URLSearchParams,
    Accounts: { callLoginMethod({ methodArguments, userCallback }) { calls++; assert.equal(methodArguments[0].saml.credentialToken, 'token'); userCallback(); } },
    setInterval(fn) { tick = fn; return 1; }, clearInterval() { cleared++; } });
  Meteor.loginWithSaml({}, error => { result = error || 'success'; });
  return { popup, tick: () => tick(), result: () => result, calls: () => calls, cleared: () => cleared };
}
test('ACS error is surfaced without attempting a credential exchange', () => {
  const f = setup(); f.popup.document.getElementById = () => ({ getAttribute: () => 'SAML account conflict' }); f.tick();
  assert.equal(f.result().error, 'saml-login-failed'); assert.equal(f.result().reason, 'SAML account conflict');
  assert.equal(f.calls(), 0); assert.equal(f.cleared(), 1); assert.equal(f.popup.closed, true);
});
test('successful marker exchanges credentials; cross-origin navigation waits', () => {
  const f = setup(); Object.defineProperty(f.popup, 'document', { configurable: true, get() { throw Error('cross origin'); } });
  f.tick(); assert.equal(f.calls(), 0); assert.equal(f.cleared(), 0);
  Object.defineProperty(f.popup, 'document', { value: { getElementById: () => ({ getAttribute: () => null }) } });
  f.tick(); assert.equal(f.calls(), 1); assert.equal(f.result(), 'success'); assert.equal(f.cleared(), 1);
});
test('sign-in handler clears previous errors and displays failure without redirecting', () => {
  const layouts = fs.readFileSync('client/components/main/layouts.js', 'utf8');
  const text = layouts.slice(layouts.indexOf("  'click #at-saml'"), layouts.indexOf('  // Google / GitHub'));
  const errors = [], routes = []; let callback;
  const handlers = vm.runInNewContext(`({${text}})`, { Meteor: { settings: { public: {} }, loginWithSaml(options, cb) { callback = cb; } },
    showLoginError: value => errors.push(value), FlowRouter: { go: route => routes.push(route) } });
  handlers['click #at-saml']({ preventDefault() {} }); assert.equal(errors[0], '');
  const error = { reason: 'error text' }; callback(error); assert.equal(errors[1], error); assert.deepEqual(routes, []);
  callback(); assert.deepEqual(routes, ['/']);
});

// SAML_LOGIN_FLOW=redirect: the page leaves, and the return is handled at startup.
function redirectSetup({ search = '', stored = null } = {}) {
  const events = [], assigned = [], replaced = [], logins = [];
  const store = new Map(stored ? [['wekan-saml-pending-token', stored]] : []);
  const sessionStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
  let startup;
  const Meteor = { Error: class extends Error {}, startup(fn) { startup = fn; } };
  const window = {
    sessionStorage,
    location: { search, pathname: '/sign-in', assign: url => assigned.push(url) },
    history: { replaceState: (_s, _t, url) => replaced.push(url) },
    dispatchEvent: event => events.push(event.detail.error),
  };
  vm.runInNewContext(source, {
    Meteor, Random: { id: () => 'fresh-token' }, window, document: { title: 't' }, URLSearchParams,
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
    ServiceConfiguration: { configurations: { findOne: () => ({ service: 'saml', loginFlow: 'redirect' }) } },
    Accounts: { callLoginMethod({ methodArguments, userCallback }) { logins.push(methodArguments[0].saml.credentialToken); userCallback(); } },
    setInterval() { throw new Error('no popup polling in redirect mode'); }, clearInterval() {},
  });
  return { Meteor, startup: () => startup(), events, assigned, replaced, logins, store };
}
test('redirect flow leaves the page and remembers the token in this tab', () => {
  const f = redirectSetup();
  f.Meteor.loginWithSaml({ provider: 'idp' });
  assert.deepEqual(f.assigned, ['/_saml/authorize?provider=idp&credentialToken=fresh-token']);
  assert.equal(f.store.get('wekan-saml-pending-token'), 'fresh-token');
});
test('the returning token this tab started is exchanged, then the page opens /', () => {
  const f = redirectSetup({ search: '?samlToken=abc&x=1', stored: 'abc' });
  f.startup();
  assert.deepEqual(f.replaced, ['/sign-in?x=1'], 'the token leaves the address bar first');
  assert.deepEqual(f.logins, ['abc']);
  assert.deepEqual(f.assigned, ['/']);
  assert.equal(f.store.has('wekan-saml-pending-token'), false);
});
test('a token this tab did not start is not exchanged (negative)', () => {
  for (const stored of [null, 'other']) {
    const f = redirectSetup({ search: '?samlToken=abc', stored });
    f.startup();
    assert.deepEqual(f.logins, []);
    assert.deepEqual(f.events.map(e => e.error), ['saml-login-not-started']);
    assert.deepEqual(f.assigned, []);
  }
});
test('an identity-provider error returns as text and logs nobody in', () => {
  const f = redirectSetup({ search: '?samlError=Invalid%20document%20signature', stored: 'abc' });
  f.startup();
  assert.deepEqual(f.logins, []);
  assert.equal(f.events[0].reason, 'Invalid document signature');
  assert.deepEqual(f.replaced, ['/sign-in']);
});
test('an ordinary page load does nothing', () => {
  const f = redirectSetup({ search: '?lang=fi' });
  f.startup();
  assert.deepEqual([f.logins, f.events, f.replaced, f.assigned], [[], [], [], []]);
});
