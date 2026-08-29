'use strict';

// A list has separate top and bottom add-card forms. The submit event bubbles
// to Template.listBody, where currentTarget is the list rather than the form.
// Pin every value used for insertion to the form that actually submitted.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'client/components/lists/listBody.js'),
  'utf8',
);
const start = source.indexOf('this.addCard = async (evt) => {');
assert.notEqual(start, -1);
const body = source.slice(start, source.indexOf('\n  this.clickOnMiniCard', start));

assert.match(body, /submittedForm = evt\.target\?\.closest\('form'\)/,
  'positive: save resolves the form that emitted submit');
assert.match(body, /\$\(submittedForm\)\.find\('textarea\.js-card-title'\)/,
  'positive: title comes from that form');
assert.match(body, /Blaze\.getData\(submittedForm\)\?\.position/,
  'positive: top/bottom position comes from that form');
assert.match(body, /cardFormComponent\(submittedForm\)/,
  'positive: labels, members and custom fields come from that form');
assert.doesNotMatch(body, /\$\(evt\.currentTarget\)\.find\('textarea'/,
  'negative: the list-wide first textarea can never supply the title');
assert.doesNotMatch(body, /Blaze\.getData\(evt\.currentTarget\)/,
  'negative: the list container can never supply composer position');

console.log('addCardComposerTarget: submitted top/bottom form isolation verified');
