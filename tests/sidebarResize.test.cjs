'use strict';

// Guard for the right board sidebar drag-to-resize feature:
// - a resize handle on the sidebar's (logical) left edge (RTL-safe),
// - width persisted to the user profile for logged-in users and to localStorage
//   for anonymous users on a public board,
// - RTL: the handle sits on the right edge of the left-docked sidebar and the
//   drag direction is inverted,
// - desktop only: the handle is hidden and no inline width is applied on phones.
//
// Run: node tests/sidebarResize.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

const jade = read('client/components/sidebar/sidebar.jade');
const css = read('client/components/sidebar/sidebar.css');
const js = read('client/components/sidebar/sidebar.js');
const users = read('models/users.js');
const serverUsers = read('server/models/users.js');

console.log('sidebarResize:');

test('jade: sidebar has the resize handle', () => {
  assert.ok(/js-sidebar-resize-handle/.test(jade));
});

test('css: handle uses a LOGICAL left offset (RTL-safe) and col-resize cursor', () => {
  const m = css.match(/\.sidebar-resize-handle\s*\{[\s\S]*?\}/g).join('\n') +
    (css.match(/\.board-sidebar\.is-open \.sidebar-resize-handle\s*\{[\s\S]*?\}/) || [''])[0];
  assert.ok(/inset-inline-start/.test(css), 'must use inset-inline-start (not left) so RTL flips to the right edge');
  assert.ok(/cursor:\s*col-resize/.test(css));
});

test('css: the handle is hidden on phones (sidebar is full width there)', () => {
  // Inside the max-width media query the handle must be display:none.
  const mq = css.slice(css.indexOf('@media screen and (max-width: 800px)'));
  assert.ok(/\.sidebar-resize-handle\s*\{[^}]*display:\s*none/.test(mq),
    'the resize handle must be display:none on phones');
});

test('js: resize is bounded and desktop-only', () => {
  assert.ok(/MIN_SIDEBAR_WIDTH/.test(js), 'a minimum width must be enforced');
  assert.ok(/isMobileSidebar/.test(js) && /return;\s*\/\/ no resize on phones|isMobileSidebar\(\)\) return/.test(js),
    'resize must be skipped on phones');
});

test('js: RTL inverts the drag direction', () => {
  assert.ok(/isRtl\(\)\s*\?\s*-1\s*:\s*1/.test(js), 'direction must invert for RTL');
  assert.ok(/getAttribute\('dir'\)|document\.dir/.test(js), 'RTL is detected from the dir attribute');
});

test('js: persistence — profile for logged-in, localStorage for anonymous', () => {
  const save = js.slice(js.indexOf('function saveSidebarWidth'), js.indexOf('function applySavedSidebarWidth'));
  assert.ok(/ReactiveCache\.getCurrentUser\(\)/.test(save), 'branches on the logged-in user');
  assert.ok(/Meteor\.call\(\s*'setSidebarWidth'/.test(save), 'logged-in -> setSidebarWidth method');
  assert.ok(/localStorage\.setItem\(SIDEBAR_WIDTH_STORAGE_KEY/.test(save), 'anonymous -> localStorage');
});

test('model: user has getSidebarWidth/setSidebarWidth and a schema field', () => {
  assert.ok(/getSidebarWidth\(\)/.test(users));
  assert.ok(/setSidebarWidth\(width\)/.test(users));
  assert.ok(/'profile\.sidebarWidth'/.test(users), 'profile.sidebarWidth must be in the schema');
});

test('server: setSidebarWidth method validates a Number and updates the profile', () => {
  const m = serverUsers.slice(serverUsers.indexOf('async setSidebarWidth(width)'));
  assert.ok(m.startsWith('async setSidebarWidth(width)'));
  assert.ok(/check\(width,\s*Number\)/.test(m.slice(0, 200)), 'must check(width, Number)');
});

console.log(`\n${passed} passed`);
