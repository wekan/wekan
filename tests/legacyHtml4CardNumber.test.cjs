'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..',
  'server/lib/legacyHtml4Pages.js'), 'utf8');

assert.match(source, /sort: 1, cardNumber: 1/,
  'the authorized route-card projection includes its immutable number');
assert.match(source, /board\.allowsCardNumber === true[\s\S]*?Number\.isFinite\(contentCard\?\.cardNumber\)/,
  'the number is visible only under the same board setting as Jade');
assert.match(source, /displayCardTitle = `\$\{cardNumberPrefix\}\$\{card\.title \|\| ''\}`/,
  'the linked content number and route title form one display value');
assert.match(source, /heading: displayCardTitle/);
assert.match(source, /tr\(translate, 'title', 'Title'\), displayCardTitle/);
assert.doesNotMatch(source, /name: 'cardNumber'/,
  'the immutable display number is never accepted from an HTML4 form');

console.log('legacyHtml4CardNumber: setting-gated read-only title parity passed');
