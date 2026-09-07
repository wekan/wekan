'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('linked cards share visible real content but retain only their snapshot when private',
  async ({ browser, baseURL }) => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const username = `html4linked${suffix}`;
    const output = `${process.cwd()}/../../.tools/html4-linked-card`;
    const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
    const legacy = await legacyContext.newPage();
    let user; let destination; let source; let modernContext;
    try {
      await legacy.goto(`${baseURL}/sign-up`);
      await legacy.locator('input[name="username"]').fill(username);
      await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
      await legacy.locator('input[name="password"]').fill(`Linked-${suffix}!`);
      await Promise.all([
        legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click(),
      ]);
      user = db.findOne('users', { username });
      destination = db.seedBoard({ ownerId: user._id, title: `Link destination ${suffix}`,
        listCount: 1 });
      source = db.seedBoard({ ownerId: user._id, title: `Link source ${suffix}`,
        listCount: 1, cardTitlesPerList: [[`PRIVATE SOURCE TITLE ${suffix}`]] });
      const sourceCard = db.findOne('cards', { boardId: source.boardId });
      const linkedId = db.uid('linked');
      const now = new Date();
      db.updateOne('cards', { _id: sourceCard._id }, { $set: {
        description: `PRIVATE SOURCE DESCRIPTION ${suffix}`, color: 'red',
        receivedAt: new Date('2026-01-02T03:04:05.000Z'),
        dueAt: new Date('2026-05-06T07:08:09.000Z'),
      } });
      db.insertOne('cards', {
        _id: linkedId, title: `Safe snapshot ${suffix}`,
        description: `Safe snapshot description ${suffix}`, color: 'green',
        boardId: destination.boardId, swimlaneId: destination.swimlaneId,
        listId: destination.listIds[0], linkedId: sourceCard._id,
        type: 'cardType-linkedCard', members: [], assignees: [], requesters: [],
        assigners: [], labelIds: [], customFields: [], archived: false, sort: 100,
        cardNumber: 77, userId: user._id, createdAt: now, modifiedAt: now,
      });
      const route = `/b/${destination.boardId}/${destination.slug}/${linkedId}`;
      await Promise.all([
        legacy.waitForNavigation(),
        legacy.locator('form[action="/allboards"] input[type="submit"]').click(),
      ]);
      const boardRoute = `/b/${destination.boardId}/${destination.slug}`;
      await Promise.all([
        legacy.waitForNavigation(),
        legacy.locator(`form[action="${boardRoute}"] input[type="submit"]`).first().click(),
      ]);
      await Promise.all([
        legacy.waitForNavigation(),
        legacy.locator(`form[action="${route}"] input[type="submit"]`).first().click(),
      ]);
      await expect(legacy.locator('body')).toContainText(`PRIVATE SOURCE TITLE ${suffix}`);
      await expect(legacy.locator('body')).toContainText(`PRIVATE SOURCE DESCRIPTION ${suffix}`);
      await expect(legacy.locator('input[name="cardTitle"]'))
        .toHaveValue(`PRIVATE SOURCE TITLE ${suffix}`);

      modernContext = await browser.newContext({ locale: 'en-US' });
      const modern = await modernContext.newPage();
      await loginWithToken(modern, user._id, db.addResumeToken(user._id));
      await navigateInApp(modern, route);
      await waitForMeteor(modern);
      await expect(modern.locator('.card-details')).toContainText(`PRIVATE SOURCE TITLE ${suffix}`);
      await expect(modern.locator('.card-details')).toContainText(`PRIVATE SOURCE DESCRIPTION ${suffix}`);

      fs.mkdirSync(output, { recursive: true });
      await legacy.screenshot({ path: `${output}/html4-visible-source.png`, fullPage: true });
      await modern.screenshot({ path: `${output}/html5-visible-source.png`, fullPage: true });

      // Revoke source-board access while leaving the destination link readable.
      // Both renderers must now use only the link document's stored snapshot.
      db.updateOne('boards', { _id: source.boardId }, { $set: { members: [] } });
      await Promise.all([
        legacy.waitForNavigation(),
        legacy.locator('form:has(input[value="edit-card-title"]) input[type="submit"]').click(),
      ]);
      await modern.reload({ waitUntil: 'commit' });
      await waitForMeteor(modern);
      await expect(legacy.locator('body')).toContainText(`Safe snapshot ${suffix}`);
      await expect(legacy.locator('body')).toContainText(`Safe snapshot description ${suffix}`);
      await expect(legacy.locator('body')).not.toContainText(`PRIVATE SOURCE TITLE ${suffix}`);
      await expect(legacy.locator('body')).not.toContainText(`PRIVATE SOURCE DESCRIPTION ${suffix}`);
      await expect(modern.locator('.card-details')).toContainText(`Safe snapshot ${suffix}`);
      await expect(modern.locator('.card-details')).not.toContainText(`PRIVATE SOURCE TITLE ${suffix}`);
      await expect(modern.locator('.card-details')).not.toContainText(
        `PRIVATE SOURCE DESCRIPTION ${suffix}`);
      await legacy.screenshot({ path: `${output}/html4-private-source.png`, fullPage: true });
      await modern.screenshot({ path: `${output}/html5-private-source.png`, fullPage: true });
    } finally {
      if (modernContext) await modernContext.close();
      await legacyContext.close();
      if (destination?.boardId) db.cleanup({ boardIds: [destination.boardId] });
      if (source?.boardId) db.cleanup({ boardIds: [source.boardId] });
      if (user?._id) {
        db.deleteMany('legacyHtml4Sessions', { userId: user._id });
        db.deleteMany('users', { _id: user._id });
      }
    }
  });
