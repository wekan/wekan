'use strict';

/**
 * #6903 - the swimlane-height resize line spans the whole visible width of a
 * swimlane whose row of lists is scrolled right. It used to scroll away with
 * the lists and end short of the right edge by the scrolled distance.
 * tests/swimlaneResizeHandleScroll6903.test.cjs drives the logic.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

async function edges(page, swimlaneId) {
  return page.evaluate(id => {
    const lane = document.getElementById(`swimlane-${id}`);
    const handle = lane.querySelector('.js-swimlane-resize-handle');
    const l = lane.getBoundingClientRect();
    const h = handle.getBoundingClientRect();
    return { laneLeft: l.left, laneRight: l.left + lane.clientWidth, handleLeft: h.left, handleRight: h.right,
      scrollLeft: lane.scrollLeft, scrollable: lane.scrollWidth - lane.clientWidth };
  }, swimlaneId);
}

test('the resize line covers the visible swimlane at every horizontal scroll position', async ({ page, user }) => {
  const board = db.seedBoard({ ownerId: user.id, listCount: 14, cardTitlesPerList: [['Alpha Card']] });
  try {
    await loginWithToken(page, user.id, user.token);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openBoard(page, board.boardId, board.slug);
    await expect(page.locator(`#swimlane-${board.swimlaneId} .js-swimlane-resize-handle`)).toHaveCount(1);

    const start = await edges(page, board.swimlaneId);
    expect(start.scrollable, '14 lists are wider than the viewport').toBeGreaterThan(300);
    expect(Math.abs(start.handleLeft - start.laneLeft)).toBeLessThan(3);
    expect(Math.abs(start.handleRight - start.laneRight)).toBeLessThan(3);

    for (const fraction of [0.5, 1]) {
      await page.evaluate(([id, f]) => {
        const lane = document.getElementById(`swimlane-${id}`);
        lane.scrollLeft = (lane.scrollWidth - lane.clientWidth) * f;
        lane.dispatchEvent(new Event('scroll'));
      }, [board.swimlaneId, fraction]);
      await expect.poll(async () => {
        const e = await edges(page, board.swimlaneId);
        return e.scrollLeft > 0 && Math.abs(e.handleRight - e.laneRight) < 3 && Math.abs(e.handleLeft - e.laneLeft) < 3;
      }, { message: `scrolled ${fraction * 100}%: the line reaches both edges` }).toBe(true);
    }

    // Negative: hovering the right end of the scrolled line is still the
    // resize handle, not the list under it.
    const e = await edges(page, board.swimlaneId);
    const box = await page.locator(`#swimlane-${board.swimlaneId} .js-swimlane-resize-handle`).boundingBox();
    const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.js-swimlane-resize-handle'),
      [e.laneRight - 10, box.y + box.height / 2]);
    expect(hit).toBe(true);
  } finally { db.cleanup({ boardIds: [board.boardId] }); }
});
