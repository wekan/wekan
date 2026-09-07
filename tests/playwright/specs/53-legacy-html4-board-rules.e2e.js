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
    await submit(legacy.locator(`form[action="${rulesPath}"]`).last());
    await submit(legacy.locator(
      'form:has(input[name="rulesView"][value="workflow"])',
    ).first());
    await expect(legacy.locator('thead')).toContainText('Kun');
    await expect(legacy.locator('tbody')).toContainText('Siirrä kortti listansa alkuun');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-board-rules-workflow.png`,
        fullPage: true,
      });
    }
    const createWorkflow = legacy.locator(
      'form:has(input[name="legacyOperation"][value="create-workflow-rule"])',
    );
    await createWorkflow.locator('input[name="ruleTitle"]').fill(`=Native workflow ${suffix}`);
    await createWorkflow.locator('select[name="triggerIndex"]').selectOption('0');
    await createWorkflow.locator('select[name="actionIndex"]').selectOption('0');
    await submit(createWorkflow);
    await expect.poll(() => db.findOne('rules', {
      boardId: board.boardId, title: `=Native workflow ${suffix}`,
    })).not.toBeNull();
    await expect(legacy.locator('tbody')).toContainText(`=Native workflow ${suffix}`);
    const replaceAction = legacy.locator(
      `form:has(input[name="legacyOperation"][value="replace-workflow-action"]):has(input[name="ruleId"][value="${ids.ruleB}"])`,
    );
    await replaceAction.locator('select[name="actionIndex"]').selectOption('2');
    await submit(replaceAction);
    await expect.poll(() => db.findOne('rules', { _id: ids.ruleB })?.actionId)
      .not.toBe(ids.actionB);
    expect(db.findOne('actions', { _id: ids.actionB })).toBeNull();
    await expect(legacy.locator('tbody')).toContainText('Siirrä kortti arkistoon');
    const exportForm = format => legacy.locator(
      'form:has(input[name="legacyOperation"][value="export-rules"])'
      + `:has(input[name="ruleExportFormat"][value="${format}"])`,
    );
    const [html4JsonDownload] = await Promise.all([
      legacy.waitForEvent('download'),
      exportForm('json').locator('input[type="submit"]').click(),
    ]);
    const html4Json = JSON.parse(await fs.promises.readFile(
      await html4JsonDownload.path(), 'utf8',
    ));
    expect(html4Json._format).toBe('wekan-rules-1.0.0');
    expect(html4Json.rules).toHaveLength(3);
    expect(html4Json.rules.every(rule => !rule._id && !rule.trigger._id && !rule.action._id))
      .toBe(true);
    const [html4CsvDownload] = await Promise.all([
      legacy.waitForEvent('download'),
      exportForm('csv').locator('input[type="submit"]').click(),
    ]);
    const html4Csv = await fs.promises.readFile(await html4CsvDownload.path(), 'utf8');
    expect(html4Csv).toContain(`'=Native workflow ${suffix}`);

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
    await modern.locator('button.js-goback').click();
    const workflowToggle = modern.locator('.js-rules-toggle-view');
    if (!(await workflowToggle.isVisible().catch(() => false))) {
      await modern.locator('.js-toggle-page-sidebar').first().click();
      await workflowToggle.waitFor();
    }
    await modern.locator('.js-rules-import-export').click();
    const [html5JsonDownload] = await Promise.all([
      modern.waitForEvent('download'),
      modern.locator('.js-rules-export-json').click(),
    ]);
    const html5Json = JSON.parse(await fs.promises.readFile(
      await html5JsonDownload.path(), 'utf8',
    ));
    expect(html5Json.rules.map(rule => rule.title).sort())
      .toEqual(html4Json.rules.map(rule => rule.title).sort());
    await modern.keyboard.press('Escape');
    await workflowToggle.click();
    const localizedWorkflowRule = modern.locator(
      `.workflow-rule[data-rule-id="${ids.ruleA}"]`,
    );
    await expect(localizedWorkflowRule).toContainText(
      'Kun kortti on siirretty arkistoon tekijänä *',
    );
    await expect(localizedWorkflowRule).toContainText(
      'Siirrä kortti listansa alkuun',
    );
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-board-rules-workflow.png`,
        fullPage: true,
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

    const importForm = () => legacy.locator(
      'form:has(input[name="legacyOperation"][value="import-rules"])',
    );
    const importDocument = {
      _format: 'wekan-rules-1.0.0',
      rules: [{
        ...html4Json.rules[0],
        title: `HTML4 JSON import ${suffix}`,
        trigger: { ...html4Json.rules[0].trigger,
          desc: '<b>safe</b><img src=x onerror=alert(1)>' },
        action: { ...html4Json.rules[0].action, apiToken: 'must-not-survive' },
      }],
    };
    const beforeInvalid = db.countDocuments('rules', { boardId: board.boardId });
    const invalidDocument = structuredClone(importDocument);
    invalidDocument.rules.push({
      title: 'Invalid action must reject whole batch',
      trigger: { activityType: 'createCard' },
      action: { actionType: 'not-a-real-action' },
    });
    await importForm().locator('select[name="ruleImportFormat"]').selectOption('json');
    await importForm().locator('textarea[name="ruleImportText"]')
      .fill(JSON.stringify(invalidDocument));
    await submit(importForm());
    expect(db.countDocuments('rules', { boardId: board.boardId })).toBe(beforeInvalid);
    await expect(legacy.locator('tbody')).toContainText('Virhe');

    await importForm().locator('select[name="ruleImportFormat"]').selectOption('json');
    await importForm().locator('textarea[name="ruleImportText"]')
      .fill(JSON.stringify(importDocument));
    await submit(importForm());
    const importedJsonRule = db.findOne('rules', {
      boardId: board.boardId, title: `HTML4 JSON import ${suffix}`,
    });
    expect(importedJsonRule).toBeTruthy();
    const importedTrigger = db.findOne('triggers', { _id: importedJsonRule.triggerId });
    const importedAction = db.findOne('actions', { _id: importedJsonRule.actionId });
    expect(importedTrigger.desc).not.toContain('onerror');
    expect(importedAction.apiToken).toBeUndefined();

    await importForm().locator('select[name="ruleImportFormat"]').selectOption('csv');
    await importForm().locator('textarea[name="ruleImportText"]').fill(html4Csv);
    await submit(importForm());
    await expect.poll(() => db.countDocuments('rules', {
      boardId: board.boardId, title: `=Native workflow ${suffix}`,
    })).toBe(2);

    await submit(legacy.locator(
      'form:has(input[name="rulesView"][value="list"])',
    ).first());
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
