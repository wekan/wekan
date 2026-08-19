#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dateJs = fs.readFileSync(
  path.join(root, 'client/components/cards/cardDate.js'),
  'utf8',
);
const detailsJade = fs.readFileSync(
  path.join(root, 'client/components/cards/cardDetails.jade'),
  'utf8',
);

assert.match(
  dateJs,
  /function cardFromDateContext\(data = Template\.currentData\(\)\) \{\s*return data\?\.card \|\| data;\s*\}/,
  'date templates accept both a Card and a named-argument context',
);

for (const template of [
  'cardReceivedDate',
  'cardStartDate',
  'cardDueDate',
  'cardEndDate',
]) {
  assert.match(
    detailsJade,
    new RegExp(`\\+${template}\\(card=this canModifyCard=canModifyCard\\)`),
    `${template} receives its Card explicitly beside canModifyCard`,
  );
}

for (const getter of [
  'getReceived',
  'getStart',
  'getDue',
  'getEnd',
  'getVoteEnd',
  'getPokerEnd',
]) {
  assert.doesNotMatch(
    dateJs,
    new RegExp(`Template\\.currentData\\(\\)\\.${getter}\\(`),
    `${getter} is never called directly on a named-argument object`,
  );
}

assert.match(
  dateJs,
  /Popup\.open\(name\)\.call\(\s*cardFromDateContext\(templateInstance\.data\)/,
  'date badge clicks open their popup with the resolved Card',
);

console.log('cardDateContext6615: 12 tests passed');
