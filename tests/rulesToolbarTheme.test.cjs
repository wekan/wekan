'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const jade = fs.readFileSync(
  path.join(root, 'client/components/rules/rulesList.jade'),
  'utf8',
);
const formsCss = fs.readFileSync(
  path.join(root, 'client/components/forms/forms.css'),
  'utf8',
);

const toolbarButtons = [
  'js-rules-select-all',
  'js-rules-select-none',
  'js-rules-delete-selected',
  'js-rules-export-selected',
];

for (const className of toolbarButtons) {
  assert.match(jade, new RegExp(`button\\.primary\\.${className}\\(type="button"\\)`),
    `${className} uses the shared primary theme style`);
}

assert.match(jade, /button\.primary\.wide\.js-goto-details/,
  'View rule is the primary reference button');
assert.match(formsCss, /button\.primary,[\s\S]{0,250}background:\s*var\(--theme-accent/,
  'all five buttons take their resting color from the theme accent');
assert.match(formsCss, /button\.primary:hover,[\s\S]{0,300}button\.primary:focus,[\s\S]{0,300}background:\s*var\(--theme-accent/,
  'hover and focus use the same shared theme rule');
assert.match(formsCss, /button\.primary:active,[\s\S]{0,200}background:\s*var\(--theme-accent/,
  'active uses the same shared theme rule');

for (const className of toolbarButtons) {
  assert.doesNotMatch(jade, new RegExp(`button\\.(?:negate|quiet)\\.${className}`),
    `${className} has no conflicting semantic color class`);
}

console.log('rulesToolbarTheme: toolbar matches View rule button');
