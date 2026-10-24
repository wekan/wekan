'use strict';
// #6786: in a right-to-left language a checked checkbox drew "<" instead of a
// check mark, because the tick's side border was logical (border-inline-end),
// which a right-to-left page puts on the left. The tick must be the same shape
// in both directions: green bottom and RIGHT border, rotated.
const { test, expect } = require('../fixtures');

test('a checked checkbox is the same check mark left-to-right and right-to-left', async ({ boardPage: page }) => {
  const sides = await page.evaluate(() => {
    const result = {};
    for (const dir of ['ltr', 'rtl']) {
      const host = document.createElement('div');
      host.setAttribute('dir', dir);
      const box = document.createElement('div');
      box.className = 'materialCheckBox is-checked';
      host.appendChild(box);
      document.body.appendChild(host);
      const s = getComputedStyle(box);
      result[dir] = {
        right: s.borderRightColor, left: s.borderLeftColor,
        bottom: s.borderBottomColor, transform: s.transform,
      };
      host.remove();
    }
    return result;
  });
  for (const dir of ['ltr', 'rtl']) {
    // The colour is the board theme's (boardColors.css), so it is compared
    // with the bottom border rather than spelled out.
    expect(sides[dir].right, `${dir} right border`).toBe(sides[dir].bottom);
    expect(sides[dir].bottom, `${dir} bottom border`).not.toBe('rgba(0, 0, 0, 0)');
    // negative: the left side stays clear, or the rotated corner opens as "<".
    expect(sides[dir].left, `${dir} left border`).toBe('rgba(0, 0, 0, 0)');
    expect(sides[dir].transform).not.toBe('none');
  }
  expect(sides.rtl).toEqual(sides.ltr);
});

// #6786, the second report: with the borders right, the tick was still PLACED
// with inset-inline-start/margin-inline-end, which flip right-to-left - so it
// sat beside its square ("out of box"). It must land on its square, in the same
// place in both directions, and ticking must not move the label.
test('a checked checkbox sits on its own square left-to-right and right-to-left', async ({ boardPage: page }) => {
  const geometry = await page.evaluate(() => {
    const result = {};
    for (const dir of ['ltr', 'rtl']) {
      const host = document.createElement('div');
      host.setAttribute('dir', dir);
      host.style.width = '300px';
      const row = document.createElement('a');
      row.className = 'flex';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      const box = document.createElement('span');
      box.className = 'materialCheckBox';
      box.style.transition = 'none';
      const label = document.createElement('span');
      label.textContent = 'Label';
      row.append(box, label);
      host.appendChild(row);
      document.body.appendChild(host);
      const square = box.getBoundingClientRect();
      const labelBefore = label.getBoundingClientRect();
      box.classList.add('is-checked');
      const tick = box.getBoundingClientRect();
      const labelAfter = label.getBoundingClientRect();
      result[dir] = {
        squareLeft: square.left, squareRight: square.right,
        tickCenter: (tick.left + tick.right) / 2,
        tickFromSquareLeft: tick.left - square.left,
        labelMoved: Math.abs(labelAfter.left - labelBefore.left),
      };
      host.remove();
    }
    return result;
  });
  for (const dir of ['ltr', 'rtl']) {
    const g = geometry[dir];
    expect(g.tickCenter, `${dir}: the tick is on its square`).toBeGreaterThanOrEqual(g.squareLeft);
    expect(g.tickCenter, `${dir}: the tick is on its square`).toBeLessThanOrEqual(g.squareRight);
    expect(g.labelMoved, `${dir}: ticking does not move the label`).toBeLessThanOrEqual(1);
  }
  // The same place on the square in both directions.
  expect(Math.abs(geometry.rtl.tickFromSquareLeft - geometry.ltr.tickFromSquareLeft)).toBeLessThanOrEqual(1);
});
