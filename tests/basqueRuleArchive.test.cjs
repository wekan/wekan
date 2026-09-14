const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
test('Basque rule labels distinguish archiving from storage and restoration direction', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/eu.i18n.json', 'utf8'));
  assert.equal(data['r-archived'], 'Artxibora eraman da');
  assert.equal(data['r-unarchived'], 'Artxibotik berreskuratu da');
  for (const key of ['r-archived', 'r-unarchived']) assert.doesNotMatch(data[key], /bilteg/i);
  const template = fs.readFileSync('client/components/rules/triggers/boardTriggers.jade', 'utf8');
  assert.match(template, /value="archived".*r-archived/);
  assert.match(template, /value="unarchived".*r-unarchived/);
});
