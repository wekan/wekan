'use strict';

// Guard: CodeBleed (2026-10-02). A passwordless sign-in code was Meteor's
// default: 6 hex characters - 16.7 million values - valid for an hour. Failed
// codes are not counted by the account lockout (it counts passwords), and the
// only limit on guessing was Meteor's 5-per-10-seconds rate limit PER
// CONNECTION, which an attacker multiplies by opening connections: with a
// thousand of them, about one guess in ten succeeded within the hour - any
// account, admins included, when passwordless sign-in is enabled.
// Run: node tests/codeBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('a code is long and short-lived enough that spraying it is hopeless', () => {
  const config = read('server/accounts-common.js');
  const length = Number(/tokenSequenceLength: (\d+),/.exec(config)[1]);
  const hours = Number(/loginTokenExpirationHours: ([\d.]+),/.exec(config)[1]);
  assert.ok(length >= 10, 'at least 10 hex characters');
  assert.ok(hours <= 0.25, 'valid at most 15 minutes');
  // The reported spray: ~500 guesses a second for the code's whole life.
  const guesses = 500 * hours * 3600;
  const chance = guesses / 16 ** length;
  assert.ok(chance < 1e-6, `success chance per code ${chance}`);
  const old = (500 * 3600) / 16 ** 6;
  assert.ok(old > 0.1, `the old default gave about ${old.toFixed(2)} per code`);
});

test('the code field accepts the whole code, letters included', () => {
  const jade = read('client/components/main/layouts.jade');
  const field = jade.split('\n').find(line => line.includes('input#passwordless-code('));
  assert.ok(field);
  assert.doesNotMatch(field, /inputmode="numeric"/, 'a hex code has letters');
  assert.match(field, /maxlength="10"/);
});

test('negative: nothing configures a shorter or longer-lived code', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'node_modules' || e.name.startsWith('_build') || e.name === 'tests') return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (rel.endsWith('.js') ? [rel] : []);
  });
  for (const file of ['server', 'config', 'models', 'packages'].flatMap(walk)) {
    for (const m of read(file).matchAll(/tokenSequenceLength:\s*(\d+)/g)) assert.ok(Number(m[1]) >= 10, file);
    for (const m of read(file).matchAll(/loginTokenExpirationHours:\s*([\d.]+)/g)) assert.ok(Number(m[1]) <= 0.25, file);
  }
});
