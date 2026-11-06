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
  popup.dataset = { popup: 'changeLanguagePopup' };
  assert.equal(updatePopupMenuColumns(popup), false, 'fullscreen language layout must not be overridden');
  assert.equal(parent.classList.contains('popup-menu-columns'), false);
  popup.dataset.popup = 'memberMenuPopup';
  assert.equal(updatePopupMenuColumns(popup), true, 'ordinary menus still use columns');
  active = entry([7]); entries.push(active);
  assert.equal(updatePopupMenuColumns(popup), false, 'short or permission-filtered menus remain compact');
  active = null;
  assert.equal(updatePopupMenuColumns(popup), false, 'empty/unrendered popup is safe');
  console.log('Popup menus: groups, widgets, stack navigation, short menus and empty states pass');

  // The layout is applied before the popup is painted, not a frame later. On
  // the next animation frame the popup had already been drawn - and clicked
  // or dragged - at its narrow size, then jumped to 960px under the pointer:
  // Board View's "Lists" click landed on "Calendar" (06-views-layout,
  // Firefox) and a drag clamped for the narrow size
  // (card-title-edit-and-move-6839).
  const popupJs = fs.readFileSync('client/components/main/popup.js', 'utf8');
  const observer = popupJs.match(/this\._menuLayoutObserver = new MutationObserver\(([^;]*)\);/);
  assert.ok(observer, 'popup.js observes the popup for its menu layout');
  assert.doesNotMatch(observer[1], /requestAnimationFrame|setTimeout|Meteor\.defer/,
    'the menu layout must be applied in the observer callback itself, before the next paint');
  assert.doesNotMatch(popupJs, /requestAnimationFrame\(update\)/, 'negative: no deferred menu layout anywhere in popup.js');
  // And driven: a mutation applies the layout synchronously.
  let callback = null;
  let applied = 0;
  const onRendered = popupJs.match(/Popup\.template\.onRendered\(function \(\) \{([\s\S]*?)\n\}\);/)[1];
  const vm = require('node:vm');
  const element = { addEventListener() {}, dataset: {}, classList: { contains: () => false } };
  vm.runInNewContext(`(function () {${onRendered}}).call(self)`, {
    self: { find: () => element, autorun() {}, popupMaximized: { set() {} } },
    MutationObserver: class { constructor(fn) { callback = fn; } observe() {} },
    updatePopupMenuColumns: () => { applied += 1; },
    requestAnimationFrame: () => { throw new Error('deferred to an animation frame'); },
    ResizeObserver: undefined, Template: { currentData: () => ({}) }, Tracker: { afterFlush() {} },
    MAXIMIZABLE_POPUPS: new Set(), MOVABLE_POPUPS: new Set(), trapTabKey() {}, keptInside() {},
    rememberedMaximized: () => false, setPopupMaximized() {}, $: () => ({ addClass() {}, one() {} }), CSSEvents: {},
  });
  const before = applied;
  callback([]);
  assert.equal(applied, before + 1, 'a mutation applies the layout at once');
  console.log('Popup menu layout is applied before the popup is painted');
})().catch(error => { console.error(error); process.exitCode = 1; });
