'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

for (const language of ['fi', 'fr', 'ja', 'he']) {
  test(`creation choices render translated labels in ${language}`, async ({ boardPage: page, board }) => {
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await page.evaluate(language => new Promise((resolve, reject) => {
      Meteor.call('setLanguage', language, error => error ? reject(error) : resolve());
    }), language);
    const bp = new BoardPage(page);
    await bp.openAddCardTop(board.listIds[0]);
    const form = bp.list(board.listIds[0]).locator('form').filter({ has: page.locator('textarea.js-card-title') });
    await expect(form.locator('legend')).toHaveText(strings['add-many-lines-as']);
    await expect(form.locator('.multiline-title-choice label')).toHaveText([
      `1 ${strings.card}`, strings['many-items'].replace('__items__', strings.cards),
    ]);
    await expect(form.locator('.multiline-title-choice')).not.toContainText('__items__');
    await expect(form.locator('.multiline-title-choice')).not.toContainText('Many Cards');
    await expect(page.locator('html')).toHaveAttribute('dir', language === 'he' ? 'rtl' : 'ltr');
    await form.locator('textarea.js-card-title').fill('Localized A\nLocalized B');
    await form.locator('.js-multiline-title-mode[value=separate]').check();
    await form.locator('button[type=submit]').click();
    await expect.poll(() => db.find('cards', { boardId: board.boardId })
      .filter(c => /^Localized [AB]$/.test(c.title)).length).toBe(2);
  });
}

test('#6714 cards offer one multiline title or separate cards in paste order', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const list = board.listIds[0];
  await bp.openAddCardTop(list);
  const form = bp.list(list).locator('form').filter({ has: page.locator('textarea.js-card-title') });
  await expect(form.locator('.multiline-title-choice')).toBeVisible();
  await form.locator('textarea.js-card-title').fill('First\n\nSecond\nThird');
  await expect(form.locator('.multiline-title-choice label')).toHaveText(['1 Card', 'Many Cards']);
  await form.locator('.js-multiline-title-mode[value=separate]').check();
  await form.locator('button[type=submit]').click();
  await expect.poll(() => db.find('cards', { boardId: board.boardId, listId: list }).filter(c => ['First', 'Second', 'Third'].includes(c.title)).sort((a,b) => a.sort-b.sort).map(c => c.title)).toEqual(['First', 'Second', 'Third']);
  await expect(form.locator('.multiline-title-choice')).toBeVisible();
  await form.locator('textarea.js-card-title').fill('One\nmultiline card');
  await form.locator('.js-multiline-title-mode[value=one]').check();
  await form.locator('button[type=submit]').click();
  await expect.poll(() => db.find('cards', { boardId: board.boardId, title: 'One\nmultiline card' }).length).toBe(1);
});

test('#6714 lists create individually or retain multiline names and allow editing', async ({ boardPage: page, board }) => {
  await page.locator(`#js-list-${board.listIds[0]} .js-add-list-here`).click();
  const form = page.locator('.js-add-list-inline-form');
  await expect(form.locator('.multiline-title-choice')).toBeVisible();
  await form.locator('textarea.list-name-input').fill('Pasted A\nPasted B');
  await form.locator('.js-multiline-title-mode[value=separate]').check();
  await form.locator('button[type=submit]').click();
  await expect.poll(() => db.find('lists', { boardId: board.boardId }).filter(l => /^Pasted [AB]$/.test(l.title)).sort((a,b) => a.sort-b.sort).map(l => l.title)).toEqual(['Pasted A', 'Pasted B']);
  await expect(form.locator('.multiline-title-choice')).toBeVisible();
  await form.locator('textarea.list-name-input').fill('Two\nlines');
  await form.locator('.js-multiline-title-mode[value=one]').check();
  await form.locator('button[type=submit]').click();
  await expect.poll(() => db.find('lists', { boardId: board.boardId, title: 'Two\nlines' }).length).toBe(1);
  const list = db.findOne('lists', { boardId: board.boardId, title: 'Two\nlines' });
  const heading = page.locator(`#js-list-${list._id} .list-header-name`).first();
  await expect(heading).toHaveCSS('white-space', 'pre-wrap');
  await heading.click();
  const editor = page.locator(`#js-list-${list._id} textarea.list-name-input`);
  await expect(editor).toHaveValue('Two\nlines');
  await editor.fill('Changed\nname');
  await editor.locator('xpath=ancestor::form').locator('button[type=submit]').click();
  await expect.poll(() => db.findOne('lists', { _id: list._id }).title).toBe('Changed\nname');
});

