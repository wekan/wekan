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
