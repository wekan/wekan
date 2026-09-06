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
for (const name of chrome) {
  assert.match(detailsJade, new RegExp(`card-header-control[^\\n]*${name}|${name}[^\\n]*card-header-control`),
    `${name} is part of the title-coloured header chrome`);
}

const controlRule = detailsCss.slice(
  detailsCss.indexOf('.card-details .card-details-header .card-header-control,'),
  detailsCss.indexOf('}', detailsCss.indexOf('.card-details .card-details-header .card-header-control,')) + 1,
);
assert.match(controlRule, /card-header-control:hover \.fa/);
assert.match(controlRule, /card-header-control:focus \.fa/);
assert.match(controlRule, /card-header-control:active \.fa/);
assert.match(controlRule, /color:\s*inherit;/);
assert.doesNotMatch(controlRule, /color:\s*#[0-9a-f]{3,8}/i,
  'card header controls never hard-code black, white or grey');
assert.match(detailsCss, /\.card-details-title \.viewer a:hover \{\s*color:\s*inherit;/,
  'formatted title content cannot override the header contrast colour');

assert.match(minicardCss, /\.minicard \.minicard-title,[\s\S]{0,700}\.minicard \.handle:hover \.drag-handle \{\s*color:\s*inherit;/,
  'minicard title, menu and handle share the card text colour in every state');
assert.match(minicardCss, /\.minicard-title \.viewer a:hover \{\s*color:\s*inherit;/,
  'formatted minicard title content keeps the card contrast colour');

const lightColors = [
  'white', 'yellow', 'orange', 'pink', 'lime', 'silver', 'peachpuff',
  'plum', 'gold', 'paleturquoise', 'mistyrose',
];
for (const color of lightColors) {
  assert.match(minicardCss, new RegExp(`\\.minicard-${color} \\{[^}]*color: #000 !important;`, 's'),
    `${color} minicard uses the same black title contrast as opened cards`);
}

for (const color of ['green', 'red', 'purple', 'blue', 'black', 'navy', 'indigo']) {
  assert.match(minicardCss, new RegExp(`\\.minicard-${color} \\{[^}]*color: #fff !important;`, 's'),
    `${color} minicard retains white title contrast`);
}

console.log('cardHeaderColorInheritance: opened and mini card colors passed');
