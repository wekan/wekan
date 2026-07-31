'use strict';

// Guard for "clicking outside the filter panel closes it".
// Run: node tests/filterSidebarOutsideClick.test.cjs
//
// Reported as "If I use any filter, the modal that appears on screen sometimes
// doesn't disappear. Ideally, this should close the moment I click anything
// outside the modal." It is the board sidebar showing its filter view, and
// nothing dismissed it but the sidebar's own toggle or Escape.
//
// Why: the document click handler in client/lib/escapeActions.js runs
// `clickExecute(target, 'multiselection')`, and `sidebarView` sits BELOW
// `multiselection` in the hierarchy, so `_execute` returns before ever reaching
// it. A click could not close the sidebar by design.
//
// The handler lives in the filter template rather than raising that limit,
// because raising it would make EVERY sidebar view close on any outside click —
// Archive, Settings and Card Settings are panels people work beside on purpose.
// That reasoning is pinned here too, so a later "simplification" that moves it
// into escapeActions has to argue with it first.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const filters = read('client/components/sidebar/sidebarFilters.js');
const escape = read('client/lib/escapeActions.js');
const sidebar = read('client/components/sidebar/sidebar.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('filterSidebarOutsideClick:');

test('a click really cannot reach the sidebar through EscapeActions', () => {
  // The reason this handler exists at all. If either of these changes, the whole
  // approach should be reconsidered rather than left duplicated.
  const hierarchy = escape.slice(escape.indexOf('hierarchy: ['), escape.indexOf('],', escape.indexOf('hierarchy: [')));
  const order = [...hierarchy.matchAll(/'([\w-]+)'/g)].map(m => m[1]);
  assert.ok(order.indexOf('sidebarView') > order.indexOf('multiselection'),
    'sidebarView is below multiselection in the hierarchy');
  assert.ok(/clickExecute\(evt\.target, 'multiselection'\)/.test(escape),
    'and a document click only executes up to multiselection');
  assert.ok(/currentAction\.priority > maxPriority\) return/.test(escape),
    'so _execute stops before sidebarView');
});

test('the filter panel closes on an outside click', () => {
  assert.ok(/Template\.filterSidebar\.onRendered/.test(filters), 'bound while the view is shown');
  assert.ok(/Template\.filterSidebar\.onDestroyed/.test(filters), 'and unbound with it');
  assert.ok(/\$\(document\)\.on\('click\.wekanFilterSidebar'/.test(filters), 'on a namespaced handler');
  assert.ok(/\$\(document\)\.off\('click\.wekanFilterSidebar'/.test(filters),
    'removed by name, so it cannot outlive the panel and close the sidebar later');
  assert.ok(/sidebar\.hide\(\)/.test(filters), 'and it hides the sidebar');
  assert.ok(/getSidebarInstance\(\)/.test(filters),
    'through the accessor the rest of the codebase uses, not a bare global');
});

test('the clicks that must NOT close it', () => {
  const at = filters.indexOf('const OUTSIDE_CLICK_KEEPS_OPEN');
  assert.notStrictEqual(at, -1, 'the exceptions are listed in one place');
  const list = filters.slice(at, filters.indexOf('.join(', at));

  // Inside the panel: obviously.
  assert.ok(list.includes('.board-sidebar'), 'a click inside the panel');
  // The label / member / due-date pickers render OUTSIDE the sidebar, so without
  // this, choosing a value in one would close the panel behind it.
  assert.ok(list.includes('.pop-over'), 'a pop-over the panel opened');
  // Otherwise the same gesture that opens the filter closes it again.
  assert.ok(list.includes('.js-open-filter-view'), 'the header button that opens it');

  const handler = filters.slice(filters.indexOf('_closeOnOutsideClick = evt =>'));
  assert.ok(/closest\(OUTSIDE_CLICK_KEEPS_OPEN\)\.length > 0\) return/.test(handler),
    'and the handler actually consults that list');
  assert.ok(/evt\.button !== 0\) return/.test(handler),
    'left button only, like the EscapeActions click handler');
  assert.ok(/sidebar\.isOpen\(\)\) return/.test(handler),
    'and it does nothing when the sidebar is already closed');
});

test('the click that OPENED the panel cannot close it in the same gesture', () => {
  // The template renders during a flush that can still be inside the opening
  // click's propagation, so binding immediately would let that click reach the
  // handler it just created.
  assert.ok(/setTimeout\(\(\) => \{\s*\$\(document\)\.on\('click\.wekanFilterSidebar'/.test(filters),
    'the handler is bound on the next tick');
  assert.ok(/clearTimeout\(this\._bindOutsideClick\)/.test(filters),
    'and a panel destroyed before that tick does not leave one behind');
});

test('Escape still does what it did', () => {
  // The existing sidebarView action is untouched: Escape returns the sidebar to
  // its default view rather than hiding it, and this change must not alter that.
  assert.ok(/EscapeActions\.register\(\s*'sidebarView'/.test(sidebar),
    'the existing registration is still there');
  assert.ok(/Sidebar\.setView\(defaultView\)/.test(sidebar), 'still resetting to the default view');
  assert.ok(!/enabledOnClick/.test(sidebar),
    'and this change did not have to touch its options');
});

console.log(`\nfilterSidebarOutsideClick: ${passed} tests passed`);
