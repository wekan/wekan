#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const cardDate = fs.readFileSync(
  path.join(root, 'client/components/cards/cardDate.js'),
  'utf8',
);
const cardDetails = fs.readFileSync(
  path.join(root, 'client/components/cards/cardDetails.js'),
  'utf8',
);
const datePicker = fs.readFileSync(
  path.join(root, 'client/lib/datepicker.js'),
  'utf8',
);

for (const method of ['setReceived', 'setStart', 'setDue', 'setEnd']) {
  assert.match(
    cardDate,
    new RegExp(`return currentCard\\.${method}\\(date\\);`),
    `${method} callback must return its update promise`,
  );
}

for (const method of ['unsetReceived', 'unsetStart', 'unsetDue', 'unsetEnd']) {
  assert.match(
    cardDate,
    new RegExp(`return currentCard\\.${method}\\(\\);`),
    `${method} callback must return its update promise`,
  );
}

for (const method of [
  'cards.setVoteEnd',
  'cards.unsetVoteEnd',
  'cards.setPokerEnd',
  'cards.unsetPokerEnd',
]) {
  assert.match(
    cardDetails,
    new RegExp(`await Meteor\\.callAsync\\('${method.replace('.', '\\.')}'`),
    `${method} callback must await the server method`,
  );
}

assert.match(
  datePicker,
  /datePicker\.date\.set\(dateObj\);/,
  'a valid edited date must update the reactive popup draft',
);
assert.match(
  datePicker,
  /datePicker\.date\.set\(draftDate\);/,
  'a valid edited time must update the reactive popup draft',
);

console.log('datePickerCallbacks: 14 tests passed');
