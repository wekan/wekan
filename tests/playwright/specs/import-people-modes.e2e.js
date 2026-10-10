'use strict';
// "People in the file" (models/lib/importMembersMode.js): for every import
// source, the people named in the file become existing users chosen in the
// map-members step, placeholder users keeping their names, or the person
// importing. ClickUp is a source of the generalized importer, whose people the
// page reads through the server's parser (importBoard with previewPeople).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');

const csv = person => `Task Name,Status,Assignees\nPeople card,to do,[${person}]\n`;
const peopleOf = card => [...(card.members || []), ...(card.assignees || [])];

async function fillClickUp(page, person) {
  await navigateInApp(page, '/import/clickup');
  await page.locator('#import-textarea').fill(csv(person));
}

async function chooseMode(page, mode) {
  await page.locator(`.js-import-members-mode[data-mode="${mode}"]`).click();
  await expect(page.locator(`.js-import-members-mode[data-mode="${mode}"] .materialCheckBox`)).toHaveClass(/is-checked/);
}

for (const language of ['en', 'zu', 'zu-ZA', 'xh', 'pap', 'eo', 'fi', 'sv', 'nb', 'da', 'it']) {
test(`Make them all me: every person becomes the person importing in ${language}`, async ({ loggedInPage: page, user }) => {
  await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
  const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
  const person = `me-mode-${Date.now()}`;
  let boardId;
  try {
    await fillClickUp(page, person);
    await expect(page.locator('.js-import-members-mode[data-mode="me"]')).toContainText(strings['import-members-mode-me']);
    await chooseMode(page, 'me');
    await page.locator('#import-textarea').press('Tab');
    await page.locator('form input[type="submit"]').first().click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const [card] = db.find('cards', { boardId });
    expect(peopleOf(card)).toContain(user.id);
    expect(db.find('users', { importUsernames: person })).toHaveLength(0);
  } finally {
    if (boardId) db.cleanup({ boardIds: [boardId] });
    await page.evaluate(() => Session.set('importMembersMode', 'map'));
  }
});

}

test('Placeholder users keep the original person, inactive and unable to log in', async ({ loggedInPage: page }) => {
  const person = `placeholder-${Date.now()}`;
  let boardId;
  try {
    await fillClickUp(page, person);
    await chooseMode(page, 'placeholder');
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const [placeholder] = db.find('users', { importUsernames: person });
    expect(placeholder).toBeTruthy();
    // Unable to log in; "inactive" is its board membership below. The users
    // schema has no isActive, so the field is not stored on the account (nor
    // on Trello's placeholders, which write it too).
    expect(placeholder.loginDisabled).toBe(true);
    expect(placeholder.username).toBe(person);
    const [card] = db.find('cards', { boardId });
    expect(peopleOf(card)).toContain(placeholder._id);
    const member = db.findOne('boards', { _id: boardId }).members.find(m => m.userId === placeholder._id);
    expect(member).toMatchObject({ isActive: false, isAdmin: false });
  } finally {
    if (boardId) db.cleanup({ boardIds: [boardId] });
    db.deleteMany('users', { importUsernames: person });
  }
});

test('Choose existing users: the file\'s people are listed to map; one left unmapped becomes a placeholder', async ({ loggedInPage: page }) => {
  const person = `mapped-${Date.now()}`;
  let boardId;
  try {
    await fillClickUp(page, person);
    await chooseMode(page, 'map');
    await page.locator('form input[type="submit"]').first().click();
    // The map-members step lists the person the server's parser found.
    await expect(page.locator('.mapping-item .username', { hasText: person })).toBeVisible({ timeout: 15_000 });
    await page.locator('.map-members form input[type="submit"]').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.find('users', { importUsernames: person })).toHaveLength(1);
  } finally {
    if (boardId) db.cleanup({ boardIds: [boardId] });
    db.deleteMany('users', { importUsernames: person });
  }
});
