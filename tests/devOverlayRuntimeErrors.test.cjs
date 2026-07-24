'use strict';

// The rspack dev server (`meteor run`) ships webpack-dev-server's error overlay,
// which catches every window 'error' event and covers the app with a modal
// "Uncaught runtime errors:" panel. A browser sanitises an error thrown by a
// CROSS-ORIGIN script to the content-free message "Script error." — no stack, no
// error object — and iOS Safari raises those from its own machinery and from
// content blockers / extensions (reported on iPad: opening the Share sheet to
// "Add to Home Screen" popped the overlay over All Boards).
//
// rspack.config.js filters exactly that message out of the overlay. The filter is
// serialised with toString() by webpack-dev-server and rebuilt in the browser with
// new Function(), so it must be self-contained. This test round-trips it the same
// way the dev server does and checks that real errors still show.
//
// Run: node tests/devOverlayRuntimeErrors.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const factory = require(path.join(root, 'rspack.config.js'));

// The overlay filter as the dev server would deliver it to the browser:
// Server.js encodeOverlaySettings() -> encodeURIComponent(fn.toString()), then
// client/index.js decodeOverlayOptions() -> new Function(...).
function asBrowserWouldSeeIt(fn) {
  const decoded = decodeURIComponent(encodeURIComponent(fn.toString()));
  return new Function(
    'message',
    `var callback = ${decoded}\n        return callback(message)`,
  );
}

const clientConfig = factory({ isClient: true, isRun: true, isDevelopment: true });

console.log('devOverlayRuntimeErrors:');

test('the dev server overlay gets a runtimeErrors filter', () => {
  const overlay =
    clientConfig.devServer &&
    clientConfig.devServer.client &&
    clientConfig.devServer.client.overlay;
  assert.ok(overlay, 'devServer.client.overlay must be configured');
  assert.strictEqual(typeof overlay.runtimeErrors, 'function',
    'runtimeErrors must be a filter function, not a plain boolean — a boolean ' +
    'would either keep hiding the app or drop real runtime errors too');
  assert.strictEqual(overlay.errors, true,
    'compile errors must still open the overlay');
});

test('the filter survives the toString() -> new Function() round trip', () => {
  const filter = clientConfig.devServer.client.overlay.runtimeErrors;
  // Would throw here if the filter referenced a closure variable or an import.
  const inBrowser = asBrowserWouldSeeIt(filter);
  assert.strictEqual(typeof inBrowser, 'function');
  assert.strictEqual(inBrowser(new Error('Script error.')), false);
});

test('the content-free cross-origin "Script error." is hidden', () => {
  const f = asBrowserWouldSeeIt(clientConfig.devServer.client.overlay.runtimeErrors);
  // Both spellings occur across browsers (Safari/Chrome include the full stop).
  assert.strictEqual(f(new Error('Script error.')), false);
  assert.strictEqual(f(new Error('Script error')), false);
  assert.strictEqual(f(new Error('script error.')), false);
});

test('real runtime errors still open the overlay', () => {
  const f = asBrowserWouldSeeIt(clientConfig.devServer.client.overlay.runtimeErrors);
  assert.strictEqual(f(new Error("undefined is not an object (evaluating 'x.y')")), true);
  assert.strictEqual(f(new TypeError('x.map is not a function')), true);
  // Not a prefix/substring match: an error that merely mentions the phrase is real.
  assert.strictEqual(f(new Error('Script error. while loading board')), true);
});

test('a missing or malformed error never crashes the filter (negative)', () => {
  const f = asBrowserWouldSeeIt(clientConfig.devServer.client.overlay.runtimeErrors);
  // webpack-dev-server always passes an Error, but the filter runs in the browser
  // on whatever the page threw — it must not throw itself.
  assert.strictEqual(f(undefined), true);
  assert.strictEqual(f(null), true);
  assert.strictEqual(f({}), true);
  assert.strictEqual(f(new Error('')), true);
});

test('the overlay config is dev-server only', () => {
  // A production build has no devServer at all; the key must not appear there.
  const prod = factory({ isClient: true, isRun: false, isProduction: true });
  assert.ok(!prod.devServer,
    'devServer must not be added to a production build config');
  const server = factory({ isServer: true, isRun: true, isDevelopment: true });
  assert.ok(!server.devServer,
    'devServer belongs to the client config only');
});

test('merging keeps the remote dev-server WebSocket config', () => {
  // On a remote ROOT_URL (e.g. https://testi.wekan.fi) the Meteor rspack base config
  // sets devServer.client.webSocketURL so HMR can reach the host. Our overlay setting
  // lives under the same devServer.client key, so it must DEEP merge — replacing
  // `client` wholesale would drop the WebSocket URL and break the dev server.
  const { mergeSplitOverlap } = require(
    path.join(root, 'node_modules/@meteorjs/rspack/lib/mergeRulesSplitOverlap.js'));
  const base = {
    devServer: {
      client: { webSocketURL: { hostname: 'testi.wekan.fi', port: 443, protocol: 'wss' } },
      hot: true,
      port: 8080,
    },
  };
  const merged = mergeSplitOverlap(base, clientConfig);
  assert.deepStrictEqual(merged.devServer.client.webSocketURL,
    { hostname: 'testi.wekan.fi', port: 443, protocol: 'wss' },
    'the remote webSocketURL must survive the merge');
  assert.strictEqual(typeof merged.devServer.client.overlay.runtimeErrors, 'function',
    'the overlay filter must survive the merge');
  assert.strictEqual(merged.devServer.hot, true);
});

test('the jade loader and css rules are untouched', () => {
  const rules = clientConfig.module.rules;
  assert.ok(rules.some(r => String(r.test) === String(/\.jade$/)),
    'the jade loader rule must still be there');
  assert.ok(rules.some(r => String(r.test) === String(/\.css$/i)),
    'the client css rule must still be there');
  assert.strictEqual(clientConfig.experiments.css, false);
});

console.log(`\ndevOverlayRuntimeErrors: ${passed} tests passed`);
