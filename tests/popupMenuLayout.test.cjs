'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const source = fs.readFileSync('client/lib/popupMenuLayout.js', 'utf8');
  const { updatePopupMenuColumns } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const classes = () => {
    const values = new Set();
    return { contains: name => values.has(name), toggle: (name, on) => on ? values.add(name) : values.delete(name) };
  };
  const entry = (sizes, widget = false) => ({
    classList: classes(),
    children: sizes.map(n => ({ matches: () => true, querySelectorAll: () => Array(n) })),
    querySelector: selector => selector.startsWith('form,') && widget,
  });
  let active = entry([4, 4]);
  const parent = active;
  const entries = [parent];
  const popup = { classList: classes(), querySelector: () => active, querySelectorAll: () => entries };
  assert.equal(updatePopupMenuColumns(popup), true, 'grouped lists combine without losing separators');
  assert.equal(parent.classList.contains('popup-menu-columns'), true);
  active = entry([20], true); entries.push(active);
  assert.equal(updatePopupMenuColumns(popup), false, 'forms/widgets never become menu columns');
  assert.equal(parent.classList.contains('popup-menu-columns'), false, 'hidden parent does not widen child');
  active = parent;
  assert.equal(updatePopupMenuColumns(popup), true, 'back navigation restores columns');
  active = entry([7]); entries.push(active);
  assert.equal(updatePopupMenuColumns(popup), false, 'short or permission-filtered menus remain compact');
  active = null;
  assert.equal(updatePopupMenuColumns(popup), false, 'empty/unrendered popup is safe');
  console.log('Popup menus: groups, widgets, stack navigation, short menus and empty states pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
