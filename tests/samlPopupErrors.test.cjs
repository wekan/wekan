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
    // This suite is about the popup flow: redirect is the default since
    // 2026-10-08, so the configuration asks for the popup.
    ServiceConfiguration: { configurations: { findOne: () => ({ service: 'saml', loginFlow: 'popup' }) } }, URLSearchParams,
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

// Translation coverage for the browser-tab boundary error; runtime boundary
// behavior is exercised above and in samlReplayBoundary.test.cjs.
test('translated browser-tab errors preserve SAML and source placeholders', () => {
  const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync('imports/i18n/data/en.i18n.json', 'utf8'));
  const key = 'saml-login-not-started';
  for (const code of ["tk_TM", "tt", "so", "ku", "ckb", "pap", "tpi", "bi", "mi", "sm", "haw", "zu", "zu-ZA", "xh", "st", "tn", "rw", "rn", "ny", "bho", "mai", "or_IN", "kok", "ary", "yi", "nd", "ss", "nso", "ts", "om", "fj", "to", "gv", "wa", "wa-RR", "ak", "lg", "bm", "wo", "ee", "rup", "ve-CC", "bua", "sah", "cv", "ve", "se", "ace", "bo", "dz", "ti", "ks", "qu", "ay", "gn", "ff", "vo", "tlh", "ve-PP", "wal", "kl", "iu", "nah", "zgh", "tig", "chr"]) {
    const locale = JSON.parse(fs.readFileSync(`imports/i18n/data/${code}.i18n.json`, 'utf8'));
    assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source order`);
    assert.ok(locale[key]?.trim(), `${code}: nonempty`);
    assert.notEqual(locale[key], en[key], `${code}: no English fallback`);
    assert.match(locale[key], /SAML/, `${code}: protocol name`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}: tokens`);
  }
});

test('SAML browser-tab error has no English fallback in any non-English locale', () => {
  const pending = JSON.parse(fs.readFileSync('releases/translations/pending-transifex.json', 'utf8'));
  assert.ok(!pending.keys.some(entry => entry.key === 'saml-login-not-started'));
  const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync('imports/i18n/data/en.i18n.json', 'utf8'));
  const key = 'saml-login-not-started';
  const files = fs.readdirSync('imports/i18n/data').filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_.])/.test(file));
  assert.equal(files.length, 234);
  for (const file of files) {
    const locale = JSON.parse(fs.readFileSync(`imports/i18n/data/${file}`, 'utf8'));
    assert.ok(locale[key]?.trim(), `${file}: nonempty`);
    assert.notEqual(locale[key], en[key], `${file}: no English fallback`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${file}: source placeholders`);
  }
});

// The browser spec saml-popup-error.e2e.js drives the real POPUP flow. Since
// redirect became the default (2026-10-08) a spec that does not ask for the
// popup - or calls loginWithSaml before the configuration arrived - has its
// page navigated away to the identity provider ("Execution context was
// destroyed"). That is the intended default, so each such spec must ask for the
// popup and wait for it.
function flowSetup(config) {
  const opened = [], assigned = [];
  const Meteor = { Error: class extends Error {}, startup() {} };
  vm.runInNewContext(source, { Meteor, Random: { id: () => 'token' }, URLSearchParams,
    window: { screenX: 0, screenY: 0, outerWidth: 1000, outerHeight: 800, open: url => { opened.push(url); return { closed: false, focus() {} }; },
      location: { assign: url => assigned.push(url) }, sessionStorage: { setItem() {}, getItem() { return null; }, removeItem() {} } },
    ServiceConfiguration: { configurations: { findOne: () => config } },
    Accounts: { callLoginMethod() {} }, setInterval() { return 1; }, clearInterval() {} });
  Meteor.loginWithSaml({ provider: 'p' }, () => {});
  return { opened, assigned };
}
test('the popup opens only when the loaded configuration asks for it', () => {
  const popup = flowSetup({ service: 'saml', loginFlow: 'popup' });
  assert.equal(popup.opened.length, 1); assert.deepEqual(popup.assigned, []);
  // Negative: no configuration yet, or none chosen, is the page redirect.
  for (const config of [undefined, { service: 'saml' }, { service: 'saml', loginFlow: 'redirect' }]) {
    const flow = flowSetup(config);
    assert.equal(flow.opened.length, 0); assert.equal(flow.assigned.length, 1);
    assert.match(flow.assigned[0], /^\/_saml\/authorize\?provider=p&credentialToken=token$/);
  }
});
test('every browser spec that drives the real SAML popup asks for it and waits for the configuration', () => {
  const dir = 'tests/playwright/specs';
  const specs = fs.readdirSync(dir).filter(file => file.endsWith('.js')).map(file => [file, fs.readFileSync(`${dir}/${file}`, 'utf8')])
    .filter(([, text]) => /saveSamlSettings/.test(text) && /Meteor\.loginWithSaml\(\{/.test(text) && /samlResult/.test(text));
  assert.ok(specs.some(([file]) => file === 'saml-popup-error.e2e.js'));
  for (const [file, text] of specs) {
    assert.match(text, /loginFlow: 'popup'/, `${file} asks for the popup flow`);
    assert.match(text, /\.findOne\(\{ service: 'saml' \}\)\?\.loginFlow === 'popup'/, `${file} waits for the popup configuration`);
  }
});
