'use strict';

// #4652: Firefox used the implicit submit behavior of the list/swimlane color
// buttons and navigated the page before the mutation completed. That was most
// visible when ROOT_URL carried a path prefix. Run this focused regression with
// WEKAN_BASE_URL=http://127.0.0.1:3100/path and the Firefox project.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const PATH_PREFIX = new URL(BASE_URL).pathname.replace(/\/$/, '');

test.describe('#4652 list and swimlane colors behind a URL path', () => {
  test.skip(!PATH_PREFIX, 'requires a live WeKan ROOT_URL with a path prefix');

  test('the browser saves both colors without leaving the prefixed board URL', async ({
    boardPage,
    board,
  }) => {
    const boardPath = `${PATH_PREFIX}/b/${board.boardId}/${board.slug}`;
    await expect(boardPage).toHaveURL(
      new RegExp(`${boardPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );

    await boardPage.locator('.js-open-list-menu').first().click();
    const popup = boardPage.locator('.js-pop-over');
    await popup.locator('.js-set-color-list').click();
    const listColor = popup.locator('.js-palette-color').nth(2);
    const listClass = await listColor.getAttribute('class');
    const expectedListColor = /card-details-([^\s]+)/.exec(
      listClass || '',
    )?.[1];
    expect(expectedListColor).toBeTruthy();
    await listColor.click();
    await popup.locator('.js-submit').click();

    await expect
      .poll(() => db.findOne('lists', { _id: board.listIds[0] })?.color)
      .toBe(expectedListColor);
    await expect(boardPage).toHaveURL(
      new RegExp(`${boardPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );

    await boardPage.locator('.js-open-swimlane-menu').first().click();
    await popup.locator('.js-set-swimlane-color').click();
    const swimlaneColor = popup.locator('.js-palette-color').nth(3);
    const swimlaneClass = await swimlaneColor.getAttribute('class');
    const expectedSwimlaneColor = /card-details-([^\s]+)/.exec(
      swimlaneClass || '',
    )?.[1];
    expect(expectedSwimlaneColor).toBeTruthy();
    await swimlaneColor.click();
    await popup.locator('.js-submit').click();

    await expect
      .poll(() => db.findOne('swimlanes', { _id: board.swimlaneId })?.color)
      .toBe(expectedSwimlaneColor);
    await expect(boardPage).toHaveURL(
      new RegExp(`${boardPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );
  });
});
