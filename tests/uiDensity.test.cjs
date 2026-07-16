'use strict';

// Plain-Node UI regression guard (no Meteor, no browser) for issue #6465:
// desktop density regressions from the v7.98-v8.18 mobile UI work, restored to
// the WeKan 6.09 look. Follows the repo's CSS-guard test style (see
// tests/minicardLabelHeight.test.cjs).
// Run: node tests/uiDensity.test.cjs
//
// Guards, with the regression each one blocks:
//  - base font 14px/18px           (v7.98 clamp -> 18px on desktop, "+28.5% on everything")
//  - headings 22/18/16px           (vw clamps -> 24/20/18px on desktop)
//  - All Boards wrapper 10px/15px  (2vh/2vw -> huge empty header band)
//  - card details docks RIGHT      (v8.18 floating window opened ON TOP of its own card)
//  - card canvas padding 20px      (2.5vw -> ~48px white borders on FullHD)
//  - no force-all-card-text rule   (everything in card details rendered title-sized)
//  - admin table headers wrap      (nowrap + "Select all / Unselect all" text -> huge columns)
//  - zoom pill fixed-px            (vh/vw pill taller than its 28px overflow-hidden row = cut off)
//  - one-click board settings cog  (board menu needed two clicks)

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const squish = s => s.replace(/\s+/g, ' ');

const layouts = read('client/components/main/layouts.css');
const cardDetails = read('client/components/cards/cardDetails.css');
const header = read('client/components/main/header.css');
const settingBody = read('client/components/settings/settingBody.css');
const peopleBody = read('client/components/settings/peopleBody.jade');
const boardHeader = read('client/components/boards/boardHeader.jade');
const listHeader = read('client/components/lists/listHeader.jade');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- Global density -----------------------------------------------------------

