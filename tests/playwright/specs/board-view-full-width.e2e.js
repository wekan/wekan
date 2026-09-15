const { test, expect } = require('../fixtures');

for (const view of ['timeline', 'time', 'stats']) {
  test(`${view} content spans the board at desktop and mobile widths`, async ({ boardPage }) => {
    await boardPage.locator('.js-toggle-board-view').first().click();
    await boardPage.locator(`.pop-over .js-open-${view}-view`).click();
    const content = boardPage.locator('.stats-view-content').first();
    await expect(content).toBeVisible();
    for (const width of [1440, 375]) {
      await boardPage.setViewportSize({ width, height: 900 });
      await expect.poll(async () => content.evaluate(element => {
        const box = element.getBoundingClientRect();
        const parent = element.parentElement.getBoundingClientRect();
        return Math.max(Math.abs(box.left - parent.left), Math.abs(box.right - parent.right));
      })).toBeLessThanOrEqual(1);
    }
  });
}
