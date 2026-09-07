'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const detailsCss = read('client/components/cards/cardDetails.css');
const detailsJade = read('client/components/cards/cardDetails.jade');
const minicardCss = read('client/components/cards/minicard.css');

const chrome = [
  'card-collapse-toggle',
  'close-card-details',
  'minimize-card-details',
  'maximize-card-details',
  'card-details-menu',
  'card-drag-handle',
  'card-zoom-out',
  'card-zoom-in',
  'card-mobile-desktop-toggle',
  'card-details-menu-mobile-web',
];
// Revert ebb35af50: every control remains present, but its color is no longer
// coupled to the card title through the shared inheritance class.
for (const name of chrome) {
  assert.ok(detailsJade.includes(name), `${name} remains available`);
}
assert.doesNotMatch(detailsJade, /card-header-control/);
assert.doesNotMatch(detailsCss, /card-header-control/);
assert.match(detailsCss, /\.card-collapse-toggle \{[^}]*color: #000;/s,
  'the card collapse control retains its original black color');
assert.doesNotMatch(minicardCss, /\.minicard \.minicard-title,[\s\S]{0,700}color:\s*inherit;/,
  'minicard titles and controls no longer share a color override');
assert.doesNotMatch(detailsCss, /\.card-details-title \.viewer a:hover \{\s*color:\s*inherit;/,
  'formatted card titles retain their previous styling');

for (const color of ['green', 'red', 'purple', 'blue', 'black', 'navy', 'indigo']) {
  assert.match(minicardCss, new RegExp(`\\.minicard-${color} \\{[^}]*color: #fff !important;`, 's'),
    `${color} minicard retains white title contrast`);
}

console.log('cardHeaderColorInheritance: independent controls and retained card palette passed');
