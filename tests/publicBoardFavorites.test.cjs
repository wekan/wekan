'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const {
  starredPublicBoardSelector,
  starredVisibleBoardSelector,
} = require('../models/lib/boardVisibilitySelectors');

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
  assert.match(server, /Meteor\.publish\('starredPublicBoards', async function\(boardIds\) \{\s*check\(boardIds, \[String\]\);\s*if \(!this\.userId\) return this\.ready\(\);/,
    'never for an anonymous subscriber - the instance boards it may include need a signed-in user');
  // #6764: the publication sends every starred board the user may see, not
  // only public ones, through the shared visibility builder.
  assert.match(server, /starredVisibleBoardSelector\(\{\s*boardIds,\s*userId: this\.userId,/);
  assert.match(server, /starredPublicBoardSelector\(user\.profile\?\.starredBoards\)/);
  assert.match(header, /Tracker\.autorun\(\(\) => \{[\s\S]*?Meteor\.subscribe\('starredPublicBoards'/);
  assert.match(list, /starredPublicBoardSelector\(currUser\?\.profile\?\.starredBoards\)/);
});

// #6764: a user whose favorites are all private boards saw an empty header
// Favorites popup, because the starred publication only sent public ones.
test('starred private boards the user is an active member of are selected', () => {
  const sel = starredVisibleBoardSelector({
    boardIds: ['b1', 'b2'], userId: 'u1', orgIds: ['o1'], teamIds: ['t1'], emailDomains: ['ex.com'],
  });
  assert.deepEqual(sel._id, { $in: ['b1', 'b2'] });
  assert.deepEqual(sel.$or, [
    { permission: { $in: ['public', 'instance'] } },
    { members: { $elemMatch: { userId: 'u1', isActive: true } } },
    { orgs: { $elemMatch: { orgId: { $in: ['o1'] }, isActive: true } } },
    { teams: { $elemMatch: { teamId: { $in: ['t1'] }, isActive: true } } },
    { domains: { $elemMatch: { domain: { $in: ['ex.com'] }, isActive: true } } },
  ]);
});

test('a starred private board is never selected without an active relationship', () => {
  // Negative: no clause may match a private board by id alone, and every
  // relationship clause must require isActive (a revoked share stays revoked).
  const sel = starredVisibleBoardSelector({ boardIds: ['b1'], userId: 'u1', orgIds: ['o1'] });
  for (const clause of sel.$or) {
    if (clause.permission) {
      assert.deepEqual(clause.permission.$in, ['public', 'instance']);
      continue;
    }
    const [inner] = Object.values(clause);
    assert.equal(inner.$elemMatch.isActive, true, JSON.stringify(clause));
  }
  assert.equal(starredVisibleBoardSelector({ boardIds: [], userId: 'u1' }), null);
  assert.equal(starredVisibleBoardSelector({ boardIds: null, userId: 'u1' }), null);
  // No user: only the public/instance clause is left.
  assert.deepEqual(starredVisibleBoardSelector({ boardIds: ['b1'] }).$or, [
    { permission: { $in: ['public', 'instance'] } },
  ]);
});
