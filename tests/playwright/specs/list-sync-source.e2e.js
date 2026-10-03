'use strict';
const http = require('node:http');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const { syncSourceKey } = require('../../../models/lib/listSyncSourceIdentity');
const { cleanupSyncCredentials, sweepSyncCredentials } = require('../../../server/lib/listSyncConfiguration');

let server, base, requests, emptyProjects, heldResponses;
test.beforeAll(async () => {
  requests = [];
  emptyProjects = new Set(['EMPTY']);
  heldResponses = [];
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const project = url.searchParams.get('jql')?.replace('project=', '');
    requests.push({ project, auth: req.headers.authorization });
    // Deliberately overlapping external IDs exercise project-scoped matching.
    const issues = emptyProjects.has(project) ? [] : [{ key: 'SAME-1', fields: {
      summary: project === 'PREVIEW' ? '<script>source title</script>' : `${project} issue`,
      description: '', status: { name: 'Open' },
      ...(project === 'PREVIEW' ? { labels: ['private-label'], timespent: 0,
        attachment: [{ filename: 'private-attachment-name' }],
        customfield_12345: { value: 'private-custom-value' },
        '<script>extension</script>': 'private-unknown-value' } : {}),
    } }];
    if (project === 'SCOPED') issues.push({ key: 'SAME-2', fields: {
      summary: 'Hidden source title', description: 'Hidden source description', status: { name: 'Open' },
    } });
    const respond = () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ startAt: 0, total: issues.length, issues }));
    };
    if (project === 'CONCURRENT') {
      heldResponses.push(respond);
    } else respond();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

test('concurrent Sync runs create one card, and a moved card blocks replacement in the popup', async ({ page, browser, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'CONCURRENT', token: 'concurrency-test-token' };
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  try {
    await loginWithToken(page, user.id, user.token);
    // Its own resume token: two contexts sharing one would both be logged out
    // if either ended its session (tests/e2eSessionTokens.test.cjs).
    await loginWithToken(second, user.id, db.addResumeToken(user.id));
    await openBoard(page, board.boardId, board.slug);
    await openBoard(second, board.boardId, board.slug);
    await call(page, 'setListSyncSource', listId, config);
    const running = call(page, 'syncListNow', listId);
    await expect.poll(() => heldResponses.length).toBe(1);
    const busy = await call(second, 'syncListNow', listId);
    expect(busy.error).toContain('Sync is already running');
    const rejectedSave = await second.evaluate(async ({ id, config }) => {
      try { await Meteor.callAsync('setListSyncSource', id, { ...config, projectKey: 'TWO' }); return 'accepted'; }
      catch (error) { return error.error; }
    }, { id: listId, config });
    expect(rejectedSave).toBe('sync-busy');
    await openSync(second, listId);
    await second.locator('.js-list-sync-project-key').fill('TWO');
    await second.locator('.js-list-sync-save').click();
    await expect(second.locator('.pop-over .list-sync-now-error')).toContainText('Sync is already running');
    expect(db.findOne('lists', { _id: listId }).syncSource.projectKey).toBe('CONCURRENT');
    expect(db.findOne('listSyncCredentials', { listId }).sourceKey).toBe(syncSourceKey(config));
    expect(heldResponses).toHaveLength(1);
    heldResponses.splice(0).forEach(send => send());
    expect(await running).toMatchObject({ created: 1, archived: 0 });
    expect(db.findOne('listSyncLeases', { _id: listId })).toBeNull();
    const cards = db.find('cards', { listId, syncExternalId: 'SAME-1' });
    expect(cards).toHaveLength(1);
    expect(cards[0]._id).toMatch(/^sync-[a-f0-9]{64}$/);
    // Keep the identity but move the card out of the watched list. A retried
    // creation must not replace this local work or silently count it as synced.
    const otherList = db.find('lists', { boardId: board.boardId }).find(list => list._id !== listId);
    expect(otherList).toBeTruthy();
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { listId: otherList._id, title: 'Moved local work' } });
    await openSync(page, listId);
    await page.locator('.js-list-sync-now').click();
    await expect.poll(() => heldResponses.length).toBe(1);
    heldResponses.splice(0).forEach(send => send());
    await expect(page.locator('.pop-over .list-sync-now-error')).toContainText('Sync creation conflict');
    expect(db.find('cards', { boardId: board.boardId, syncExternalId: 'SAME-1' })).toHaveLength(1);
    expect(db.findOne('cards', { _id: cards[0]._id })).toMatchObject({ listId: otherList._id, title: 'Moved local work' });
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { listId, title: cards[0].title } });
    const retry = call(page, 'syncListNow', listId);
    await expect.poll(() => heldResponses.length).toBe(1);
    heldResponses.splice(0).forEach(send => send());
    expect(await retry).toMatchObject({ created: 0, archived: 0 });
  } finally {
    heldResponses.splice(0).forEach(send => send());
    await secondContext.close();
    db.deleteMany('listSyncCredentials', { listId });
  }
});

const call = (page, name, ...args) => page.evaluate(({ name, args }) => Meteor.callAsync(name, ...args), { name, args });
const openSync = (page, listId) => page.evaluate(list => {
  Popup.close();
  Popup.open('listSync', { dataContext: list })({ currentTarget: document.body,
    target: document.body, preventDefault() {}, stopPropagation() {} });
}, db.findOne('lists', { _id: listId }));

