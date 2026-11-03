'use strict';

// The full screen button in the header bar, to the right of the logo. The pure
// part (models/lib/fullscreen.js) is driven with fake documents - the unprefixed
// API, the webkit one, an iPhone, an iframe, a refusal - and the wiring is read
// from the source: the existing "Maximize" label, no new translation, the button
// only where the browser offers the API, and the browser's own events followed.
// tests/playwright/specs/header-fullscreen.e2e.js drives it in a browser.
//
// Run: node tests/fullscreenButton.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { isSupported, isFullscreen, toggle, CHANGE_EVENTS } = require('../models/lib/fullscreen');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

// A document that behaves like a browser's: requesting makes the element current.
function fakeDocument({ prefix = false, enabled = true, refuse = false } = {}) {
  const doc = {};
  const flag = prefix ? 'webkitFullscreenEnabled' : 'fullscreenEnabled';
  const current = prefix ? 'webkitFullscreenElement' : 'fullscreenElement';
  const request = prefix ? 'webkitRequestFullscreen' : 'requestFullscreen';
  const exit = prefix ? 'webkitExitFullscreen' : 'exitFullscreen';
  const calls = [];
  doc[flag] = enabled;
  doc[current] = null;
  doc.documentElement = {
    [request]() {
      calls.push('request');
      if (refuse) return Promise.reject(new TypeError('Permissions check failed'));
      doc[current] = doc.documentElement;
      return Promise.resolve();
    },
  };
  doc[exit] = function () { calls.push('exit'); doc[current] = null; return Promise.resolve(); };
  doc.calls = calls;
  return doc;
}

test('supported only where the API is enabled, in either spelling', () => {
  assert.equal(isSupported(fakeDocument()), true, 'unprefixed (Chrome, Firefox, Safari 16.4+)');
  assert.equal(isSupported(fakeDocument({ prefix: true })), true, 'webkit-prefixed (older Safari, iPadOS before 16.4)');
  // negative: an iframe without allowfullscreen, iPhone Safari and an old browser
  assert.equal(isSupported(fakeDocument({ enabled: false })), false, 'fullscreenEnabled false');
  assert.equal(isSupported(fakeDocument({ prefix: true, enabled: false })), false);
  assert.equal(isSupported({}), false, 'neither name');
  const iphone = fakeDocument();
  delete iphone.fullscreenEnabled;
  assert.equal(isSupported(iphone), false, 'iPhone: the property is missing');
  assert.equal(isSupported(null), false);
  assert.equal(isSupported(undefined), false);
});

test('toggle enters full screen and leaves it again, with either API', async () => {
  for (const prefix of [false, true]) {
    const doc = fakeDocument({ prefix });
    assert.equal(isFullscreen(doc), false);
    assert.equal(await toggle(doc), true, 'entered');
    assert.equal(isFullscreen(doc), true);
    assert.equal(await toggle(doc), false, 'left');
    assert.equal(isFullscreen(doc), false);
    assert.deepEqual(doc.calls, ['request', 'exit']);
  }
});

test('negative: a refusal is an answer, not an error, and an unsupported page is left alone', async () => {
  const refused = fakeDocument({ refuse: true });
  assert.equal(await toggle(refused), false, 'the browser refused: not in full screen, and no throw');
  assert.deepEqual(refused.calls, ['request']);

  const iframe = fakeDocument({ enabled: false });
  assert.equal(await toggle(iframe), false);
  assert.deepEqual(iframe.calls, [], 'nothing is requested where it is not enabled');

  // A request that throws at once, as an old WebKit does, is the same.
  const throws = fakeDocument();
  throws.documentElement.requestFullscreen = () => { throw new Error('boom'); };
  assert.equal(await toggle(throws), false);
});

test('the button is drawn only where supported, beside the logo, with the existing Maximize label', () => {
  const jade = read('client/components/main/header.jade');
  const block = jade.slice(jade.indexOf('if fullscreenSupported'));
  assert.match(block, /^if fullscreenSupported\n\s+a\.board-header-btn\.js-toggle-fullscreen\(href="#" role="button" title="\{\{#if isFullscreen\}\}\{\{_ 'minimize-window'\}\}\{\{else\}\}\{\{_ 'maximize-window'\}\}\{\{\/if\}\}" aria-label="\{\{#if isFullscreen\}\}\{\{_ 'minimize-window'\}\}\{\{else\}\}\{\{_ 'maximize-window'\}\}\{\{\/if\}\}" aria-pressed=/);
  assert.match(block, /i\.fa\.fa-compress[\s\S]{0,60}i\.fa\.fa-expand/);
  // After the logo, before the first collapsible icon, so hiding the icons keeps it.
  assert.ok(jade.indexOf('div.header-logo') < jade.indexOf('js-toggle-fullscreen'), 'after the logo');
  assert.ok(jade.indexOf('js-toggle-fullscreen') < jade.indexOf('.mobile-mode-toggle.js-header-collapsible-icon'), 'before the collapsible icons');
  assert.doesNotMatch(block.split('\n').slice(0, 2).join('\n'), /js-header-collapsible-icon/, 'not itself collapsible');
  // No new translation: the label is the key the popups already use.
  assert.doesNotMatch(jade, /_ 'fullscreen|_ 'full-screen/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.equal(en['maximize-window'], 'Maximize');
  assert.equal(en['minimize-window'], 'Minimize', 'the label while in full screen is the existing Minimize');
  assert.ok(!Object.keys(en).some(k => /full-?screen/i.test(k)), 'no full screen key was added');
});

test('the header follows the browser\'s own events, in both spellings, and lets them go', () => {
  assert.deepEqual(CHANGE_EVENTS, ['fullscreenchange', 'webkitfullscreenchange']);
  const js = read('client/components/main/header.js');
  assert.match(js, /fullscreen\.CHANGE_EVENTS\.forEach\(name => document\.addEventListener\(name, this\.onFullscreenChange\)\)/);
  assert.match(js, /Template\.header\.onDestroyed\(function \(\) \{\n\s+if \(this\.onFullscreenChange\) \{\n\s+fullscreen\.CHANGE_EVENTS\.forEach\(name => document\.removeEventListener\(name, this\.onFullscreenChange\)\)/);
  assert.match(js, /'click \.js-toggle-fullscreen'\(event\) \{\n\s+event\.preventDefault\(\);\n\s+fullscreen\.toggle\(document\);/);
  assert.match(js, /this\.fullscreenSupported\.set\(fullscreen\.isSupported\(document\)\)/);
});
