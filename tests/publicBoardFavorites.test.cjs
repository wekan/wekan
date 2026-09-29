'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const { starredPublicBoardSelector } = require('../models/lib/boardVisibilitySelectors');

test('a starred public board has a narrow selector', () => {
  // #3249: a star belongs to a signed-in user (the publication refuses
  // anonymous subscribers), so a starred 'instance' board counts as well;
  // a private one still never does.
  assert.deepEqual(starredPublicBoardSelector(['board1', 'board2']), {
    _id: { $in: ['board1', 'board2'] }, permission: { $in: ['public', 'instance'] },
  });
});

test('empty or invalid star lists cannot select arbitrary boards', () => {
  assert.equal(starredPublicBoardSelector([]), null);
  assert.equal(starredPublicBoardSelector(null), null);
  assert.deepEqual(starredPublicBoardSelector(['', null, 3, 'board1']), {
    _id: { $in: ['board1'] }, permission: { $in: ['public', 'instance'] },
  });
});

test('the publication, page query, and client subscription use the public-only selector', () => {
  const server = fs.readFileSync('server/publications/boards.js', 'utf8');
  const header = fs.readFileSync('client/components/main/header.js', 'utf8');
  const list = fs.readFileSync('client/components/boards/boardsList.js', 'utf8');
  assert.match(server, /Meteor\.publish\('starredPublicBoards'/);
  assert.match(server, /Meteor\.publish\('starredPublicBoards', function\(boardIds\) \{\s*check\(boardIds, \[String\]\);\s*if \(!this\.userId\) return this\.ready\(\);/,
    'never for an anonymous subscriber - the instance boards it may include need a signed-in user');
  assert.match(server, /starredPublicBoardSelector\(boardIds\)/);
  assert.match(server, /starredPublicBoardSelector\(user\.profile\?\.starredBoards\)/);
  assert.match(header, /Tracker\.autorun\(\(\) => \{[\s\S]*?Meteor\.subscribe\('starredPublicBoards'/);
  assert.match(list, /starredPublicBoardSelector\(currUser\?\.profile\?\.starredBoards\)/);
});