for (const disposition of ['moved', 'detached']) test(`Sync popup creates a durable replacement while keeping ${disposition} local work intact`, async ({ page, user, board }) => {
  const lists = db.find('lists', { boardId: board.boardId });
  const listId = lists[0]._id;
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  try {
    await call(page, 'setListSyncSource', listId, { type: 'jira', url: base, projectKey: 'ONE', token: 'replacement-test-token' });
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 1 });
    const card = db.findOne('cards', { listId, syncExternalId: 'SAME-1' });
    db.updateOne('cards', { _id: card._id }, disposition === 'moved'
      ? { $set: { listId: lists[1]._id, title: 'Private moved work' } }
      : { $set: { title: 'Private moved work' }, $unset: { syncExternalId: '', syncSourceType: '', syncSourceKey: '', syncLastSource: '' } });
    const original = db.findOne('cards', { _id: card._id });
    await openSync(page, listId);
    await page.locator('.js-list-sync-now').click();
    const conflict = page.locator('.list-sync-conflict').first();
    await expect(conflict).toContainText('[SAME-1] ONE issue');
    await expect(conflict).not.toContainText('Private moved work');
    const preview = await call(page, 'syncListNow', listId);
    const row = preview.conflicts[0];
    const stale = { cardId: row.cardId, field: 'creation', choice: 'replace', fingerprint: row.fingerprint };
    emptyProjects.add('ONE');
    expect(await call(page, 'resolveListSyncConflict', listId, stale)).toHaveProperty('error');
    expect(db.find('listSyncTargets', { listId })).toHaveLength(0);
    emptyProjects.delete('ONE');
    await conflict.locator('[data-choice="replace"]').click();
    await expect.poll(() => db.find('cards', { listId, syncExternalId: 'SAME-1' }).length).toBe(1);
    const replacement = db.findOne('cards', { listId, syncExternalId: 'SAME-1' });
    expect(replacement._id).toMatch(/^sync-replacement-[a-f0-9]{64}$/);
    expect(replacement._id).not.toBe(card._id);
    expect(db.findOne('cards', { _id: card._id })).toEqual(original);
    const decision = db.findOne('listSyncTargets', { listId });
    expect(decision.targetId).toBe(replacement._id);
    for (const [method, args] of [
      ['/listSyncTargets/insert', [{ ...decision, _id: `forged-${listId}` }]],
      ['/listSyncTargets/update', [{ _id: decision._id }, { $set: { targetId: 'forged' } }]],
      ['/listSyncTargets/remove', [{ _id: decision._id }]],
    ]) {
      const refused = await page.evaluate(async ({ method, args }) => {
        try { await Meteor.callAsync(method, ...args); return false; } catch (error) { return true; }
      }, { method, args });
      expect(refused).toBe(true);
    }
    expect(db.findOne('listSyncTargets', { listId })).toEqual(decision);
    await expect(page.locator('.js-list-sync-now')).toBeEnabled();
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 0 });
    expect(await call(page, 'resolveListSyncConflict', listId, stale)).toHaveProperty('error');
    expect(db.find('cards', { listId, syncExternalId: 'SAME-1' })).toHaveLength(1);
    expect(db.findOne('cards', { _id: card._id })).toEqual(original);
  } finally {
    emptyProjects.delete('ONE');
    db.deleteMany('listSyncTargets', { listId });
    db.deleteMany('listSyncCredentials', { listId });
  }
});

test('Sync preview reports saved changes and omitted fields without changing cards or status', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'PREVIEW', token: 'preview-private-token' };
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  try {
    await call(page, 'setListSyncSource', listId, config);
    const originalCards = db.find('cards', { boardId: board.boardId });
    const originalList = db.findOne('lists', { _id: listId });
    expect(db.find('listSyncRunReports', { listId })).toHaveLength(0);
    await openSync(page, listId);
    await page.locator('.js-list-sync-preview').click();
    const preview = page.locator('.list-sync-preview');
    await expect(preview).toContainText('Create cards: 1');
    await expect(preview).toContainText('<script>source title</script>');
    await expect(preview.locator('script')).toHaveCount(0);
    await expect(preview).toContainText('Spent time (hours): 1');
    await expect(preview).toContainText('Labels: 1');
    await expect(preview).not.toContainText('private-label');
    await expect(preview).not.toContainText('preview-private-token');
    const sourceCoverage = preview.locator('.list-sync-source-coverage');
    await expect(sourceCoverage).toContainText('/issues/*/fields/attachment: 1');
    await expect(sourceCoverage).toContainText('/issues/*/fields/customfield_12345: 1');
    await expect(sourceCoverage).toContainText('<script>extension<~1script>');
    await expect(sourceCoverage.locator('script')).toHaveCount(0);
    await expect(sourceCoverage).not.toContainText('private-attachment-name');
    await expect(sourceCoverage).not.toContainText('private-custom-value');
    await expect(sourceCoverage).not.toContainText('private-unknown-value');
    expect(db.find('cards', { boardId: board.boardId })).toEqual(originalCards);
    expect(db.findOne('lists', { _id: listId })).toEqual(originalList);
    await page.locator('.js-list-sync-project-key').fill('UNSAVED');
    await expect(preview).toHaveCount(0);
    await page.locator('.js-list-sync-preview').click();
    await expect(preview).toContainText('Based on saved settings');
    await expect(preview).toContainText('Create cards: 1');
    expect(requests.at(-1).project).toBe('PREVIEW');
    expect(db.find('listSyncRunReports', { listId })).toHaveLength(0);
    await page.locator('.js-list-sync-now').click();
    await expect.poll(() => db.find('cards', { listId, syncExternalId: 'SAME-1' }).length).toBe(1);
    await expect(page.locator('.js-list-sync-preview')).toBeEnabled();
    const reports = await call(page, 'listSyncRunReports', listId);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ status: 'completed-with-warnings', created: 1 });
    expect(JSON.stringify(reports)).not.toMatch(/private-attachment-name|preview-private-token|private-custom-value/);
    await page.locator('.js-list-sync-reports').click();
    const history = page.locator('.list-sync-run-reports');
    await expect(history).toContainText('Completed with omitted or converted fields');
    await history.locator('summary').click();
    await expect(history).toContainText('/issues/*/fields/attachment');
    await expect(history.locator('script')).toHaveCount(0);
    await expect(history).not.toContainText('private-attachment-name');
    const settled = db.findOne('lists', { _id: listId });
    const cards = db.find('cards', { listId });
    expect(cards.find(card => card.syncExternalId === 'SAME-1').syncLastSource.description).toBe('');
    await page.locator('.js-list-sync-preview').click();
    await expect(preview).toContainText('Update cards: 0');
    expect(db.find('cards', { listId })).toEqual(cards);
    expect(db.findOne('lists', { _id: listId })).toEqual(settled);
    emptyProjects.add('PREVIEW');
    await page.locator('.js-list-sync-preview').click();
    await expect(preview).toContainText('Archive cards: 1');
    expect(db.findOne('cards', { listId, syncExternalId: 'SAME-1' }).archived).not.toBe(true);
    emptyProjects.delete('PREVIEW');
    db.updateOne('cards', { listId, syncExternalId: 'SAME-1' }, { $set: { title: 'Local', 'syncLastSource.title': 'Original' } });
    const conflictCard = db.findOne('cards', { listId, syncExternalId: 'SAME-1' });
    await page.locator('.js-list-sync-preview').click();
    await expect(preview).toContainText('Resolve the conflicts below');
    await expect(page.locator('.list-sync-conflict')).toContainText('Local');
    expect(db.findOne('cards', { _id: conflictCard._id })).toEqual(conflictCard);
    expect(db.findOne('lists', { _id: listId })).toEqual(settled);
    await page.locator('.js-resolve-sync-conflict[data-choice="source"]').click();
    await expect(page.locator('.pop-over .list-sync-now-success')).toBeVisible();
    await page.locator('.js-list-sync-preview').click();
    await expect(preview).toContainText('Update cards: 0');
    expect(db.findOne('cards', { _id: conflictCard._id }).syncLastSource.description).toBe('');
  } finally { emptyProjects.delete('PREVIEW'); db.deleteMany('listSyncCredentials', { listId }); }
});

