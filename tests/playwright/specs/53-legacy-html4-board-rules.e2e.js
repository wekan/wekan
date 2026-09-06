'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

function seedRules(boardId, suffix) {
  const ids = {
    triggerA: `html4-trigger-a-${suffix}`,
    triggerB: `html4-trigger-b-${suffix}`,
    actionA: `html4-action-a-${suffix}`,
    actionB: `html4-action-b-${suffix}`,
    ruleA: `html4-rule-a-${suffix}`,
    ruleB: `html4-rule-b-${suffix}`,
  };
  const now = new Date();
  db.insertMany('triggers', [
    { _id: ids.triggerA, boardId, desc: 'when a card is moved to archive by *',
      activityType: 'createCard', createdAt: now, modifiedAt: now },
    { _id: ids.triggerB, boardId, desc: 'trigger beta',
      activityType: 'createCard', createdAt: now, modifiedAt: now },
  ]);
  db.insertMany('actions', [
    { _id: ids.actionA, boardId, desc: 'Move card to top of its list',
      actionType: 'moveCardToTop', createdAt: now, modifiedAt: now },
    { _id: ids.actionB, boardId, desc: 'action beta',
      actionType: 'moveCardToTop', createdAt: now, modifiedAt: now },
  ]);
  db.insertMany('rules', [
    { _id: ids.ruleA, boardId, title: `Localized rule ${suffix}`,
      triggerId: ids.triggerA, actionId: ids.actionA, createdAt: now, modifiedAt: now },
    { _id: ids.ruleB, boardId, title: `Mutable rule ${suffix}`,
      triggerId: ids.triggerB, actionId: ids.actionB, createdAt: now, modifiedAt: now },
  ]);
  return ids;
}

test('HTML4 and HTML5 share localized Board Rules reads and guarded writes', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4rules${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'fi-FI' });
  const legacy = await legacyContext.newPage();
  let user;
  let board;
  let ids;
  let modernContext;
  let member;
  let memberContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([
      legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, { $set: { 'profile.language': 'fi' } });
    board = db.seedBoard({ ownerId: user._id, title: `Rule board ${suffix}` });
    ids = seedRules(board.boardId, suffix);
    const boardPath = `/b/${board.boardId}/${board.slug}`;
    const rulesPath = `${boardPath}/rules`;
    const submit = async form => Promise.all([
      legacy.waitForNavigation(), form.locator('input[type="submit"]').click(),
    ]);

    await submit(legacy.locator('form[action="/allboards"]').first());
    await submit(legacy.locator(`form[action="${boardPath}"]`).first());
    await submit(legacy.locator(`form[action="${rulesPath}"]`).first());
    await expect(legacy.locator('h1')).toContainText('Taulusäännöt');
    await expect(legacy.locator('tbody')).toContainText(`Localized rule ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(
      'Kun kortti on siirretty arkistoon tekijänä *',
    );

    await submit(legacy.locator(
      `form:has(input[name="viewRuleId"][value="${ids.ruleA}"])`,
    ).first());
    await expect(legacy.locator('tbody')).toContainText('Säännön yksityiskohdat');
    await expect(legacy.locator('tbody')).toContainText('Siirrä kortti listansa alkuun');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-board-rules.png`, fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'fi-FI' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, rulesPath);
    await expect(modern.locator('ul.rules-list')).toContainText(`Localized rule ${suffix}`);
    await modern.locator(`button.js-goto-details[data-rule-id="${ids.ruleA}"]`).click();
    await expect(modern.locator('.triggers-content')).toContainText(
      'Kun kortti on siirretty arkistoon tekijänä *',
    );
    await expect(modern.locator('.triggers-content')).toContainText(
      'Siirrä kortti listansa alkuun',
    );
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-board-rules.png`, fullPage: true,
      });
    }

    member = db.seedUser();
    db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
      userId: member.id, isAdmin: false, isActive: true, isNoComments: false,
      isCommentOnly: false, isWorker: false, isReadOnly: false,
      isReadAssignedOnly: false,
    } } });
    memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await loginWithToken(memberPage, member.id, member.token);
    const denied = await memberPage.evaluate(async ({ ruleId, title }) => {
      try {
        await Meteor.callAsync('rules.renameRule', ruleId, title);
        return '';
      } catch (error) {
        return error.error || error.reason || error.message;
      }
    }, { ruleId: ids.ruleA, title: 'Member must not rename this' });
    expect(denied).toBe('not-authorized');
    expect(db.findOne('rules', { _id: ids.ruleA }).title).toBe(`Localized rule ${suffix}`);

    await submit(legacy.locator(`form[action="${rulesPath}"]`).last());
    const rename = legacy.locator(
      `form:has(input[name="legacyOperation"][value="rename-rule"]):has(input[name="ruleId"][value="${ids.ruleB}"])`,
    );
    await rename.locator('input[name="ruleTitle"]').fill(`Renamed rule ${suffix}`);
    await submit(rename);
    await expect.poll(() => db.findOne('rules', { _id: ids.ruleB })?.title)
      .toBe(`Renamed rule ${suffix}`);

    await submit(legacy.locator(
      `form:has(input[name="legacyOperation"][value="confirm-delete-rule"]):has(input[name="ruleId"][value="${ids.ruleB}"])`,
    ));
    expect(db.findOne('rules', { _id: ids.ruleB })).toBeTruthy();
    await submit(legacy.locator(
      `form:has(input[name="legacyOperation"][value="delete-rule"]):has(input[name="ruleId"][value="${ids.ruleB}"])`,
    ));
    await expect.poll(() => db.findOne('rules', { _id: ids.ruleB })).toBeNull();
    expect(db.findOne('triggers', { _id: ids.triggerB })).toBeNull();
    expect(db.findOne('actions', { _id: ids.actionB })).toBeNull();
    expect(db.findOne('rules', { _id: ids.ruleA })).toBeTruthy();
  } finally {
    if (memberContext) await memberContext.close();
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.cleanup({
      boardIds: [board?.boardId].filter(Boolean),
      userIds: [user?._id, member?.id].filter(Boolean),
    });
  }
});
