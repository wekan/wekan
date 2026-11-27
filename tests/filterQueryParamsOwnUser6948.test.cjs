'use strict';

// #6948: `?assignee=<own username>` was dropped from the URL on refresh,
// while every other user's username survived. The board publication never
// sends the signed-in user's own document (#6919, server/lib/notCurrentUser.js)
// - it arrives through the accounts publication, after a refresh maybe after
// the board - so the URL's username resolved to nobody, the filter stayed
// empty and the URL sync wrote the empty filter back, removing the param.

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

(async () => {
  const root = path.join(__dirname, '..');
  const { withCurrentUser, parseBoardFilterQueryParams, buildBoardFilterQueryParams } =
    await import(pathToFileURL(path.join(root, 'client', 'lib', 'filterQueryParams.js')).href);

  const boardUsers = [{ _id: 'u2', username: 'otheruser' }];
  const me = { _id: 'u1', username: 'admin', profile: { fullname: 'Admin' } };

  // Positive: the reporter's case - filtering by yourself survives a refresh.
  const users = withCurrentUser(boardUsers, me);
  assert.deepEqual(
    parseBoardFilterQueryParams({ assignee: 'admin' }, users, []).assigneeIds,
    ['u1'],
  );
  assert.deepEqual(
    parseBoardFilterQueryParams({ assignee: 'admin,otheruser' }, users, []).assigneeIds,
    ['u1', 'u2'],
  );
  assert.equal(
    buildBoardFilterQueryParams({ assigneeIds: ['u1'], memberIds: [], labelIds: [] }, users, []).assignee,
    'admin',
  );
  // Only _id and username are taken over, and the input is not changed.
  assert.deepEqual(users[1], { _id: 'u1', username: 'admin' });
  assert.equal(boardUsers.length, 1);

  // Negative: without the current user the own username resolves to nobody
  // (the bug), no user or a user without a username adds nothing, and a
  // current user already in the list is not added twice.
  assert.deepEqual(parseBoardFilterQueryParams({ assignee: 'admin' }, boardUsers, []).assigneeIds, []);
  assert.deepEqual(withCurrentUser(boardUsers, undefined), boardUsers);
  assert.deepEqual(withCurrentUser(boardUsers, { _id: 'u1' }), boardUsers);
  assert.deepEqual(withCurrentUser(null, null), []);
  assert.equal(withCurrentUser([...boardUsers, me], me).length, 2);

  // The board: every username lookup of the URL sync takes the current user
  // in, and the URL is read before it is written, and not before the current
  // user's own document has arrived.
  const body = fs.readFileSync(path.join(root, 'client', 'components', 'boards', 'boardBody.js'), 'utf8');
  const apply = body.slice(body.indexOf('this.applyQueryParamFilters = '), body.indexOf('this.syncFilterQueryParams = '));
  const sync = body.slice(body.indexOf('this.syncFilterQueryParams = '), body.indexOf('this.maybeRepairBoard = '));
  for (const [name, part] of [['applyQueryParamFilters', apply], ['syncFilterQueryParams', sync]]) {
    assert.ok(part.length > 0, name);
    assert.match(part, /withCurrentUser\(/, `${name} adds the current user`);
  }
  const callsOfApply = body.match(/this\.applyQueryParamFilters\(currentBoardId\)/g) || [];
  assert.equal(callsOfApply.length, 1, 'the URL filter is applied in one place');
  const syncRun = body.slice(body.lastIndexOf('this.autorun(', body.indexOf('this.syncFilterQueryParams(currentBoardId);')));
  const applyAt = syncRun.indexOf('this.applyQueryParamFilters(currentBoardId)');
  const writeAt = syncRun.indexOf('this.syncFilterQueryParams(currentBoardId)');
  assert.ok(applyAt > 0 && applyAt < writeAt, 'the URL is read before it is written');
  const wait = syncRun.slice(0, applyAt);
  assert.match(wait, /Meteor\.loggingIn\(\)/, 'waits for the login');
  assert.match(wait, /username/, 'waits for the own username');

  console.log('filterQueryParamsOwnUser6948: ok');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
