'use strict';

// One page index per request for the views that subscribe in an autorun
// (models/lib/reportPageIndex.js reportPageKey). A new search's subscription
// starts before the old one stops; under one shared index id DDP's merge box
// showed the OLDER subscription's ids, so the Email view's search for
// "nothing-matches-this" could keep the previous search's row.
// Run: node tests/reportPageKey.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { emailViewPageArgs } = require('../models/lib/emailView');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

// The module is ESM; run just the key function.
const src = read('models/lib/reportPageIndex.js');
const fnSource = src.slice(src.indexOf('export function reportPageKey')).replace('export function', 'function');
const reportPageKey = vm.runInNewContext(`${fnSource.slice(0, fnSource.indexOf('\n}\n') + 2)}; reportPageKey`);

test('each request has its own index id', () => {
  const printer = reportPageKey('board-email-view', emailViewPageArgs('b1', { folder: 'all', page: 1, search: 'printer' }));
  const nothing = reportPageKey('board-email-view', emailViewPageArgs('b1', { folder: 'all', page: 1, search: 'nothing-matches-this' }));
  assert.notEqual(printer, nothing);
  assert.notEqual(reportPageKey('r', ['a', 1]), reportPageKey('r', ['a', 2]), 'another page is another index');
  assert.notEqual(reportPageKey('r', ['a:b']), reportPageKey('r:a', ['b']), 'the report and its arguments cannot run together');
});

test('the server and the client build the same id from what each one has', () => {
  // The client passes the reactive values; the server receives them over DDP,
  // where a missing search or an unset page arrives absent.
  const client = emailViewPageArgs('b1', { folder: 'inbox', page: 1, search: '' });
  const server = emailViewPageArgs('b1', { folder: 'inbox' });
  assert.deepEqual(client, server);
  assert.deepEqual(emailViewPageArgs('b1', { folder: 'inbox', page: 2.7 }), ['b1', 'inbox', 2, '']);
  assert.deepEqual(emailViewPageArgs('b1', { folder: 'inbox', page: -3 }), ['b1', 'inbox', 1, '']);
});

test('negative: no view that subscribes in an autorun reads a shared index id', () => {
  for (const [file, shared] of [
    ['client/components/boards/emailView.js', /reportPageDocs\(Cards, EMAIL_VIEW_PAGE_ID,/],
    ['client/components/boards/publicBoards.js', /ReportPages\.findOne\(PAGE_ID\)/],
  ]) {
    const js = read(file);
    assert.match(js, /this\.autorun\(/, `${file} subscribes in an autorun`);
    assert.doesNotMatch(js, shared, `${file} reads the index of its own request`);
    assert.match(js, /reportPageKey\(/);
  }
  // Admin Panel / Problems stops its subscription before the next one, so its
  // requests never overlap and a fixed id is safe there.
  assert.match(read('client/components/settings/adminProblems.js'),
    /if \(this\.subscription\) \{\s*this\.subscription\.stop\(\);\s*\}[\s\S]{0,900}this\.subscription = Meteor\.subscribe\(/);
});

console.log(`# ${passed} passed`);
