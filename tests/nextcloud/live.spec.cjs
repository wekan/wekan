const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const fixture = JSON.parse(fs.readFileSync(process.env.WEKAN_NEXTCLOUD_FIXTURE));

async function login(browser, username) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${fixture.nextcloud}/index.php/login?redirect_url=${encodeURIComponent(new URL(fixture.url).pathname)}`);
  await page.locator('input[name="user"]').fill(username);
  await page.locator('input[name="password"]').fill(fixture.password);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForURL(url => !url.pathname.endsWith('/login'));
  await page.goto(fixture.url);
  await page.waitForFunction(() => window.Meteor?.userId() && window.Meteor.status().connected);
  return { context, page, id: await page.evaluate(() => Meteor.userId()) };
}

test('real Nextcloud sessions create distinct WeKan accounts with explicit admin policy', async ({ browser }) => {
  const sessions = [];
  try {
    for (const name of ['alice', 'bob', 'ncadmin']) {
      const session = await login(browser, name); sessions.push(session);
      expect(session.id).toMatch(/^nc-/);
      await expect.poll(() => session.page.evaluate(() => !!Meteor.user()?.isAdmin)).toBe(name === 'ncadmin');
    }
    expect(new Set(sessions.map(s => s.id)).size).toBe(3);
    const { page, id } = sessions[0];
    const sockets = [];
    page.on('websocket', s => sockets.push(s.url()));
    await page.reload();
    await page.waitForFunction(id => Meteor.userId() === id, id);
    expect(sockets.some(s => s.includes('/sockjs/'))).toBe(true);
    await page.evaluate(() => Meteor.disconnect());
    await page.evaluate(() => Meteor.reconnect());
    await page.waitForFunction(id => Meteor.status().connected && Meteor.userId() === id, id);
  } finally { await Promise.all(sessions.map(s => s.context.close())); }
});

test('anonymous and injected identity requests cannot reach WeKan through HaRP', async ({ request }) => {
  for (const path of ['', 'sockjs/info', '_nextcloud/health']) {
    const response = await request.get(fixture.url + path, { headers: {
      'x-wekan-nextcloud-user': 'ncadmin', 'x-wekan-nextcloud-signature': 'forged',
      'authorization-app-api': Buffer.from('ncadmin:wrong').toString('base64'),
    } });
    expect([401, 403]).toContain(response.status());
    expect(await response.text()).not.toContain('__meteor_runtime_config__');
  }
});

test('private boards, shared real-time changes, attachments and avatars through HaRP', async ({ browser }) => {
  const alice = await login(browser, 'alice');
  const bob = await login(browser, 'bob');
  const { MongoClient } = require('mongodb');
  const database = await MongoClient.connect(fixture.mongo);
  try {
    const boardId = await alice.page.evaluate(() => Meteor.callAsync('createBoardWithInitialSwimlanes', {
      title: 'Nextcloud private proof', slug: 'nextcloud-proof', permission: 'private',
      swimlanes: [{ title: 'Default', sort: 0 }],
    }));
    const boardUrl = `${fixture.url}b/${boardId}/nextcloud-proof`;
    await alice.page.goto(boardUrl);
    await expect(alice.page.locator('.board-canvas')).toBeVisible();
    await bob.page.goto(boardUrl);
    await bob.page.waitForFunction(() => Meteor.status().connected && Meteor.userId());
    await expect(bob.page.locator('.board-canvas')).toHaveCount(0);
    expect(await bob.page.evaluate(id => !!Meteor.connection._stores.boards?._getCollection().findOne(id), boardId)).toBe(false);
    const rejected = await bob.page.evaluate(async id => {
      try { await Meteor.callAsync('getBackgroundImageURL', id); return false; } catch { return true; }
    }, boardId);
    expect(rejected).toBe(true);
    const cardId = await alice.page.evaluate(async boardId => {
      const lane = Meteor.connection._stores.swimlanes._getCollection().findOne({ boardId });
      const listId = crypto.randomUUID().replaceAll('-', '');
      await Meteor.callAsync('/lists/insert', { _id: listId, boardId, title: 'To do', sort: 0, swimlaneId: lane._id });
      return Meteor.callAsync('createCardWithDueDate', boardId, listId, 'Before live update', new Date('2027-01-01'), lane._id);
    }, boardId);
    const attachmentBytes = Buffer.from('Nextcloud attachment persistence proof\n');
    const CardPage = require('../playwright/pages/CardPage');
    await alice.page.locator('.minicard-title').filter({ hasText: 'Before live update' }).click();
    const card = new CardPage(alice.page);
    await card.waitForOpen();
    await card.openAttachmentPanel();
    await alice.page.locator('input.js-attach-file').setInputFiles({ name: 'proof.txt', mimeType: 'text/plain', buffer: attachmentBytes });
    let record;
    await expect.poll(async () => {
      record = await database.db().collection('attachments').findOne({ 'meta.cardId': cardId });
      return !!record?.versions?.original;
    }).toBe(true);
    const attachment = { id: record._id, url: `${fixture.url}cdn/storage/attachments/${record._id}` };
    await alice.page.keyboard.press('Escape');
    const avatarBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');
    // Upload completion closes its popup asynchronously; navigate before opening another.
    await alice.page.goto(boardUrl);
    await alice.page.locator('.js-open-header-member-menu').click();
    await alice.page.locator('.js-pop-over .js-change-avatar').click();
    await alice.page.locator('.js-upload-avatar-input').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: avatarBytes });
    await expect.poll(async () => {
      record = await database.db().collection('avatars').findOne({ userId: alice.id });
      return !!record?.versions?.original;
    }).toBe(true);
    const avatar = { id: record._id, url: `${fixture.url}cdn/storage/avatars/${record._id}` };
    await alice.page.keyboard.press('Escape');
    for (const [file, bytes] of [[attachment, attachmentBytes], [avatar, avatarBytes]]) {
      const response = await alice.context.request.get(file.url);
      expect(response.ok()).toBe(true);
      expect(await response.body()).toEqual(bytes);
    }
    const forbidden = await bob.context.request.get(attachment.url);
    expect(forbidden.ok()).toBe(false);
    await alice.page.evaluate(async ({ boardId, userId }) => Meteor.callAsync('/boards/update', { _id: boardId }, { $push: { members: { userId, isActive: true, isAdmin: false, isNoComments: false, isCommentOnly: false, isWorker: false } } }), { boardId, userId: bob.id });
    await bob.page.reload();
    await expect(bob.page.locator('.board-canvas')).toBeVisible();
    await expect(bob.page.locator('.minicard-title').filter({ hasText: 'Before live update' })).toBeVisible();
    await alice.page.goto(boardUrl);
    await alice.page.locator('.minicard-title').filter({ hasText: 'Before live update' }).click();
    await card.waitForOpen();
    await card.editTitle('After live update');
    await expect(bob.page.locator('.minicard-title').filter({ hasText: 'After live update' })).toBeVisible();
    // Save only fixture identifiers and expected bytes for the restart/restore stages.
    fs.writeFileSync(`${fixture.work}/persisted.json`, JSON.stringify({ boardId, boardUrl, cardId,
      alice: alice.id, bob: bob.id, attachment, avatar,
      attachmentBytes: attachmentBytes.toString('base64'), avatarBytes: avatarBytes.toString('base64') }));
  } finally { await database.close(); await alice.context.close(); await bob.context.close(); }
});

test('AppAPI disable closes the active DDP socket and re-enable restores sign-in', async ({ browser, request }) => {
  const { execFileSync } = require('node:child_process');
  const alice = await login(browser, 'alice');
  const occ = command => execFileSync(fixture.php, ['-d', 'memory_limit=512M', `${fixture.server}/occ`, command, 'wekan'],
    { env: process.env, timeout: 60000 });
  try {
    occ('app_api:app:disable');
    await expect.poll(() => alice.page.evaluate(() => Meteor.status().connected)).toBe(false);
    const response = await alice.context.request.get(fixture.url);
    expect([401, 403, 404]).toContain(response.status());
    expect(JSON.parse(fs.readFileSync(`${fixture.storage}/../nextcloud-enabled.json`)).enabled).toBe(false);
    occ('app_api:app:enable');
    await alice.page.reload();
    await alice.page.waitForFunction(id => Meteor.userId() === id && Meteor.status().connected, alice.id);
  } finally {
    occ('app_api:app:enable');
    await alice.context.close();
  }
});

test('resume tokens and login arguments cannot switch the signed Nextcloud identity', async ({ browser }) => {
  const { MongoClient } = require('mongodb');
  const { randomBytes, createHash } = require('node:crypto');
  const client = await MongoClient.connect(fixture.mongo);
  const alice = await login(browser, 'alice');
  const bob = await login(browser, 'bob');
  const token = randomBytes(32).toString('hex');
  const hashedToken = createHash('sha256').update(token).digest('base64');
  try {
    await client.db().collection('users').updateOne({ _id: bob.id }, { $push: {
      'services.resume.loginTokens': { when: new Date(), hashedToken },
    } });
    const error = await alice.page.evaluate(token => new Promise(resolve => {
      Package['accounts-base'].Accounts.callLoginMethod({ methodArguments: [{ resume: token }],
        userCallback: error => resolve(!!error) });
    }), token);
    expect(error).toBe(true);
    expect(await alice.page.evaluate(() => Meteor.userId())).not.toBe(bob.id);
    const impersonation = await alice.page.evaluate(() => new Promise(resolve => {
      Package['accounts-base'].Accounts.callLoginMethod({ methodArguments: [{ nextcloud: true, userId: 'bob' }],
        userCallback: error => resolve(!!error) });
    }));
    expect(impersonation).toBe(true);
    await client.db().collection('users').updateOne({ _id: alice.id }, { $set: { loginDisabled: true } });
    await alice.page.reload();
    await alice.page.waitForFunction(() => Meteor.status().connected);
    const disabled = await alice.page.evaluate(() => new Promise(resolve => {
      Package['accounts-base'].Accounts.callLoginMethod({ methodArguments: [{ nextcloud: true }],
        userCallback: error => resolve(!!error) });
    }));
    expect(disabled).toBe(true);
    expect(await alice.page.evaluate(() => Meteor.userId())).toBeNull();
  } finally {
    await client.db().collection('users').updateOne({ _id: alice.id }, { $set: { loginDisabled: false } });
    await client.db().collection('users').updateOne({ _id: bob.id }, { $pull: { 'services.resume.loginTokens': { hashedToken } } });
    await client.close(); await alice.context.close(); await bob.context.close();
  }
});