test('#6714 swimlanes create in paste order or preserve a multiline name', async ({ boardPage: page, board }) => {
  const opener = page.locator('.js-open-add-swimlane-menu').first();
  await opener.click();
  let form = page.locator('.js-pop-over form');
  await expect(form.locator('.multiline-title-choice')).toBeVisible();
  await form.locator('textarea.swimlane-name-input').fill('Lane A\nLane B');
  await form.locator('.js-multiline-title-mode[value=separate]').check();
  await form.locator('button[type=submit]').click();
  await expect.poll(() => db.find('swimlanes', { boardId: board.boardId }).filter(l => /^Lane [AB]$/.test(l.title)).sort((a,b) => a.sort-b.sort).map(l => l.title)).toEqual(['Lane A', 'Lane B']);
  await expect(page.locator('textarea.swimlane-name-input')).toHaveCount(0);
  await opener.click();
  form = page.locator('.js-pop-over form');
  await expect(form.locator('.multiline-title-choice')).toBeVisible();
  await form.locator('textarea.swimlane-name-input').fill('Lane\nwith lines');
  await form.locator('.js-multiline-title-mode[value=one]').check();
  await form.locator('button[type=submit]').click();
  await expect.poll(() => db.find('swimlanes', { boardId: board.boardId, title: 'Lane\nwith lines' }).length).toBe(1);
  const lane = db.findOne('swimlanes', { boardId: board.boardId, title: 'Lane\nwith lines' });
  const laneHeader = page.locator(`#swimlane-${lane._id}`).locator('xpath=preceding-sibling::*[1]');
  const heading = laneHeader.locator('.swimlane-header').first();
  await expect(heading).toHaveCSS('white-space', 'pre-wrap');
  await heading.click();
  const editor = laneHeader.locator('textarea.list-name-input');
  await expect(editor).toHaveValue('Lane\nwith lines');
  await editor.fill('Edited\nlane');
  await editor.locator('xpath=ancestor::form').locator('button[type=submit]').click();
  await expect.poll(() => db.findOne('swimlanes', { _id: lane._id }).title).toBe('Edited\nlane');
});


test('#6714 list popup offers the same bulk choice without creating blank lists', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  await bp.openListMenu(board.listIds[0]);
  await page.locator('.js-pop-over .js-add-list').click();
  const form = page.locator('.js-add-list-form');
  await expect(form.locator('.multiline-title-choice')).toBeVisible();
  await form.locator('textarea.list-name-input').fill('Popup A\n\nPopup B');
  await expect(form.locator('.multiline-title-choice label')).toHaveText(['1 List', 'Many Lists']);
  await form.locator('.js-multiline-title-mode[value=separate]').check();
  await form.locator('button[type=submit]').click();
  await expect.poll(() => db.find('lists', { boardId: board.boardId }).filter(l => /^Popup [AB]$/.test(l.title)).sort((a,b) => a.sort-b.sort).map(l => l.title)).toEqual(['Popup A', 'Popup B']);
  expect(db.find('lists', { boardId: board.boardId, title: '' })).toEqual([]);
});


test('boards always show the choice and create one or many from the title', async ({ boardPage: page }) => {
  const created = [];
  const suffix = db.uniqueSuffix();
  try {
    await page.locator('#header-new-board-icon').click();
    let form = page.locator('.js-pop-over form').filter({ has: page.locator('.js-new-board-title') });
    await expect(form.locator('.multiline-title-choice label')).toHaveText(['1 Board', 'Many Boards']);
    await expect(form.locator('[value=one]')).toBeChecked();
    const titles = [`Batch A ${suffix}`, `Batch B ${suffix}`];
    await form.locator('.js-new-board-title').fill(titles.join('\n\n'));
    await form.locator('[value=separate]').check();
    await form.locator('[type=submit]').click();
    await expect.poll(() => db.find('boards', { title: { $in: titles } }).length).toBe(2);
    created.push(...db.find('boards', { title: { $in: titles } }).map(b => b._id));
    await expect(page).toHaveURL(new RegExp(`/b/${created[created.length - 1]}/`));
    await page.locator('#header-new-board-icon').click();
    form = page.locator('.js-pop-over form').filter({ has: page.locator('.js-new-board-title') });
    await expect(form.locator('[value=one]')).toBeChecked();
    const title = `One ${suffix}\nmultiline board`;
    await form.locator('.js-new-board-title').fill(title);
    await form.locator('[type=submit]').click();
    await expect.poll(() => db.find('boards', { title }).length).toBe(1);
    created.push(db.findOne('boards', { title })._id);
  } finally { db.cleanup({ boardIds: created }); }
});