test('Sync popup resolves text conflicts, rejects stale previews and preserves local choices on retry', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  try {
    await call(page, 'setListSyncSource', listId, { type: 'jira', url: base, projectKey: 'ONE', token: 'conflict-test-token' });
    await call(page, 'syncListNow', listId);
    const card = db.findOne('cards', { listId, syncExternalId: 'SAME-1' });
    const edit = title => db.updateOne('cards', { _id: card._id }, { $set: { title, 'syncLastSource.title': 'Original' } });
    edit('Local title <script>not executable</script>');
    await openSync(page, listId);
    await page.locator('.js-list-sync-now').click();
    const conflict = page.locator('.list-sync-conflict').first();
    await expect(conflict).toContainText('Local title <script>not executable</script>');
    await expect(conflict).toContainText('ONE issue');
    await expect(conflict.locator('script')).toHaveCount(0);
    await conflict.locator('[data-choice="local"]').click();
    await expect(page.locator('.pop-over .list-sync-now-success')).toBeVisible();
    expect(db.findOne('cards', { _id: card._id }).title).toBe('Local title <script>not executable</script>');
    expect(db.findOne('cards', { _id: card._id }).syncLastSource.title).toBe(card.title);
    expect((await call(page, 'syncListNow', listId)).conflicts).toBeUndefined();

    edit('Second local title');
    await page.locator('.js-list-sync-now').click();
    await expect(conflict).toContainText('Second local title');
    // New local work invalidates a previously displayed choice.
    db.updateOne('cards', { _id: card._id }, { $set: { title: 'Newer local title' } });
    await conflict.locator('[data-choice="source"]').click();
    await expect(page.locator('.pop-over .list-sync-now-error')).toContainText('conflict changed');
    expect(db.findOne('cards', { _id: card._id }).title).toBe('Newer local title');
    await page.locator('.js-list-sync-now').click();
    await expect(conflict).toContainText('Newer local title');
    await conflict.locator('[data-choice="source"]').click();
    await expect(page.locator('.pop-over .list-sync-now-success')).toBeVisible();
    expect(db.findOne('cards', { _id: card._id }).title).toBe(card.title);

    edit('Private local title');
    const preview = (await call(page, 'syncListNow', listId)).conflicts[0];
    const resolution = { cardId: preview.cardId, field: preview.field, fingerprint: preview.fingerprint, choice: 'source' };
    const members = db.findOne('boards', { _id: board.boardId }).members;
    try {
      db.updateOne('boards', { _id: board.boardId }, { $set: { members: members.map(member => member.userId === user.id
        ? { ...member, isAdmin: false, isNormalAssignedOnly: true } : member) } });
      const restricted = await call(page, 'syncListNow', listId);
      expect(restricted).toMatchObject({ reviewOnly: true, conflicts: [] });
      const denied = await page.evaluate(async ({ id, resolution }) => {
        try { return (await Meteor.callAsync('resolveListSyncConflict', id, resolution)).error; }
        catch (error) { return error.error; }
      }, { id: listId, resolution });
      expect(denied).toContain('conflict changed');
      expect(db.findOne('cards', { _id: card._id }).title).toBe('Private local title');
    } finally { db.updateOne('boards', { _id: board.boardId }, { $set: { members } }); }
  } finally { db.deleteMany('listSyncCredentials', { listId }); }
});

