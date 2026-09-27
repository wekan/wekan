'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
test('explicit Jira estimate mapping imports through the UI and survives export and copy', async ({ loggedInPage: page, request, user }) => {
  const ids = [];
  const source = { board: { name: `Jira points ${db.uniqueSuffix()}` }, issues: [0, 2.5, null].map((value, index) => ({ key: `POINTS-${index}`, fields: { summary: `Estimate ${index}`, customfield_10016: value } })) };
  try {
    await navigateInApp(page, '/import/jira');
    await page.locator('#import-textarea').fill(JSON.stringify(source));
    await page.locator('.js-jira-estimate-field').fill('customfield_10016');
    await page.locator('.js-jira-estimate-unit').fill('points');
    await page.locator('.js-import-without-mapping').click(); await page.waitForURL(/\/b\//);
    const id = page.url().match(/\/b\/([^/]+)/)[1]; ids.push(id);
    const checkBoard = boardId => {
      const field = db.findOne('customFields', { boardIds: boardId, 'settings.jiraEstimateFieldId': 'customfield_10016' });
      expect(field.showOnCard).toBe(false);
      const settings = db.findOne('boards', { _id: boardId }).scrum;
      expect(settings.estimateCustomFieldId).toBe(field._id); expect(settings.estimateUnit).toBe('points');
      expect(settings.enabled || false).toBe(false);
      for (const [index, value] of [0, 2.5, undefined].entries()) {
        const card = db.find('cards', { boardId }).find(card => card.title.includes(`Estimate ${index}`));
        expect(card.customFields.find(item => item._id === field._id)?.value).toBe(value);
      }
    };
    checkBoard(id);
    const exported = async suffix => {
      const response = await request.get(`/api/boards/${id}/export${suffix}`, { headers: { Authorization: `Bearer ${user.token}` } });
      expect(response.status()).toBe(200); return response.json();
    };
    const jira = await exported('/jira'); expect(jira.wekanScrumMapping).toEqual({ estimateFieldId: 'customfield_10016', estimateUnit: 'points' });
    for (const selection of ['scrum', 'custom-fields']) expect((await exported(`/jira?fields=${selection}`)).wekanScrumMapping).toBeUndefined();
    for (const [document, format] of [[jira, 'jira'], [await exported(''), 'wekan']]) {
      const copied = await page.evaluate(({ document, format }) => Meteor.callAsync('importBoard', document, {}, format), { document, format }); ids.push(copied); checkBoard(copied);
    }
    const copy = await page.evaluate(id => Meteor.callAsync('copyBoard', id, {}), id); ids.push(copy); checkBoard(copy);
    const invalid = { ...source, board: { name: `Invalid ${source.board.name}` }, wekanScrumMapping: jira.wekanScrumMapping, issues: [{ fields: { customfield_10016: -1 } }] };
    const error = await page.evaluate(async input => { try { await Meteor.callAsync('importBoard', input, {}, 'jira'); return null; } catch (error) { return error.error; } }, invalid);
    expect(error).toBe('invalid-jira-estimate'); expect(db.find('boards', { title: invalid.board.name })).toHaveLength(0);
  } finally { for (const id of ids) { db.deleteMany('customFields', { boardIds: id }); db.cleanup({ boardIds: [id] }); } }
});
