'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const source = read('client/lib/oidcAutoRedirect.js').replace('export const OidcAutoRedirect', 'globalThis.OidcAutoRedirect');
const layouts = read('client/components/main/layouts.js');
const created = layouts.slice(layouts.indexOf('Template.userFormsLayout.onCreated('),
  layouts.indexOf('Template.userFormsLayout.onRendered('));
const accounts = read('config/accounts.js');
let passed = 0;
function test(name, run) { run(); passed++; console.log(`ok - ${name}`); }
function fixture(storage = new Map()) {
  const state = { userId: null, loggingIn: false, redirects: 0 };
  const context = {
    sessionStorage: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    Template: { userFormsLayout: { onCreated: fn => { state.create = fn; } } },
    ReactiveVar: function () {},
    ReactiveCache: { getCurrentUser: () => null },
    Meteor: {
      call: (_name, callback) => { state.reply = callback; },
      userId: () => state.userId,
      loggingIn: () => state.loggingIn,
      loginWithOidc: () => { state.redirects++; },
    },
    AccountsTemplates: { options: {} },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  vm.runInContext(created, context);
  state.render = () => {
    state.instance = { subscribe() {}, isDestroyed: false };
    state.create.call(state.instance);
  };
  return { state, context };
}
test('one redirect survives callback reload and repeated failed attempts', () => {
  const storage = new Map();
  for (let page = 0; page < 5; page++) {
    const { state } = fixture(storage);
    state.render(); state.reply(null, true);
    assert.equal(state.redirects, page === 0 ? 1 : 0);
  }
  assert.doesNotMatch(accounts, /onLoginFailure\(\(\) => OidcAutoRedirect\.clear/);
});
test('success permits a later signed-out session to start once', () => {
  const { state, context } = fixture();
  state.render(); state.reply(null, true);
  context.OidcAutoRedirect.clear();
  state.render(); state.reply(null, true);
  assert.equal(state.redirects, 2);
  assert.match(accounts, /Accounts\.onLogin\(\(\) => OidcAutoRedirect\.clear\(\)\)/);
});
for (const property of ['userId', 'loggingIn', 'isDestroyed']) {
  test(`late settings response cannot redirect after ${property}`, () => {
    const { state } = fixture(); state.render();
    if (property === 'isDestroyed') state.instance.isDestroyed = true;
    else state[property] = true;
    state.reply(null, true); assert.equal(state.redirects, 0);
  });
}
test('disabled automatic login never navigates', () => {
  const { state } = fixture(); state.render(); state.reply(null, false);
  assert.equal(state.redirects, 0);
});
for (const operation of ['getItem', 'setItem']) {
  test(`blocked storage ${operation} does not start a redirect loop`, () => {
    const { state, context } = fixture();
    context.sessionStorage[operation] = () => { throw new Error('blocked'); };
    state.render(); state.reply(null, true); assert.equal(state.redirects, 0);
  });
}
console.log(`${passed} OIDC redirect regression tests passed`);