test('duplicate mappings become local cards without content loss and stale groups cannot be repaired blindly', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  try {
    await call(page, 'setListSyncSource', listId, { type: 'jira', url: base, projectKey: 'ONE', token: 'duplicate-test-token' });
    await call(page, 'syncListNow', listId);
    const primary = db.findOne('cards', { listId, syncExternalId: 'SAME-1' });
    const duplicateId = `zz-${primary._id}`;
    db.insertOne('cards', { ...primary, _id: duplicateId, title: 'Duplicate local title',
      description: 'Keep this local description', assignees: [user.id] });
    const before = db.findOne('cards', { _id: duplicateId });
    const preview = (await call(page, 'syncListNow', listId)).conflicts[0];
    expect(preview).toMatchObject({ duplicate: true, cardId: duplicateId });
    await openSync(page, listId);
    await page.locator('.js-list-sync-now').click();
    const row = page.locator('.list-sync-conflict').first();
    await expect(row).toContainText('Duplicate local title');
    await expect(row).toContainText(primary.title);
    db.updateOne('cards', { _id: primary._id }, { $set: { title: 'Changed retained title' } });
    await row.locator('[data-choice="detach"]').click();
    await expect(page.locator('.pop-over .list-sync-now-error')).toContainText('conflict changed');
    expect(db.findOne('cards', { _id: duplicateId }).syncExternalId).toBe('SAME-1');
    await page.locator('.js-list-sync-now').click();
    await expect(row).toContainText('Changed retained title');
    await row.locator('[data-choice="detach"]').click();
    await expect(page.locator('.pop-over .list-sync-now-success')).toBeVisible();
    const after = db.findOne('cards', { _id: duplicateId });
    for (const key of ['syncExternalId', 'syncSourceType', 'syncSourceKey', 'syncLastSource']) expect(after[key]).toBeUndefined();
    for (const key of ['title', 'description', 'assignees', 'boardId', 'listId', 'swimlaneId', 'archived']) expect(after[key]).toEqual(before[key]);
    expect(db.find('cards', { listId, syncExternalId: 'SAME-1' }).map(card => card._id)).toEqual([primary._id]);
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 0, archived: 0 });
    expect(db.findOne('cards', { _id: duplicateId }).description).toBe(before.description);
  } finally { db.deleteMany('listSyncCredentials', { listId }); }
});

for (const restricted of [false, true]) test(`archive conflict keeps the parent local and leaves subtasks intact (${restricted ? 'assigned-only' : 'unrestricted'})`, async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const members = db.findOne('boards', { _id: board.boardId }).members;
  const projectKey = restricted ? 'ARCHIVE_SCOPED' : 'ARCHIVE_ALL';
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  try {
    await call(page, 'setListSyncSource', listId, { type: 'jira', url: base, projectKey, token: 'archive-test-token' });
    await call(page, 'syncListNow', listId);
    const parent = db.findOne('cards', { listId, syncExternalId: 'SAME-1' });
    db.updateOne('cards', { _id: parent._id }, { $set: { assignees: [user.id] } });
    const child = { ...parent, _id: `child-${parent._id}`, parentId: parent._id,
      title: 'Private subcard title', description: 'Private subcard text', assignees: [] };
    for (const key of ['syncExternalId', 'syncSourceType', 'syncSourceKey', 'syncLastSource']) delete child[key];
    db.insertOne('cards', child);
    const childBefore = db.findOne('cards', { _id: child._id });
    if (restricted) db.updateOne('boards', { _id: board.boardId }, { $set: { members: members.map(member => member.userId === user.id
      ? { ...member, isAdmin: false, isNormalAssignedOnly: true } : member) } });
    emptyProjects.add(projectKey);
    const preview = await call(page, 'syncListNow', listId);
    expect(preview.conflicts[0]).toMatchObject({ archive: true, cardId: parent._id });
    expect(JSON.stringify(preview)).not.toContain(child._id);
    expect(JSON.stringify(preview)).not.toContain('Private subcard');
    await openSync(page, listId);
    await page.locator('.js-list-sync-now').click();
    await expect(page.locator('.list-sync-conflict')).toContainText('Archive blocked by active subcards');
    // The upstream item returned after the displayed preview: detaching must
    // not silently use an outdated source-absence decision.
    emptyProjects.delete(projectKey);
    await page.locator('.js-resolve-sync-conflict[data-choice="detach"]').click();
    await expect(page.locator('.pop-over .list-sync-now-error')).toContainText('conflict changed');
    expect(db.findOne('cards', { _id: parent._id }).syncExternalId).toBe('SAME-1');
    emptyProjects.add(projectKey);
    await page.locator('.js-list-sync-now').click();
    await expect(page.locator('.list-sync-conflict')).toContainText('Archive blocked by active subcards');
    await page.locator('.js-resolve-sync-conflict[data-choice="detach"]').click();
    await expect(page.locator('.pop-over .list-sync-now-success')).toBeVisible();
    const after = db.findOne('cards', { _id: parent._id });
    expect(after.title).toBe(parent.title); expect(after.archived).toBe(false);
    expect(after.assignees).toEqual([user.id]);
    expect(after.syncExternalId).toBeUndefined(); expect(after.syncLastSource).toBeUndefined();
    expect(db.findOne('cards', { _id: child._id })).toEqual(childBefore);
    expect((await call(page, 'syncListNow', listId)).error).toBeUndefined();
    expect(db.findOne('cards', { _id: parent._id }).archived).toBe(false);
    expect(db.findOne('cards', { _id: child._id })).toEqual(childBefore);
  } finally {
    emptyProjects.delete(projectKey);
    db.updateOne('boards', { _id: board.boardId }, { $set: { members } });
    db.deleteMany('listSyncCredentials', { listId });
  }
});

