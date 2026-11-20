'use strict';
// The Board View menu is grouped under headings - Board, Calendar and time,
// Scrum, Kanban flow, Overview, Communication and code - with the board's own
// order inside each (models/lib/boardViewSettings.js BOARD_VIEW_GROUPS).
const { test, expect } = require('../fixtures');
const en = require('../../../imports/i18n/data/en.i18n.json');

const HEADINGS = ['board-view-group-board', 'board-view-group-calendar', 'board-view-group-scrum',
  'board-view-group-flow', 'board-view-group-overview', 'board-view-group-communication'].map(key => en[key]);

test('the Board View menu shows its groups in order, each view under its own', async ({ boardPage: page }) => {
  await page.locator('.js-toggle-board-view').first().click();
  const menu = page.locator('.pop-over .pop-over-list').first();
  await expect(menu.locator('.board-view-group-heading')).toHaveText(HEADINGS);
  // Swimlanes is under Board, Sprints under Scrum, Cumulative Flow under Kanban flow.
  const order = await menu.locator('li').evaluateAll(items => items.map(li => li.classList.contains('board-view-group-heading')
    ? `#${li.textContent.trim()}` : (li.querySelector('a') || {}).className || ''));
  const at = text => order.findIndex(entry => entry.includes(text));
  expect(at('js-open-swimlanes-view')).toBeGreaterThan(at(`#${HEADINGS[0]}`));
  expect(at('js-open-swimlanes-view')).toBeLessThan(at(`#${HEADINGS[1]}`));
  expect(at('js-open-sprints-view')).toBeGreaterThan(at(`#${HEADINGS[2]}`));
  expect(at('js-open-sprints-view')).toBeLessThan(at(`#${HEADINGS[3]}`));
  expect(at('js-open-cumulative-flow-view')).toBeGreaterThan(at(`#${HEADINGS[3]}`));
  // A heading is not a menu entry: clicking it changes nothing and keeps the menu.
  await menu.locator('.board-view-group-heading').first().click();
  await expect(menu).toBeVisible();
});