test('base font is the 6.09 fixed 14px/18px', () => {
  const base = layouts.match(/html,\s*\nbody,\s*\ninput,[\s\S]*?\{[\s\S]*?\}/);
  assert.ok(base, 'base font rule found');
  assert.ok(base[0].includes('font: 14px Roboto'));
  assert.ok(base[0].includes('line-height: 18px'));
  // negative: the desktop-inflating clamp must not come back
  assert.ok(!/font:\s*clamp\(/.test(base[0]));
});

test('headings are the 6.09 sizes 22/18/16px', () => {
  assert.ok(/h1 \{\s*\n\s*font-size: 22px;/.test(layouts));
  assert.ok(/h2 \{\s*\n\s*font-size: 18px;/.test(layouts));
  assert.ok(/h3,\s*\nh4,\s*\nh5,\s*\nh6 \{\s*\n\s*font-size: 16px;/.test(layouts));
});

test('All Boards wrapper is back to compact 10px/15px', () => {
  const wrapper = layouts.match(/#content > \.wrapper \{[\s\S]*?\}/);
  assert.ok(wrapper, 'wrapper rule found');
  assert.ok(wrapper[0].includes('margin-top: 10px'));
  assert.ok(wrapper[0].includes('padding: 15px'));
  // strip comments — the explanatory comment cites the old vh/vw values
  const declarationsOnly = wrapper[0].replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/[0-9]v[hw]/.test(squish(declarationsOnly)), 'no viewport-relative padding');
});

// --- Card details window --------------------------------------------------------

test('card details default position docks to the END edge, not over the card', () => {
  const rule = cardDetails.match(
    /body\.desktop-mode \.card-details:not\(\.card-details-popup\):not\(\[style\*="left"\]\):not\(\[style\*="top"\]\) \{[\s\S]*?\}/,
  );
  assert.ok(rule, 'default-position rule found');
  assert.ok(rule[0].includes('inset-inline-start: auto'));
  assert.ok(rule[0].includes('inset-inline-end: 8px'));
  assert.ok(rule[0].includes('width: min(650px, 90vw)'));
  // negative: the v8.18 whole-board overlay anchored at the start edge
  assert.ok(!rule[0].includes('inset-inline-start: 20px'));
});

test('card details canvas padding is the 6.09 fixed 20px', () => {
  assert.ok(/\.card-details \.card-details-canvas \{[\s\S]*?padding: 0 20px;/.test(cardDetails));
  assert.ok(!cardDetails.includes('padding: 0 2.5vw'), 'no ~48px viewport borders');
});

test('the force-all-card-text-to-title-size block is gone', () => {
  assert.ok(!cardDetails.includes('.card-details select,'),
    'the v8.18 selector list that flattened the text hierarchy must stay removed');
  assert.ok(!cardDetails.includes('.card-details p,'));
});

test('desktop card window uses a small 3px radius', () => {
  const fixed = cardDetails.match(
    /body\.desktop-mode \.card-details:not\(\.card-details-popup\) \{[\s\S]*?\}/,
  );
  assert.ok(fixed, 'desktop-mode rule found');
  assert.ok(fixed[0].includes('border-radius: 3px'));
  assert.ok(!fixed[0].includes('border-radius: 8px'));
});

// --- Admin panel tables ---------------------------------------------------------

test('org/team feature column headers use compact icon links', () => {
  assert.ok(/a\.js-org-feature-all\(href="#", data-feature="orgSharedTemplates", data-value="true", title="\{\{_ 'select-all'\}\}"\)\s*\n\s*i\.fa\.fa-check-square-o/.test(peopleBody));
  assert.ok(/a\.js-team-feature-all\(href="#", data-feature="teamSyncMembersFromAuth", data-value="false", title="\{\{_ 'unselect-all'\}\}"\)\s*\n\s*i\.fa\.fa-square-o/.test(peopleBody));
  // negative: no full-text links blowing the column width up
  assert.ok(!/data-value="true"\) \{\{_ 'select-all'\}\}/.test(peopleBody));
  assert.ok(!/data-value="false"\) \{\{_ 'unselect-all'\}\}/.test(peopleBody));
});

test('admin table headers may wrap (td keeps nowrap for scrolling)', () => {
  const th = settingBody.match(/\.setting-content \.content-body \.main-body table th \{[\s\S]*?\}/);
  assert.ok(th, 'th rule found');
  assert.ok(th[0].includes('white-space: normal'));
  const td = settingBody.match(/\.setting-content \.content-body \.main-body table td \{[\s\S]*?\}/);
  assert.ok(td, 'td rule found');
  assert.ok(td[0].includes('white-space: nowrap'));
});

// --- Zoom pill -------------------------------------------------------------------

test('zoom pill fits inside the 28px quick-access row', () => {
  const pill = header.match(/#header-quick-access \.zoom-controls \{[\s\S]*?\}/);
  assert.ok(pill, 'zoom-controls rule found');
  assert.ok(pill[0].includes('padding: 2px 8px'));
  assert.ok(pill[0].includes('max-height: 24px'));
  // negative: no viewport-relative sizing that outgrew the clipped row
  assert.ok(!pill[0].includes('0.5vh 1vw'));
});

// --- Right-docked card window must not trap the sidebar ---------------------------

test('archiving/deleting a card closes its details window (openCards cleanup)', () => {
  // #6465 follow-up: the right-docked window (z-index 2001) otherwise stays
  // rendered over the archives sidebar, intercepting its Restore/Delete links.
  const cardDetailsJs = read('client/components/cards/cardDetails.js');
  const archive = cardDetailsJs.match(/'click \.js-archive':[\s\S]*?\n  \}\),/);
  assert.ok(archive, 'archive handler found');
  assert.ok(/Session\.set\('openCards',[\s\S]*?filter\(\(id\) => id !== card\._id\)/.test(archive[0]),
    'archive must drop the card from openCards');
  const del = cardDetailsJs.match(/'click \.js-delete': Popup\.afterConfirm\('cardDelete'[\s\S]*?\n  \}\),/);
  assert.ok(del, 'delete handler found');
  assert.ok(/Session\.set\('openCards',[\s\S]*?filter\(\(id\) => id !== card\._id\)/.test(del[0]),
    'delete must drop the card from openCards');
});

test('an OPEN sidebar stacks above the right-docked card window', () => {
  const sidebar = read('client/components/sidebar/sidebar.css');
  const open = sidebar.match(/\.board-sidebar\.is-open \{[\s\S]*?\}/);
  assert.ok(open, 'is-open rule found');
  assert.ok(open[0].includes('z-index: 2002'),
    'sidebar must beat the card window\'s z-index 2001 when the user opens it');
});

// --- One-click board settings + list link -----------------------------------------

test('board header has a one-click board settings cog', () => {
  assert.ok(/a\.board-header-btn\.js-open-board-menu\(title="\{\{_ 'boardMenuPopup-title'\}\}"\)\s*\n\s*i\.fa\.fa-cog/.test(boardHeader));
});

test('list More popup link input uses a real helper (#6459 companion)', () => {
  assert.ok(listHeader.includes('value="{{ absoluteUrl }}"'));
  assert.ok(!/value="\{\{ rootUrl \}\}"/.test(listHeader), 'rootUrl helper does not exist');
});

console.log(`\n${passed} tests passed`);
