'use strict';

// Source guard for neutral board cards on the All Boards overview.
// Run: node tests/allBoardsNeutralCards.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(
  path.join(__dirname, '..', 'client/components/boards/boardsList.css'),
  'utf8',
);

const neutralRule = css.match(
  /\.board-list > li\.js-board,[\s\S]*?\.board-list > li\.js-board > \.board-list-item > \.js-open-board \{[\s\S]*?\n\}/,
);

assert.ok(neutralRule, 'the All Boards neutral-card rule exists');
assert.ok(
  neutralRule[0].includes('background: #fff !important'),
  'board cards use a plain white background',
);
assert.ok(
  neutralRule[0].includes('background-image: none !important'),
  'saved board colours and images do not paint the full card',
);
assert.match(
  css,
  /\.board-list > li\.js-board > \.board-list-item\.has-background-image::after \{[\s\S]*?display: none;/,
  'the full-card image overlay is disabled',
);
assert.match(
  css,
  /\.board-list > li\.js-board \.board-list-item-name,[\s\S]*?text-shadow: none;/,
  'card text does not retain the image-overlay shadow',
);

console.log('allBoardsNeutralCards: ok');
