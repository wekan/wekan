'use strict';

// Drag-sort reproduction harness.
//
// jQuery-UI sortable (used by WeKan for reordering cards, lists and swimlanes)
// does not react to Playwright's high-level locator.dragTo(): it listens for a
// real mousedown -> incremental mousemoves past its `distance` threshold (7px in
// WeKan) -> mouseup, and updates its placeholder continuously while the pointer
// moves. So we drive the low-level page.mouse API with a realistic, stepped
// gesture from the source card's drag handle to a point on the target card.
//
// Usage:
//   const { dragCardOnto } = require('../helpers/dragSort');
//   await dragCardOnto(page, sourceMinicard, targetMinicard, { place: 'before' });

async function centerOf(locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('dragSort: element has no bounding box (not visible?)');
  return { ...b, cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
}

/**
 * Drag the `source` minicard onto the `target` minicard.
 * @param page      Playwright page
 * @param source    Locator for the source .js-minicard
 * @param target    Locator for the target .js-minicard
 * @param opts.place 'before' (drop above target) | 'after' (drop below target)
 * @param opts.handle CSS for the grab point inside the source (default: the
 *                    minicard body, which is the desktop handle).
 */
async function dragCardOnto(page, source, target, opts = {}) {
  const place = opts.place || 'before';
  // The card sortable handle is the whole `.minicard` on desktop; fall back to
  // the wrapper if a more specific handle is requested.
  const grab = opts.handle ? source.locator(opts.handle).first() : source;

  const s = await centerOf(grab);
  const t = await centerOf(target);

  // Grab near the TOP of the source so the pointer is over the card body, not an
  // inner button.
  const startX = s.cx;
  const startY = s.y + Math.min(12, s.height / 4);

  // Drop point: a few px inside the target's top edge (before) or bottom (after).
  const endX = t.cx;
  const endY = place === 'after' ? t.y + t.height - 6 : t.y + 6;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // 1) Exceed the 7px distance threshold so jQuery-UI starts the drag.
  await page.mouse.move(startX, startY + 12, { steps: 4 });
  await page.mouse.move(startX + 6, startY + 18, { steps: 3 });

  // 2) Travel to the target in several increments so the placeholder follows.
  const STEPS = 14;
  for (let i = 1; i <= STEPS; i++) {
    const x = startX + ((endX - startX) * i) / STEPS;
    const y = startY + ((endY - startY) * i) / STEPS;
    await page.mouse.move(x, y, { steps: 2 });
    await page.waitForTimeout(15);
  }

  // 3) Settle on the target, then drop.
  await page.mouse.move(endX, endY, { steps: 3 });
  await page.waitForTimeout(60);
  await page.mouse.move(endX, endY + (place === 'after' ? 2 : -2), { steps: 2 });
  await page.waitForTimeout(60);
  await page.mouse.up();

  // Let the reactive re-render / server move settle.
  await page.waitForTimeout(400);
}

/** Read the on-screen order of minicard titles within a list element. */
async function listCardTitles(page, listSelector) {
  return page.evaluate(sel => {
    const list = document.querySelector(sel);
    if (!list) return null;
    return [...list.querySelectorAll('.js-minicard .minicard-title, .js-minicard .card-title')]
      .map(e => e.textContent.trim())
      .filter(Boolean);
  }, listSelector);
}

module.exports = { dragCardOnto, listCardTitles, centerOf };
