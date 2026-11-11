'use strict';

// #6890: a card's Spent time is decimal hours, and the badge showed them raw
// (0.034722222222222224 after a short Pomodoro). It shows a duration now, the
// leading zero units left out, and the tooltip rounds hours to two decimals.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { formatSpentTime, roundedSpentHours } = require('../models/lib/spentTimeFormat');

test('a duration in days, hours, minutes and seconds', () => {
  assert.equal(formatSpentTime(0.034722222222222224), '2m5s');
  assert.equal(formatSpentTime(12 + 34 / 60 + 56 / 3600), '12h34m56s');
  assert.equal(formatSpentTime(26), '1d2h');
  assert.equal(formatSpentTime(0.5), '30m');
  assert.equal(formatSpentTime(1 / 3600 / 3), '0s');
  assert.equal(formatSpentTime(0), '0s');
});

test('negative: nothing to show for no value, a negative or a non-number', () => {
  for (const v of [null, undefined, -1, NaN, Infinity, '3']) assert.equal(formatSpentTime(v), '', String(v));
});

test('the tooltip hours have at most two decimals', () => {
  assert.equal(roundedSpentHours(0.034722222222222224), '0.03');
  assert.equal(roundedSpentHours(4), '4');
  assert.equal(roundedSpentHours(null), '');
});

test('the badge draws the duration, never the raw hours', () => {
  const src = fs.readFileSync(path.join(__dirname, '../client/components/cards/cardTime.js'), 'utf8');
  const show = src.slice(src.indexOf('showTime()'), src.indexOf('getIsOvertime()', src.indexOf('showTime()')));
  assert.match(show, /formatSpentTime\(card\.getSpentTime\(\)\)/);
  assert.doesNotMatch(src, /\$\{card\.getSpentTime\(\)\}/, 'the tooltip rounds too');
});
