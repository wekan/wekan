'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

function loadTicker() {
  const intervals = new Set();
  const cleared = [];
  let nextId = 1;
  const context = {
    Meteor: {
      setInterval() {
        const id = nextId++;
        intervals.add(id);
        return id;
      },
      clearInterval(id) {
        cleared.push(id);
        intervals.delete(id);
      },
    },
    ReactiveVar: class ReactiveVar {
      constructor(value) { this.value = value; }
      set(value) { this.value = value; }
    },
  };
  const source = read('client/lib/dateNowTicker.js')
    .replace(/^import .*;\n/gm, '')
    .replace('export function subscribeDateNowTicker', 'function subscribeDateNowTicker')
    .concat('\nresult = { subscribeDateNowTicker };');
  vm.runInNewContext(source, context);
  return { ...context.result, intervals, cleared };
}

test('date badges share one minute ticker', () => {
  const ticker = read('client/lib/dateNowTicker.js');
  assert.match(ticker, /const sharedNow = new ReactiveVar/);
  assert.match(ticker, /subscriberCount === 1/);
  assert.match(ticker, /Meteor\.setInterval\(tick, TICK_MS\)/);

  for (const rel of [
    'client/components/cards/cardDate.js',
    'client/components/cards/cardCustomFields.js',
  ]) {
    const source = read(rel);
    assert.match(source, /subscribeDateNowTicker\(\)/);
    assert.doesNotMatch(source, /window\.setInterval/);
  }
});

test('ticker cleanup is reference-counted and unsubscribe is idempotent', () => {
  const ticker = read('client/lib/dateNowTicker.js');
  assert.match(ticker, /if \(!subscribed\) return/);
  assert.match(ticker, /subscriberCount -= 1/);
  assert.match(ticker, /subscriberCount === 0 && intervalId !== null/);
  assert.match(ticker, /Meteor\.clearInterval\(intervalId\)/);
  assert.match(ticker, /intervalId = null/);

  for (const rel of [
    'client/components/cards/cardDate.js',
    'client/components/cards/cardCustomFields.js',
  ]) {
    assert.match(read(rel), /view\.onViewDestroyed\(dateNowTicker\.unsubscribe\)/);
  }
});

test('the last unsubscribe stops the interval and a later subscriber restarts it', () => {
  const { subscribeDateNowTicker, intervals, cleared } = loadTicker();
  const first = subscribeDateNowTicker();
  const second = subscribeDateNowTicker();
  assert.equal(intervals.size, 1);

  first.unsubscribe();
  first.unsubscribe();
  assert.equal(intervals.size, 1);
  assert.equal(cleared.length, 0);

  second.unsubscribe();
  assert.equal(intervals.size, 0);
  assert.equal(cleared.length, 1);

  const third = subscribeDateNowTicker();
  assert.equal(intervals.size, 1);
  third.unsubscribe();
  assert.equal(intervals.size, 0);
  assert.equal(cleared.length, 2);
});