test('assigned-only writers resolve their own conflicts without reading or changing other Sync cards', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const members = db.findOne('boards', { _id: board.boardId }).members;
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  try {
    await call(page, 'setListSyncSource', listId, { type: 'jira', url: base, projectKey: 'SCOPED', token: 'scoped-test-token' });
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 2 });
    const own = db.findOne('cards', { listId, syncExternalId: 'SAME-1' });
    const hidden = db.findOne('cards', { listId, syncExternalId: 'SAME-2' });
    db.updateOne('cards', { _id: own._id }, { $set: { assignees: [user.id], title: 'My local choice', 'syncLastSource.title': 'Original' } });
    db.updateOne('cards', { _id: hidden._id }, { $set: { assignees: [], title: 'Hidden local title', 'syncLastSource.title': 'Original' } });
    const hiddenBefore = db.findOne('cards', { _id: hidden._id });
    const sourceBefore = db.findOne('lists', { _id: listId }).syncSource;
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: members.map(member => member.userId === user.id
      ? { ...member, isAdmin: false, isNormalAssignedOnly: true } : member) } });
    const fetchCount = requests.length;
    const forbiddenPreview = await call(page, 'previewListSync', listId);
    expect(forbiddenPreview.error).toContain('Full-list write access');
    expect(JSON.stringify(forbiddenPreview)).not.toMatch(/Hidden|SAME-2/);
    expect(requests).toHaveLength(fetchCount);
    const reportDenied = await page.evaluate(async listId => {
      try { await Meteor.callAsync('listSyncRunReports', listId); return 'allowed'; }
      catch (error) { return error.error; }
    }, listId);
    expect(reportDenied).toBe('not-authorized');
    const review = await call(page, 'syncListNow', listId);
    expect(review.reviewOnly).toBe(true); expect(review.conflicts).toHaveLength(1);
    expect(review.conflicts[0].cardId).toBe(own._id);
    expect(JSON.stringify(review)).not.toMatch(/Hidden|SAME-2/);
    await openSync(page, listId);
    await page.locator('.js-list-sync-now').click();
    await expect(page.locator('.list-sync-conflict')).toHaveCount(1);
    await page.locator('.js-resolve-sync-conflict[data-choice="local"]').click();
    await expect(page.locator('.pop-over .list-sync-now-success')).toContainText('Full-list Sync was not run');
    expect(db.findOne('cards', { _id: own._id }).title).toBe('My local choice');
    expect(db.findOne('cards', { _id: hidden._id })).toEqual(hiddenBefore);
    expect(db.findOne('lists', { _id: listId }).syncSource).toEqual(sourceBefore);

    db.updateOne('cards', { _id: own._id }, { $set: { 'syncLastSource.title': 'Original' } });
    const preview = (await call(page, 'syncListNow', listId)).conflicts[0];
    db.updateOne('cards', { _id: own._id }, { $set: { assignees: [] } });
    const stale = await call(page, 'resolveListSyncConflict', listId, {
      cardId: own._id, field: preview.field, fingerprint: preview.fingerprint, choice: 'source',
    });
    expect(stale.error).toContain('conflict changed');
    expect(db.findOne('cards', { _id: own._id }).title).toBe('My local choice');
    expect((await call(page, 'syncListNow', listId)).conflicts).toEqual([]);
    expect(db.findOne('cards', { _id: hidden._id })).toEqual(hiddenBefore);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members } });
    db.deleteMany('listSyncCredentials', { listId });
  }
});

test('expired Sync worker stops before reconciling after a settings save reclaims its lease', async ({ page, browser, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'CONCURRENT', token: 'old-test-token' };
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  try {
    await loginWithToken(page, user.id, user.token);
    // Its own resume token: two contexts sharing one would both be logged out
    // if either ended its session (tests/e2eSessionTokens.test.cjs).
    await loginWithToken(second, user.id, db.addResumeToken(user.id));
    await call(page, 'setListSyncSource', listId, config);
    const running = call(page, 'syncListNow', listId);
    await expect.poll(() => heldResponses.length).toBe(1);
    db.updateOne('listSyncLeases', { _id: listId }, { $set: { expiresAt: new Date(0) } });
    const replacement = { ...config, projectKey: 'TWO', token: 'replacement-test-token' };
    expect(await call(second, 'setListSyncSource', listId, replacement)).toEqual({ ok: true });
    heldResponses.splice(0).forEach(send => send());
    expect((await running).error).toContain('reservation expired');
    expect(db.find('cards', { listId, syncExternalId: 'SAME-1' })).toHaveLength(0);
    expect(db.findOne('lists', { _id: listId }).syncSource).toMatchObject({ projectKey: 'TWO' });
    expect(db.findOne('lists', { _id: listId }).syncSource.lastSyncError).toBeUndefined();
    expect(db.findOne('listSyncCredentials', { listId }).sourceKey).toBe(syncSourceKey(replacement));
    expect(await call(second, 'syncListNow', listId)).toMatchObject({ created: 1 });
  } finally {
    heldResponses.splice(0).forEach(send => send());
    await secondContext.close();
    db.deleteMany('listSyncCredentials', { listId });
    db.deleteMany('listSyncLeases', { _id: listId });
  }
});

test('switching projects isolates overlapping IDs, archives and credentials through the popup', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'ONE', enabled: true, token: 'one-test-token' };
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  try {
    await call(page, 'setListSyncSource', listId, config);
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 1, archived: 0 });
    const first = db.findOne('cards', { listId, syncExternalId: 'SAME-1' });
    expect(first.syncSourceKey).toBe(syncSourceKey(config));
    await openSync(page, listId);
    await page.locator('.js-list-sync-project-key').fill('TWO');
    await page.locator('.js-list-sync-save').click();
    await expect.poll(() => db.findOne('lists', { _id: listId }).syncSource.projectKey).toBe('TWO');
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(false);
    const count = requests.length;
    await page.locator('.js-list-sync-now').click();
    await expect(page.locator('.pop-over .list-sync-now-error')).toContainText('credential for this server and project');
    expect(requests).toHaveLength(count);
    await page.locator('.js-list-sync-token').fill('two-test-token');
    await page.locator('.js-list-sync-save').click();
    await expect.poll(() => call(page, 'hasListSyncCredential', listId)).toBe(true);
    await page.locator('.js-list-sync-now').click();
    await expect.poll(() => db.find('cards', { listId, syncExternalId: 'SAME-1' }).length).toBe(2);
    expect(db.findOne('cards', { _id: first._id }).title).toBe(first.title);
    expect(db.findOne('cards', { _id: first._id }).archived).toBe(false);
    expect(requests.at(-1).auth).toBe(`Basic ${Buffer.from(':two-test-token').toString('base64')}`);
    emptyProjects.add('TWO');
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 0, archived: 1 });
    expect(db.findOne('cards', { _id: first._id }).archived).toBe(false);
    emptyProjects.delete('TWO');
    await call(page, 'setListSyncSource', listId, { ...config, projectKey: 'EMPTY', token: 'empty-test-token' });
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 0, archived: 0 });
    expect(db.find('cards', { listId, syncExternalId: 'SAME-1', archived: false })).toHaveLength(1);
    await call(page, 'setListSyncSource', listId, null);
    await call(page, 'setListSyncSource', listId, config);
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 0, archived: 0 });
    expect(db.find('cards', { listId, syncExternalId: 'SAME-1' })).toHaveLength(2);
  } finally { db.deleteMany('listSyncCredentials', { listId }); }
});

