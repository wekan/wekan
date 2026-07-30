'use strict';

// Plain-Node guard for which browsers Meteor serves the modern bundle (#6557).
// Run: node tests/modernBrowsers.test.cjs
//
// Yandex Browser was the only browser reporting
// "Cannot find module '@swc/helpers/_/_possible_constructor_return'", and the
// reason is not Yandex: it was the only browser being served the LEGACY bundle,
// which was the broken one.
//
// Meteor decides per request. `webapp`'s identifyBrowser() runs the user agent
// through `useragent-ng` and camel-cases the family it reports; `modern-browsers`
// then looks that name up in the minimum versions its packages declared, and
// isModern() returns FALSE for a name nobody declared - so an unknown family gets
// ES5. Yandex Browser's family is "Yandex Browser" → `yandexBrowser`, which
// `modern-browsers` neither has a minimum for nor aliases onto chrome.
//
// This reproduces that decision exactly (the camelCase from webapp_server.js and
// the alias table and lookup from modern-browsers/modern.js) against real user
// agent strings, so the classification is checked rather than assumed - and pins
// that server/modernBrowsers.js declares the minimum that fixes it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const declaration = read('server/modernBrowsers.js');
const imports = read('server/imports.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// ── webapp_server.js: "Mobile Safari" => "mobileSafari" ─────────────────────
function camelCase(name) {
  const parts = String(name).split(' ');
  parts[0] = parts[0].toLowerCase();
  for (let i = 1; i < parts.length; ++i) {
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
  }
  return parts.join('');
}

// ── modern-browsers/modern.js: the alias table, verbatim in shape ───────────
const browserAliases = {
  chrome: ['chromeMobile', 'chromeMobileIOS', 'chromeMobileWebView', 'chromium',
    'headlesschrome'],
  edge: ['ie', 'edgeMobile'],
  firefox: ['firefoxMobile'],
  mobile_safari: ['mobileSafari', 'mobileSafariUI', 'mobileSafariUI/WKWebView'],
  safari: ['appleMail'],
};

// What Meteor's own packages speak for. WeKan adds to this; it can never lower it,
// because setMinimumBrowserVersions keeps the MAXIMUM of what everyone asked for.
const METEOR_MINIMUMS = {
  chrome: 49, edge: 12, firefox: 45, mobile_safari: 10, opera: 38, safari: 10,
  electron: 1,
};

function applyAliases(versions) {
  const out = Object.create(null);
  for (const browser of Object.keys(versions)) {
    out[browser.toLowerCase()] = versions[browser];
  }
  for (let original of Object.keys(browserAliases)) {
    const aliases = browserAliases[original];
    original = original.toLowerCase();
    if (original in out) {
      for (const alias of aliases) {
        if (!(alias.toLowerCase() in out)) out[alias.toLowerCase()] = out[original];
      }
    }
  }
  return out;
}

// isModern(), for the case that matters here: a name with no declared minimum is
// NOT modern, whatever version it is.
function makeIsModern(declared) {
  const minimums = applyAliases({ ...METEOR_MINIMUMS, ...declared });
  return browser => {
    const name = browser && typeof browser.name === 'string' && browser.name.toLowerCase();
    if (!name || !(name in minimums)) return false;
    const min = minimums[name];
    return ~~browser.major >= (Array.isArray(min) ? min[0] : min);
  };
}

// The user agents. Kept as strings so this test needs nothing installed; the
// families beside them are what useragent-ng reports for each (checked against the
// installed package when it is available, below).
const AGENTS = [
  ['Yandex Browser desktop', 'Yandex Browser', 24,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.6.0.0 Safari/537.36'],
  ['Yandex Browser Android', 'Yandex Browser', 24,
    'Mozilla/5.0 (Linux; arm_64; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 YaBrowser/24.4.4.106.00 SA/3 Mobile Safari/537.36'],
  ['Chrome', 'Chrome', 124,
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'],
  ['Firefox', 'Firefox', 126,
    'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0'],
  ['iOS Safari', 'Mobile Safari', 17,
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'],
];

console.log('modernBrowsers:');

test('without a declared minimum, Yandex Browser is served the legacy bundle', () => {
  // The bug, reproduced: this is Meteor's behaviour before WeKan says anything.
  const isModern = makeIsModern({});

  assert.strictEqual(isModern({ name: camelCase('Yandex Browser'), major: 24 }), false,
    'an unknown family is NOT modern in Meteor, whatever its version - which is why '
    + 'every Yandex Browser user got the ES5 bundle');

  // …while the families Meteor's own packages declare are fine, so nothing else
  // was affected and the crash looked Yandex-specific.
  assert.strictEqual(isModern({ name: 'chrome', major: 124 }), true);
  assert.strictEqual(isModern({ name: 'firefox', major: 126 }), true);
  assert.strictEqual(isModern({ name: 'mobileSafari', major: 17 }), true);
});

test('the name Meteor derives for Yandex Browser is the one WeKan declares', () => {
  // A minimum under any other key is a silent no-op: applyAliases lowercases the
  // keys and isModern lowercases the family, and nothing else joins them up.
  assert.strictEqual(camelCase('Yandex Browser'), 'yandexBrowser');
  assert.ok(/yandexBrowser/.test(declaration),
    'server/modernBrowsers.js must use exactly that key');

  const match = declaration.match(/yandexBrowser:\s*(\d+)/);
  assert.ok(match, 'with a numeric minimum version');
  const minimum = parseInt(match[1], 10);

  // Yandex Browser's major version is a year: 18.x (2018) is Chromium 64, past
  // full ES2015 (51) and dynamic import() (63), which is what the modern bundle
  // assumes. Lower than 18 would claim Chromium that predates that; much higher
  // would send current users back to the legacy bundle for no reason.
  assert.ok(minimum >= 18 && minimum <= 24,
    `the minimum must be a version whose Chromium is modern, got ${minimum}`);
});

test('with the declaration, Yandex Browser gets the modern bundle', () => {
  const isModern = makeIsModern({ yandexBrowser: 18 });

  assert.strictEqual(isModern({ name: 'yandexBrowser', major: 24 }), true,
    'the versions in the reports (24.x)');
  assert.strictEqual(isModern({ name: 'yandexBrowser', major: 18 }), true, 'and the minimum');
  assert.strictEqual(isModern({ name: 'yandexBrowser', major: 17 }), false,
    'an older build still gets the legacy bundle, which is the point of a minimum');

  // It only ever ADDS: declaring one family cannot change another.
  assert.strictEqual(isModern({ name: 'chrome', major: 48 }), false, 'chrome 49 is still the bar');
  assert.strictEqual(isModern({ name: 'chrome', major: 49 }), true);
});

test('nothing is claimed for a browser whose version says nothing about its engine', () => {
  // Samsung Internet, Vivaldi, Opera Mobile, Whale, MIUI, UC and QQ Browser are all
  // reported under their own family names and so are all served the legacy bundle
  // too. They are left alone on purpose - their version numbers do not map onto a
  // Chromium version - and the file has to say so, or the next reader will think
  // they were forgotten.
  for (const family of ['Samsung Internet', 'Vivaldi', 'MIUI Browser', 'UC Browser']) {
    assert.ok(declaration.includes(family),
      `${family} is in the same situation and must be named as a deliberate omission`);
  }
  const declared = [...declaration.matchAll(/^\s*setMinimumBrowserVersions\(\{([^}]*)\}/gm)]
    .flatMap(m => [...m[1].matchAll(/(\w+):/g)].map(k => k[1]));
  assert.deepStrictEqual(declared, ['yandexBrowser'],
    'only the browser the reports name is claimed');
});

test('the declaration is loaded by the server, and its package is declared', () => {
  assert.ok(imports.includes("import '/server/modernBrowsers'"),
    'server/imports.js must load it, or it never runs');
  assert.ok(/from 'meteor\/modern-browsers'/.test(declaration),
    'it must come from the modern-browsers package');
  assert.ok(/^modern-browsers/m.test(read('.meteor/packages')),
    'which the app must depend on explicitly, not by accident through babel-compiler');
});

test('useragent-ng really reports these families', () => {
  // The whole test rests on the family strings above. When useragent-ng is
  // installed, check them rather than trust them.
  let lookup;
  try {
    ({ lookup } = require('useragent-ng'));
  } catch (e) {
    console.log('    (skipped: useragent-ng is not installed in this checkout)');
    return;
  }

  for (const [label, family, major, ua] of AGENTS) {
    const agent = lookup(ua);
    assert.strictEqual(agent.family, family, `${label} family`);
    assert.strictEqual(~~agent.major, major, `${label} major version`);
  }
});

console.log(`\n${passed} tests passed`);
