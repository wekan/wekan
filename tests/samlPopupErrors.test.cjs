'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync('packages/wekan-accounts-saml/saml_client.js', 'utf8');
function setup() {
  let tick, result, calls = 0, cleared = 0;
  const popup = { closed: false, focus() {}, close() { this.closed = true; }, document: { getElementById: () => null } };
  const Meteor = { Error: class extends Error { constructor(code, reason) { super(reason); this.error = code; this.reason = reason; } } };
  vm.runInNewContext(source, { Meteor, Random: { id: () => 'token' }, window: { screenX: 0, screenY: 0, outerWidth: 1000, outerHeight: 800, open: () => popup },
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