test('saving a legacy source binds its cards and credential before a source switch or clear', async ({ page, user, board }) => {
  const card = db.find('cards', { boardId: board.boardId })[0];
  const config = { type: 'jira', url: base, projectKey: 'ONE', enabled: false };
  db.updateOne('lists', { _id: card.listId }, { $set: { syncSource: config } });
  db.updateOne('cards', { _id: card._id }, { $set: { syncSourceType: 'jira', syncExternalId: 'SAME-1' } });
  db.insertOne('listSyncCredentials', { _id: `sync-${card.listId}`, listId: card.listId, token: 'legacy-test-token' });
  await loginWithToken(page, user.id, user.token);
  try {
    await call(page, 'setListSyncSource', card.listId, { ...config, fields: ['title'] });
    expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBe(syncSourceKey(config));
    expect(await call(page, 'hasListSyncCredential', card.listId)).toBe(true);
    await call(page, 'setListSyncSource', card.listId, null);
    expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBe(syncSourceKey(config));
    await call(page, 'setListSyncSource', card.listId, { ...config, projectKey: 'TWO' });
    expect(await call(page, 'hasListSyncCredential', card.listId)).toBe(false);
    expect(db.findOne('cards', { _id: card._id }).title).toBe(card.title);
  } finally { db.deleteMany('listSyncCredentials', { listId: card.listId }); }
});

test('only the committed credential version is used and clearing cannot adopt an unfinished save', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'ONE', token: 'committed-test-token' };
  await loginWithToken(page, user.id, user.token);
  try {
    await call(page, 'setListSyncSource', listId, config);
    const saved = db.findOne('lists', { _id: listId });
    expect(saved.syncRevision).toBeTruthy();
    expect(JSON.stringify(saved)).not.toContain(config.token);
    db.insertOne('listSyncCredentials', { _id: `staged-${listId}`, configurationId: `staged-${listId}`,
      listId, sourceKey: syncSourceKey(config), token: 'unfinished-test-token' });
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 1 });
    expect(requests.at(-1).auth).toBe(`Basic ${Buffer.from(':committed-test-token').toString('base64')}`);
    await call(page, 'setListSyncSource', listId, null);
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(false);
    expect(db.findOne('listSyncCredentials', { _id: saved.syncRevision })).toBeNull();
    await call(page, 'setListSyncSource', listId, { ...config, token: null });
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(false);
    const count = requests.length;
    expect((await call(page, 'syncListNow', listId)).error).toContain('credential for this server and project');
    expect(requests).toHaveLength(count);
  } finally { db.deleteMany('listSyncCredentials', { listId }); }
});

test('recreated lists get fresh credential lifetimes and orphan cleanup preserves the new token', async ({ page, user, board }) => {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(process.env.WEKAN_MONGO_URL || 'mongodb://127.0.0.1:3001/meteor');
  await client.connect();
  const database = client.db();
  const listId = `lifetime-${board.boardId}`;
  const config = { type: 'jira', url: base, projectKey: 'ONE', token: 'lifetime-test-token' };
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const insert = extra => call(page, '/lists/insert', { _id: listId, boardId: board.boardId,
    title: 'Lifetime test', sort: 10, syncCredentialIncarnation: 'copied-lifetime', ...extra });
  try {
    await insert({});
    const initial = db.findOne('lists', { _id: listId });
    expect(initial.syncCredentialIncarnation).toBeTruthy();
    expect(initial.syncCredentialIncarnation).not.toBe('copied-lifetime');
    await call(page, 'setListSyncSource', listId, config);
    const saved = db.findOne('lists', { _id: listId });
    expect(db.findOne('listSyncCredentials', { _id: saved.syncRevision }).incarnation).toBe(initial.syncCredentialIncarnation);
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(true);
    await database.collection('lists').deleteOne({ _id: listId });
    await insert({ syncRevision: saved.syncRevision, syncSource: saved.syncSource });
    const recreated = db.findOne('lists', { _id: listId });
    expect(recreated.syncCredentialIncarnation).not.toBe(initial.syncCredentialIncarnation);
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(false);
    await openSync(page, listId);
    await page.locator('.js-list-sync-now').click();
    await expect(page.locator('.pop-over .list-sync-now-error')).toContainText('credential for this server and project');
    const denied = await page.evaluate(async id => {
      try { await Meteor.callAsync('/lists/update', { _id: id }, { $unset: { syncCredentialIncarnation: '' } }); return false; }
      catch (_) { return true; }
    }, listId);
    expect(denied).toBe(true);
    await call(page, 'setListSyncSource', listId, config);
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 1 });
    const adapter = collection => ({
      findOneAsync: selector => collection.findOne(selector),
      find: (selector, options) => ({ fetchAsync: () => collection.find(selector,
        { projection: options.fields }).sort(options.sort).limit(options.limit).toArray() }),
      updateAsync: async (selector, change) => (await collection.updateOne(selector, change)).matchedCount,
      removeAsync: async selector => (await collection.deleteMany(selector)).deletedCount,
    });
    const sweep = () => sweepSyncCredentials({ lists: adapter(database.collection('lists')),
      credentials: adapter(database.collection('listSyncCredentials')),
      cursor: database.collection('listSyncCredentials').find({ listId },
        { projection: { _id: 1, listId: 1, incarnation: 1, configurationId: 1 } }).sort({ listId: 1 }) });
    await sweep();
    expect(db.find('listSyncCredentials', { listId })).toHaveLength(1);
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(true);
    await database.collection('lists').deleteOne({ _id: listId });
    expect((await sweep()).orphaned).toBe(1);
    expect(db.find('listSyncCredentials', { listId })).toHaveLength(0);
  } finally {
    await client.close();
    db.deleteMany('listSyncCredentials', { listId });
  }
});

