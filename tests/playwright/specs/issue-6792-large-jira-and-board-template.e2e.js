'use strict';
// #6792, from IRC: "my jira import is failing ... it does not fail with 25
// issues, but does with 858" and "is there a way to convert an existing board
// into a template?". The import ran into the transfer boundary's object cap;
// a board became a template only by being rebuilt inside the Templates board.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const { loginWithToken } = require('../helpers/auth');

// A Jira Cloud search result issue as its REST API writes it: some 250
// values with no comments, most of them null custom fields.
const avatars = { '48x48': 'a', '24x24': 'b', '16x16': 'c', '32x32': 'd' };
const person = id => ({ accountId: id, displayName: id, emailAddress: `${id}@example.invalid`, avatarUrls: avatars, active: true, timeZone: 'UTC', accountType: 'atlassian' });
function jiraIssue(index) {
  const fields = {
    summary: `Large ${index}`, status: { name: 'To Do', id: '1', statusCategory: { id: 2, key: 'new', colorName: 'blue-gray', name: 'To Do' } },
    reporter: person('reporter'), creator: person('reporter'), labels: [],
    issuetype: { id: '10001', name: 'Task', subtask: false, iconUrl: 'i', avatarId: 1, hierarchyLevel: 0 },
    project: { id: '1', key: 'BIG', name: 'Big', projectTypeKey: 'software', avatarUrls: avatars },
    priority: { iconUrl: 'i', name: 'Medium', id: '3' }, watches: { watchCount: 1, isWatching: true }, votes: { votes: 0, hasVoted: false },
    created: '2024-01-01T00:00:00.000+0000', updated: '2024-01-01T00:00:00.000+0000',
    comment: { comments: [], maxResults: 0, total: 0, startAt: 0 }, worklog: { startAt: 0, maxResults: 20, total: 0, worklogs: [] },
  };
  for (let c = 10000; c < 10200; c += 1) fields[`customfield_${c}`] = null;
  return { id: String(index), key: `BIG-${index}`, fields };
}

test('a Jira export of 1,100 issues imports - one over the old object cap', async ({ loggedInPage: page }) => {
  test.setTimeout(10 * 60 * 1000);
  const title = `Jira 6792 ${db.uniqueSuffix()}`;
  const source = { board: { name: title }, issues: Array.from({ length: 1100 }, (_, i) => jiraIssue(i)) };
  let boardId;
  try {
    const result = await page.evaluate(async document => {
      try { return { id: await Meteor.callAsync('importBoard', document, {}, 'jira') }; }
      catch (error) { return { error: error.error, reason: error.reason }; }
    }, source);
    expect(result.error).toBeUndefined();
    boardId = result.id;
    expect(db.countDocuments('cards', { boardId })).toBe(1100);
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('negative: a document over the transfer limit is refused with a reason, not an internal error', async ({ loggedInPage: page }) => {
  const title = `Jira too large ${db.uniqueSuffix()}`;
  const result = await page.evaluate(async name => {
    // 101,000 entries: over the 100,000 array cap, sent as one issue's labels.
    const document = { board: { name }, issues: [{ key: 'TL-1', fields: { summary: 'x', labels: Array.from({ length: 101000 }, () => 'l') } }] };
    try { await Meteor.callAsync('importBoard', document, {}, 'jira'); return null; }
    catch (error) { return { error: error.error, reason: error.reason }; }
  }, title);
  expect(result && result.error).toBe('import-too-large');
  expect(result.reason).toMatch(/limit exceeded/);
  expect(db.find('boards', { title })).toHaveLength(0);
});

test('Board menu / Save as Template copies the board into the Board Templates swimlane', async ({ boardPage: page, board, user }) => {
  let templateId;
  try {
    await new BoardPage(page).openSidebar();
    await page.locator('.js-open-board-menu').click();
    await page.locator('.js-save-board-as-template').click();
    await expect.poll(() => db.countDocuments('boards', { type: 'template-board', 'members.userId': user.id })).toBe(1);
    const template = db.find('boards', { type: 'template-board', 'members.userId': user.id }).pop();
    templateId = template._id;
    await expect(page).toHaveURL(new RegExp(`/b/${templateId}/`));
    // The creator is its one member, and its lists and cards are the board's.
    expect(template.members.map(m => m.userId)).toEqual([user.id]);
    expect(db.countDocuments('cards', { boardId: templateId, archived: false })).toBe(3);
    // The linked card that makes it a template, in the user's Templates board.
    const profile = db.findOne('users', { _id: user.id }).profile;
    const link = db.findOne('cards', { linkedId: templateId, type: 'cardType-linkedBoard' });
    expect(link.boardId).toBe(profile.templatesBoardId);
    expect(link.swimlaneId).toBe(profile.boardTemplatesSwimlaneId);
    // The source board is unchanged.
    expect(db.getBoard(board.boardId).type).toBe('board');
    // negative: a template board does not offer to become a template again.
    await new BoardPage(page).openSidebar();
    await page.locator('.js-open-board-menu').click();
    await expect(page.locator('.js-open-archives')).toBeVisible();
    await expect(page.locator('.js-save-board-as-template')).toHaveCount(0);
  } finally {
    if (templateId) {
      db.deleteMany('cards', { linkedId: templateId });
      db.cleanup({ boardIds: [templateId] });
    }
  }
});

test('negative: saveBoardAsTemplate refuses a non-admin and a template board', async ({ page, board, user2 }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
  await loginWithToken(page, user2.id, user2.token);
  const call = id => page.evaluate(async boardId => {
    try { await Meteor.callAsync('saveBoardAsTemplate', boardId); return null; }
    catch (error) { return error.error; }
  }, id);
  expect(await call(board.boardId)).toBe('not-authorized');
  db.updateOne('boards', { _id: board.boardId }, { $set: { type: 'template-board' } });
  db.updateOne('boards', { _id: board.boardId, 'members.userId': user2.id }, { $set: { 'members.$.isAdmin': true } });
  expect(await call(board.boardId)).toBe('already-a-template');
  expect(db.countDocuments('cards', { userId: user2.id, type: 'cardType-linkedBoard' })).toBe(0);
});
