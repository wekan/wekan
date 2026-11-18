'use strict';

// A REST handler that throws Meteor's `new Meteor.Error('not-found', ...)`
// answers 404 with its message, not a 500 "Internal server error".
//
// httpStatusForError knew only 'NotFound', while the handlers - about a
// hundred throw sites in server/ - spell it Meteor's way, 'not-found'. So
// DELETE of a missing swimlane, and a board-member add naming nobody, were
// 500s on the real server, while tests/restWriteRoutes404.test.cjs, which
// stubs the helper, saw the 404 it expected. This runs the real helper.
//
// Run: node tests/restNotFoundStatus.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { httpStatusForError, publicErrorData } = require('../server/lib/apiResponseHelpers');

const meteorError = (error, reason) => Object.assign(new Error(reason || error), { error, reason });

test("Meteor's 'not-found' is a 404 with its message", () => {
  assert.equal(httpStatusForError(meteorError('not-found', 'Swimlane not found')), 404);
  assert.deepEqual(publicErrorData(meteorError('not-found', 'Swimlane not found')),
    { code: 404, data: { error: 'Swimlane not found' } });
  assert.equal(httpStatusForError(meteorError('NotFound')), 404, 'the other spelling still is');
  assert.equal(httpStatusForError(meteorError('board-not-found', 'Board not found')), 404);
});

test('negative: an unknown error is still a 500 that carries no detail', () => {
  const internal = new Error('E11000 duplicate key at /srv/app/bundle/programs/server.js');
  assert.deepEqual(publicErrorData(internal), { code: 500, data: { error: 'Internal server error' } });
  assert.equal(httpStatusForError(meteorError('not-foundish')), 500);
  assert.equal(httpStatusForError(meteorError('cannot-not-founder')), 500);
  assert.equal(httpStatusForError(meteorError('Unauthorized')), 401);
  assert.equal(httpStatusForError(meteorError('Forbidden')), 403);
});

test('negative: every not-found the REST handlers throw is one the helper maps', () => {
  // Any other spelling would fall back to 500 the same way.
  const spellings = new Set();
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name.endsWith('.js')) {
        for (const m of fs.readFileSync(abs, 'utf8').matchAll(/Meteor\.Error\(\s*'([^']*not[-_ ]?found[^']*)'/gi)) spellings.add(m[1]);
      }
    }
  };
  walk(path.join(__dirname, '..', 'server'));
  assert.ok(spellings.has('not-found'));
  for (const name of spellings) assert.equal(httpStatusForError(meteorError(name)), 404, name);
});
