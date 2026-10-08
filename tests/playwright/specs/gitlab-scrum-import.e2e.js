'use strict';
// GitLab iterations and milestones import as Scrum sprints and releases
// (models/lib/externalScrumPlanning.js), export back to GitLab, and are left
// out when the import page's Scrum settings part is not selected.
// Pure coverage: tests/externalScrumPlanning.test.cjs.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');
const fs = require('node:fs');
const path = require('node:path');

const fixture = fs.readFileSync(path.resolve(__dirname, '../../fixtures/import-formats/gitlab-scrum.json'), 'utf8');

test('a GitLab iteration and milestone import as a sprint and a release, and export back', async ({ loggedInPage: page, request, user }) => {
  const ids = [];
  try {
    await navigateInApp(page, '/import/gitlab');
    await page.locator('#import-textarea').fill(fixture);
    await page.locator('.js-import-without-mapping').click();
    // An upcoming iteration and an active milestone lose nothing: no report.
    expect(await waitForImportedBoard(page)).toBeNull();
    const id = page.url().match(/\/b\/([^/]+)/)[1]; ids.push(id);

    const sprints = db.find('scrumSprints', { boardId: id });
    expect(sprints.map(s => [s.name, s.state, s.provenance.system, s.provenance.recordId])).toEqual([['Sprint 12', 'planned', 'gitlab', '90']]);
    expect(new Date(sprints[0].plannedStart).toISOString().slice(0, 10)).toBe('2026-10-05');
    expect(new Date(sprints[0].plannedEnd).toISOString().slice(0, 10)).toBe('2026-10-16');
    expect(sprints[0].scrumImportPending).toBeUndefined();
    const releases = db.find('scrumReleases', { boardId: id });
    expect(releases.map(r => [r.name, r.state, r.notes])).toEqual([['v3.0', 'planned', 'Spring release']]);
    expect(new Date(releases[0].plannedEnd).toISOString().slice(0, 10)).toBe('2026-10-30');
    const pump = db.findOne('cards', { boardId: id, title: 'Pump controller' });
    const notes = db.findOne('cards', { boardId: id, title: 'Release notes' });
    expect([pump.scrum.sprintId, pump.scrum.releaseId]).toEqual([sprints[0]._id, releases[0]._id]);
    expect([notes.scrum.sprintId || null, notes.scrum.releaseId]).toEqual([null, releases[0]._id]);
    expect(db.findOne('boards', { _id: id }).scrum.enabled).toBe(true);
    expect(db.find('scrumImportPending', { _id: id })).toHaveLength(0);

    // The Scrum view offers the imported sprint.
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-sprints-view').click();
    await expect(page.locator(`.js-scrum-sprint option[value="${sprints[0]._id}"]`)).toHaveText(/Sprint 12/);

    // GitLab export carries them as iteration and milestone; importing that
    // export makes the same sprint and release again.
    const response = await request.get(`/api/boards/${id}/export/gitlab`, { headers: { Authorization: `Bearer ${user.token}` } });
    expect(response.status()).toBe(200);
    const exported = await response.json();
    const issue = exported.find(i => i.title === 'Pump controller');
    expect(issue.iteration).toMatchObject({ title: 'Sprint 12', state: 1, start_date: '2026-10-05', due_date: '2026-10-16' });
    expect(issue.milestone).toMatchObject({ title: 'v3.0', state: 'active', due_date: '2026-10-30' });
    const copied = await page.evaluate(doc => Meteor.callAsync('importBoard', doc, {}, 'gitlab'), exported); ids.push(copied);
    expect(db.find('scrumSprints', { boardId: copied }).map(s => s.name)).toEqual(['Sprint 12']);
    expect(db.find('scrumReleases', { boardId: copied }).map(r => r.name)).toEqual(['v3.0']);
    expect(db.findOne('cards', { boardId: copied, title: 'Pump controller' }).scrum.sprintId).toBeTruthy();
  } finally {
    for (const id of ids) {
      db.deleteMany('scrumSprints', { boardId: id });
      db.deleteMany('scrumReleases', { boardId: id });
      db.deleteMany('scrumImportSteps', { boardId: id });
      db.cleanup({ boardIds: [id] });
    }
  }
});

test('a closed GitLab iteration is reported on the import page and not invented', async ({ loggedInPage: page }) => {
  const issues = JSON.parse(fixture);
  issues[0].iteration.state = 3;
  let id;
  try {
    await navigateInApp(page, '/import/gitlab');
    await page.locator('#import-textarea').fill(JSON.stringify(issues));
    await page.locator('.js-import-without-mapping').click();
    const report = await waitForImportedBoard(page);
    expect(report.join('\n')).toContain('closed iteration "Sprint 12" is not imported');
    id = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.find('scrumSprints', { boardId: id })).toHaveLength(0);
    expect(db.find('scrumReleases', { boardId: id })).toHaveLength(1);
    expect(db.findOne('cards', { boardId: id, title: 'Pump controller' }).scrum.sprintId || null).toBeNull();
  } finally {
    if (id) {
      db.deleteMany('scrumReleases', { boardId: id });
      db.deleteMany('recoveryEvents', { boardIds: id });
      db.cleanup({ boardIds: [id] });
    }
  }
});

test('without the Scrum settings part, a GitLab import makes no sprints or releases', async ({ loggedInPage: page }) => {
  let id;
  try {
    await navigateInApp(page, '/import/gitlab');
    await page.locator('.js-import-part-toggle[data-field="scrum"]').click();
    await page.locator('#import-textarea').fill(fixture);
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    id = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.find('scrumSprints', { boardId: id })).toHaveLength(0);
    expect(db.find('scrumReleases', { boardId: id })).toHaveLength(0);
    expect(db.find('cards', { boardId: id }).every(card => !card.scrum)).toBe(true);
    // The milestone and iteration tags stay, as before.
    const board = db.findOne('boards', { _id: id });
    expect(board.labels.map(l => l.name)).toEqual(expect.arrayContaining(['milestone:v3.0', 'iteration:Sprint 12']));
  } finally {
    if (id) db.cleanup({ boardIds: [id] });
  }
});