test('saving Sync settings repairs damaged counters and retains the selected credential', async ({ page, user, board }) => {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(process.env.WEKAN_MONGO_URL || 'mongodb://127.0.0.1:3001/meteor');
  await client.connect();
  const database = client.db();
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'ONE', token: 'repair-generation-token' };
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  try {
    await call(page, 'setListSyncSource', listId, config);
    for (const generation of [null, 'damaged', Number.MAX_SAFE_INTEGER]) {
      const previous = db.findOne('lists', { _id: listId });
      await database.collection('lists').updateOne({ _id: listId }, { $set: { syncCredentialGeneration: generation } });
      await openSync(page, listId);
      await page.locator('.js-list-sync-save').click();
      await expect.poll(() => db.findOne('lists', { _id: listId }).syncCredentialGeneration).toBe(0);
      const saved = db.findOne('lists', { _id: listId });
      expect(saved.syncRevision).not.toBe(previous.syncRevision);
      expect(saved.syncCredentialFence).toBeTruthy();
      expect(saved.syncCredentialFence).not.toBe(previous.syncCredentialFence);
      expect(await call(page, 'hasListSyncCredential', listId)).toBe(true);
      expect(db.findOne('listSyncCredentials', { _id: saved.syncRevision }).token).toBe(config.token);
    }
    const before = db.findOne('lists', { _id: listId });
    const refused = await page.evaluate(async id => {
      try { await Meteor.callAsync('/lists/update', { _id: id }, { $set: { syncCredentialFence: 'forged' } }); return false; }
      catch (_) { return true; }
    }, listId);
    expect(refused).toBe(true);
    expect(db.findOne('lists', { _id: listId }).syncCredentialFence).toBe(before.syncCredentialFence);
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 1 });
  } finally { await client.close(); db.deleteMany('listSyncCredentials', { listId }); }
});

test('credential cleanup keeps the selected token usable and later settings saves use the new generation', async ({ page, user, board }) => {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(process.env.WEKAN_MONGO_URL || 'mongodb://127.0.0.1:3001/meteor');
  await client.connect();
  const database = client.db();
  const listId = db.find('lists', { boardId: board.boardId })[0]._id;
  const config = { type: 'jira', url: base, projectKey: 'ONE', token: 'cleanup-selected-token' };
  await loginWithToken(page, user.id, user.token);
  try {
    await call(page, 'setListSyncSource', listId, config);
    const selected = db.findOne('lists', { _id: listId });
    db.insertOne('listSyncCredentials', { _id: `orphan-${listId}`, configurationId: `orphan-${listId}`,
      listId, token: 'orphan-test-token', generation: 0 });
    await cleanupSyncCredentials({ list: selected,
      lists: { updateAsync: async (selector, update) => (await database.collection('lists').updateOne(selector, update)).matchedCount },
      credentials: { find: (selector, options) => ({ fetchAsync: () => database.collection('listSyncCredentials').find(selector,
        { projection: options.fields }).sort(options.sort).limit(options.limit).toArray() }),
        removeAsync: async selector => (await database.collection('listSyncCredentials').deleteMany(selector)).deletedCount } });
    expect(db.find('listSyncCredentials', { listId })).toHaveLength(1);
    expect(db.findOne('lists', { _id: listId }).syncRevision).toBe(selected.syncRevision);
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(true);
    expect(await call(page, 'syncListNow', listId)).toMatchObject({ created: 1 });
    expect(requests.at(-1).auth).toBe(`Basic ${Buffer.from(':cleanup-selected-token').toString('base64')}`);
    await call(page, 'setListSyncSource', listId, { ...config, token: null });
    const saved = db.findOne('lists', { _id: listId });
    expect(db.findOne('listSyncCredentials', { _id: saved.syncRevision }).generation).toBe(1);
    expect(await call(page, 'hasListSyncCredential', listId)).toBe(true);
    // The fence is server-owned, even for an otherwise authorized board user.
    const result = await page.evaluate(async id => {
      try { await Meteor.callAsync('/lists/update', { _id: id }, { $set: { syncCredentialGeneration: 0 } }); return 'allowed'; }
      catch (_) { return 'denied'; }
    }, listId);
    expect(result).toBe('denied');
    expect(db.findOne('lists', { _id: listId }).syncCredentialGeneration).toBe(1);
  } finally { await client.close(); db.deleteMany('listSyncCredentials', { listId }); }
});

test('unknown legacy mappings and malformed server URLs reject configuration without changing cards', async ({ page, user, board }) => {
  const card = db.find('cards', { boardId: board.boardId })[0];
  db.updateOne('cards', { _id: card._id }, { $set: { syncSourceType: 'jira', syncExternalId: 'SAME-1' } });
  await loginWithToken(page, user.id, user.token);
  const result = await page.evaluate(async ({ id, url }) => {
    const failures = [];
    for (const serverUrl of [url, `${url}?token=secret`]) {
      try { await Meteor.callAsync('setListSyncSource', id, { type: 'jira', url: serverUrl, projectKey: 'NEW' }); failures.push('accepted'); }
      catch (error) { failures.push(error.error); }
    }
    return failures;
  }, { id: card.listId, url: base });
  expect(result).toEqual(['sync-source-unknown', 'invalid-sync-source']);
  expect(db.findOne('lists', { _id: card.listId }).syncSource).toBeUndefined();
  expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBeUndefined();
  expect(db.findOne('cards', { _id: card._id }).title).toBe(card.title);
  db.updateOne('lists', { _id: card.listId }, { $set: { syncSource: { type: 'github', projectKey: 'team/repo' } } });
  const foreign = await page.evaluate(async ({ id, url }) => {
    try { await Meteor.callAsync('setListSyncSource', id, { type: 'jira', url, projectKey: 'NEW' }); return 'accepted'; }
    catch (error) { return error.error; }
  }, { id: card.listId, url: base });
  expect(foreign).toBe('sync-source-unknown');
  expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBeUndefined();
  // A malformed legacy configuration can still be disconnected, but it cannot
  // be used to guess which project the old card belongs to.
  db.updateOne('lists', { _id: card.listId }, { $set: { syncSource: { type: 'jira', url: 'broken', projectKey: 'OLD' } } });
  expect(await call(page, 'setListSyncSource', card.listId, null)).toEqual({ cleared: true });
  expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBeUndefined();
});

