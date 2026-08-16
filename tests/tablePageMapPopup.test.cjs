'use strict';

// A location cell in an Admin Panel table opens a map, through the SAME chooser
// a card's location uses.
// Run: node tests/tablePageMapPopup.test.cjs
//
// WHAT THIS IS FOR. Admin Panel / Problems / Offices names the places accounts
// log in from - "London", with the country's flag - and a name is only useful if
// it leads somewhere. Clicking it asks which map to open it at, from the eleven
// providers WeKan already offers on a card.
//
// The thing worth pinning is that there is ONE chooser. Two lists of eleven
// providers, in two templates, is eleven options to add a provider to instead of
// one, and they would disagree the first time only one was edited. So the
// provider list lives in client/components/main/mapProvider.jade and both
// callers include it - and this suite fails if a second copy appears.
//
// It also pins the two things that make a location cell either useful or wrong:
// a cell is a link only when the row HAS coordinates (a city name is not a
// position), and the popup's link follows the selection before it is saved.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('tablePageMapPopup:');

// ── the chooser is in one place ────────────────────────────────────────────

test('the provider list exists exactly once in the whole client', () => {
  const withList = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.jade') && read(rel).includes('js-map-provider')) {
        withList.push(rel);
      }
    }
  };
  walk('client');
  assert.deepStrictEqual(withList, ['client/components/main/mapProvider.jade'],
    'the map-provider list must live in ONE template; these have their own copy: '
    + withList.join(', '));
});

test('and both callers include it rather than repeating it', () => {
  for (const caller of [
    'client/components/cards/cardDetails.jade',       // a card's location
    'client/components/settings/tablePage.jade',      // any admin table's location
  ]) {
    assert.ok(read(caller).includes('+mapProviderSelect'),
      `${caller} must include the shared chooser`);
  }
});

test('the helper behind it is the chooser\'s own (negative)', () => {
  // It was a helper on the card's popup, which is why the Admin Panel one would
  // otherwise have needed a second copy of the same six lines.
  assert.ok(/Template\.mapProviderSelect\.helpers/.test(read('client/components/main/mapProvider.js')),
    'mapProviderSelect must define isMapProvider itself');
  assert.ok(!/isMapProvider\(provider\)/.test(read('client/components/cards/cardDetails.js')),
    'cardDetails.js must not keep its own copy of isMapProvider');
});

// ── a cell is a link only when there is a place to open ────────────────────

test('a location cell with no coordinates is not a link', () => {
  // Loaded with a stub for the Meteor-only import, so the real buildRows runs
  // rather than a paraphrase of it.
  const src = read('models/lib/tablePage.js')
    .replace(/^import .*$/gm, '')
    .replace(/^export /gm, '');
  const sandbox = { ReactiveCache: { getUser: () => null }, module: { exports: {} }, TAPi18n: { __: k => k } };
  const fn = new Function(...Object.keys(sandbox), `${src}\nreturn { buildRows };`);
  const { buildRows } = fn(...Object.values(sandbox));

  const columns = [{
    labelKey: 'office-location',
    value: d => d.label,
    location: d => d.loc,
  }];

  const [withCoords, cityOnly, nothing] = buildRows([
    { label: 'London', loc: { latitude: 51.5, longitude: -0.12 } },
    { label: 'GB', loc: { country: 'GB' } },     // a country, no position
    { label: '10.0.0.1', loc: null },
  ], columns).map(row => row.cells[0]);

  assert.deepStrictEqual(withCoords.location,
    { latitude: 51.5, longitude: -0.12, label: 'London' },
    'coordinates make the cell a link, labelled with what the cell says');
  assert.strictEqual(cityOnly.location, null,
    'a city or country WITHOUT coordinates is not a position: a map link built '
    + 'from it would search for the word or invent a place');
  assert.strictEqual(nothing.location, null, 'and no location at all is not one either');
});

test('the template only links the cells that have one (negative)', () => {
  const jade = read('client/components/settings/tablePage.jade');
  assert.ok(/else if location\s*\n\s*a\.js-table-page-map/.test(jade),
    'the anchor must be inside `else if location`, so a cell without one is plain text');
  // Latitude and longitude reach the handler as data attributes; losing either
  // would open a map of the middle of the ocean.
  for (const attr of ['data-latitude', 'data-longitude', 'data-label']) {
    assert.ok(jade.includes(attr), `the anchor must carry ${attr}`);
  }
});

// ── the popup ──────────────────────────────────────────────────────────────

test('the popup builds its link with the SELECTED provider, before saving', () => {
  const js = read('client/components/settings/tablePage.js');
  assert.ok(/'change \.js-map-provider'/.test(js),
    'changing the provider must update the popup');
  assert.ok(/mapLinkFor\(tmpl\.provider\.get\(\)/.test(js),
    'the link must be built from the current selection, not from the saved value - '
    + 'choosing a provider and seeing the old link reads as a broken popup');
  assert.ok(/setMapProvider/.test(js),
    'and saving must go to the same profile.mapProvider a card reads');
});

test('it opens with a title, so it has a header and a close button', () => {
  // A popup with neither a `<name>Popup-title` key nor a titleKey renders with
  // no header at all - tests/popupTitles.test.cjs. This one reuses the phrase
  // the chooser is already labelled with, in every language WeKan has, rather
  // than adding a key to 154 files.
  const js = read('client/components/settings/tablePage.js');
  assert.ok(/Popup\.open\('tablePageMap', \{ titleKey: 'location-open-map-at' \}\)/.test(js),
    'tablePageMap must be opened with a titleKey');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['location-open-map-at'], 'and that key must exist in English');
});

test('the location handler lives on the SHARED table page (negative)', () => {
  // The whole point of putting it there: every report gets it, and a report
  // added later gets it without being told. A copy on an individual report is
  // the duplication this replaced - there were three of the edit-user one.
  const shared = read('client/components/settings/tablePage.js');
  for (const cls of ['js-table-page-edit-user', 'js-table-page-map']) {
    assert.ok(shared.includes(`'click .${cls}'`), `${cls} must be handled on tablePage`);
  }
  const problems = read('client/components/settings/adminProblems.js');
  for (const cls of ['js-table-page-edit-user', 'js-table-page-map']) {
    assert.ok(!problems.includes(`'click .${cls}'`),
      `adminProblems.js must not handle ${cls} itself - the shared table page does`);
  }
});

console.log(`\ntablePageMapPopup: ${passed} tests passed`);
