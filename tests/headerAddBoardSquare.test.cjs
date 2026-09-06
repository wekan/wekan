'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(
  path.join(root, 'client/components/main/header.css'),
  'utf8',
);
const jade = fs.readFileSync(
  path.join(root, 'client/components/main/header.jade'),
  'utf8',
);

const selector = '#header-quick-access #header-new-board-icon {';
const start = css.lastIndexOf(selector, css.indexOf('@media screen and (max-width: 800px)'));
assert.ok(start >= 0, 'the desktop Add Board size rule exists');
const rule = css.slice(start, css.indexOf('}', start) + 1);

assert.match(rule, /flex:\s*0 0 28px;/,
  'Add Board cannot grow into the top bar spare space');
assert.match(rule, /width:\s*28px;/);
assert.match(rule, /min-width:\s*28px;/);
assert.match(rule, /max-width:\s*28px;/);
assert.match(rule, /height:\s*28px;/,
  'the visible Add Board button is exactly square');
assert.match(rule, /padding:\s*0;/,
  'padding cannot make the square wider than its declared size');
assert.doesNotMatch(rule, /flex-grow:\s*1/,
  'the former ten-button-wide flex spacer must not return');

assert.match(jade, /a#header-new-board-icon\.board-header-btn\.js-create-board[^\n]*\n\s+i\.fa\.fa-plus/,
  'the square selector belongs to the top-header Add Board plus button');

console.log('headerAddBoardSquare: 28px square button passed');