test('switching a legacy source binds old cards to the old project and discards its credential', async ({ page, user, board }) => {
  const card = db.find('cards', { boardId: board.boardId })[0];
  const oldSource = { type: 'jira', url: base, projectKey: 'ONE', enabled: false };
  db.updateOne('lists', { _id: card.listId }, { $set: { syncSource: oldSource } });
  db.updateOne('cards', { _id: card._id }, { $set: { syncSourceType: 'jira', syncExternalId: 'SAME-1' } });
  db.insertOne('listSyncCredentials', { _id: `sync-${card.listId}`, listId: card.listId, token: 'legacy-test-token' });
  await loginWithToken(page, user.id, user.token);
  try {
    await call(page, 'setListSyncSource', card.listId, { ...oldSource, projectKey: 'TWO' });
    expect(db.findOne('cards', { _id: card._id }).syncSourceKey).toBe(syncSourceKey(oldSource));
    expect(await call(page, 'hasListSyncCredential', card.listId)).toBe(false);
    expect(db.findOne('listSyncCredentials', { listId: card.listId })).toBeNull();
    expect(db.findOne('cards', { _id: card._id }).archived).toBe(false);
  } finally { db.deleteMany('listSyncCredentials', { listId: card.listId }); }
});

// SyncBleed (GHSA-5q84-p3vr-f3xv): a board member could point List Sync at
// the server's own network and read back the start of what answered. The test
// server allows only 127.0.0.1 (LIST_SYNC_ALLOWED_PRIVATE_HOSTS, set by the
// administrator); the same mock tracker under any other internal name is
// refused before a request is sent, and the attempt shows in Problems.
test('a Sync server on an internal address is refused when saved and when synced', async ({ page, user, board }) => {
  const listId = db.find('lists', { boardId: board.boardId })[1]._id;
  const port = new URL(base).port;
  const internal = `http://localhost:${port}`;
  const seen = () => requests.length;
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    // Saving through the popup, as a member would.
    db.updateOne('lists', { _id: listId }, { $set: { syncSource: { type: 'jira', url: 'https://example.invalid',
      projectKey: 'INTERNAL', enabled: false } } });
    await openSync(page, listId);
    const before = seen();
    await page.locator('.js-list-sync-url').fill(internal);
    await page.locator('.js-list-sync-token').fill('attacker-token');
    await page.locator('.js-list-sync-save').click();
    await expect(page.locator('.pop-over .list-sync-now-error')).toContainText('Sync server address is not allowed');
    expect(db.findOne('lists', { _id: listId }).syncSource.url).toBe('https://example.invalid');
    // Every internal form the report used, through the method.
    for (const url of [internal, 'http://169.254.169.254', 'http://10.0.0.5:8080', `http://[::1]:${port}`]) {
      const result = await page.evaluate(async ({ id, url }) => {
        try { await Meteor.callAsync('setListSyncSource', id, { type: 'gitea', url, projectKey: 'x/y', token: 't' }); return 'accepted'; }
        catch (error) { return error.error; }
      }, { id: listId, url });
      expect(result, url).toBe('sync-url-blocked');
    }
    expect(seen()).toBe(before);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'SyncBleed', action: 'blocked',
      source: 'setListSyncSource' })?.count).toBeGreaterThan(0);

    // A source saved before the fix: the fetch refuses it too, and the preview
    // says only that the address is not allowed - nothing the service answered.
    const allowed = { type: 'jira', url: base, projectKey: 'INTERNAL', token: 'stored-token' };
    await call(page, 'setListSyncSource', listId, allowed);
    const stored = { ...allowed, url: internal };
    db.updateOne('lists', { _id: listId }, { $set: { 'syncSource.url': internal } });
    db.updateOne('listSyncCredentials', { listId }, { $set: { sourceKey: syncSourceKey(stored) } });
    const preview = await call(page, 'previewListSync', listId);
    expect(preview.error).toBe('The Sync server address is not allowed: private, loopback and link-local addresses are refused.');
    expect(seen()).toBe(before);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'SyncBleed', source: 'previewListSync' })?.count).toBeGreaterThan(0);
    // One attempt, one record: the guard does not add a DnsBleed row for it,
    // whose high severity used to disable the member who pressed preview.
    expect(db.findOne('users', { _id: user.id }).loginDisabled).toBeFalsy();
    expect(await page.evaluate(() => Meteor.userId())).toBe(user.id);

    // The administrator's allowed host still syncs (the mock tracker answers).
    db.updateOne('lists', { _id: listId }, { $set: { 'syncSource.url': base } });
    db.updateOne('listSyncCredentials', { listId }, { $set: { sourceKey: syncSourceKey(allowed) } });
    const ok = await call(page, 'previewListSync', listId);
    expect(ok.error).toBeUndefined();
    expect(seen()).toBeGreaterThan(before);
  } finally {
    db.deleteMany('listSyncCredentials', { listId });
    db.updateOne('lists', { _id: listId }, { $unset: { syncSource: 1 } });
  }
});
