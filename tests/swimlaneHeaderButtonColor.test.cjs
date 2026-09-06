'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(
  path.join(root, 'client/components/swimlanes/swimlanes.css'),
  'utf8',
);
const jade = fs.readFileSync(
  path.join(root, 'client/components/swimlanes/swimlaneHeader.jade'),
  'utf8',
);

const ruleBody = selector => {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `${selector} rule exists`);
  const open = css.indexOf('{', start);
  return css.slice(open + 1, css.indexOf('}', open));
};

const controls = [
  '.swimlane .swimlane-header-wrap .swimlane-header-menu .swimlane-collapse-indicator',
  '.swimlane .swimlane-header-wrap .swimlane-header-menu .js-open-swimlane-menu',
  '.swimlane .swimlane-header-wrap .swimlane-header-plus-icon',
];

for (const selector of controls) {
  assert.match(ruleBody(selector), /color:\s*inherit;/,
    `${selector} follows the swimlane title colour`);
  assert.match(ruleBody(`${selector}:hover`), /color:\s*inherit;/,
    `${selector} keeps the title colour while hovered`);
}

assert.match(jade,
  /a\.swimlane-collapse-indicator[^\n]*\n[\s\S]{0,220}uiIconClass 'caret-(?:right|down)'/,
  'the collapse selector belongs to the visible shared caret');
assert.match(jade, /a\.js-open-swimlane-menu[^\n]*\n\s+i\.fa\.fa-bars/,
  'the menu selector belongs to the visible hamburger');
assert.match(jade, /a\.js-open-add-swimlane-menu\.swimlane-header-plus-icon[^\n]*\n\s+i\.fa\.fa-plus/,
  'the add selector belongs to the visible plus');

for (const selector of controls) {
  assert.doesNotMatch(ruleBody(selector), /color:\s*#[0-9a-f]{3,8}/i,
    `${selector} must not override light or dark swimlane title colours`);
}

console.log('swimlaneHeaderButtonColor: title-colour inheritance passed');
