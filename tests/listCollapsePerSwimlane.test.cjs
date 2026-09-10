'use strict';

// A board-wide list (no swimlaneId of its own) renders once per swimlane in
// Swimlanes view - the SAME list document, one row per swimlane
// (client/components/swimlanes/swimlanes.js's `lists()` helper: "shared /
// pre-migration lists (swimlaneId empty or null)" are returned for EVERY
// swimlane). Collapsing/expanding it used to be a single Session/profile key
// keyed only by list._id, so collapsing the list in swimlane 1's row also
// collapsed swimlane 2's row of the very same list - reported as "collapse
// or archive list at swimlane 1 affects other lists at swimlane 2".
//
// Archive is unaffected: Lists.archive()/restore() already scope to
// `this._id` (models/lists.js), and event handlers bind `this` per-row, so a
// board-wide list archived in one swimlane correctly disappears from every
// swimlane's row of it - because it IS the one shared list document, not a
// different one. Collapse (client-only display state, not scoped to a
// single row before this fix) was the real, fixable bug.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// --- Utils.getListCollapseState/setListCollapseState: a swimlaneId argument
// builds a DIFFERENT storage key per swimlane, for the SAME list ---
const utils = read('client/lib/utils.js');
assert.match(utils, /getListCollapseState\(list, swimlaneId\)\s*\{/);
assert.match(utils, /setListCollapseState\(list, collapsed, swimlaneId\)\s*\{/);
assert.match(utils, /const storageId = swimlaneId \? `\$\{list\._id\}:\$\{swimlaneId\}` : list\._id;/g);
// Both the Session cache key and the persisted (Meteor method / public
// cookie) key must use the swimlane-scoped storageId, not the bare list id -
// otherwise one half of the fix still bleeds across swimlanes.
assert.match(utils, /const key = `collapsedList-\$\{storageId\}`;/);
assert.match(utils, /user\.getCollapsedListFromStorage\(list\.boardId, storageId\)/);
assert.match(utils, /Users\.getPublicCollapsedList\(list\.boardId, storageId\)/);
assert.match(utils, /Meteor\.call\('setListCollapsedState', list\.boardId, storageId, !!collapsed\)/);
assert.match(utils, /Users\.setPublicCollapsedList\(list\.boardId, storageId, !!collapsed\)/);

// Pure logic check of the storageId formula itself (mirrors utils.js exactly).
function storageId(listId, swimlaneId) {
  return swimlaneId ? `${listId}:${swimlaneId}` : listId;
}
assert.equal(storageId('list1', 'swim1'), 'list1:swim1');
assert.equal(storageId('list1', 'swim2'), 'list1:swim2');
assert.notEqual(storageId('list1', 'swim1'), storageId('list1', 'swim2'),
  'the same list in two different swimlanes must get two different storage keys');
assert.equal(storageId('list1', undefined), 'list1',
  'outside Swimlanes view (no swimlaneId), the key is unchanged - backward compatible with existing stored state');

// --- every call site that reads/writes list collapse state resolves and
// passes a swimlaneId, not just the bare list ---
const listHeader = read('client/components/lists/listHeader.js');
assert.match(listHeader, /function resolveContainerSwimlaneId\(list\)/);
// The helper the jade template's own `if collapsed` reads.
assert.match(listHeader, /collapsed\(\) \{\s*const list = Template\.currentData\(\);\s*return Utils\.getListCollapseState\(list, resolveContainerSwimlaneId\(list\)\);/);
// The click handler that actually toggles it.
const clickHandlerMatch = listHeader.match(/'click \.js-collapse'\(event\) \{([\s\S]*?)\},/);
assert.ok(clickHandlerMatch, 'the .js-collapse click handler exists');
const clickHandlerBody = clickHandlerMatch[1];
assert.match(clickHandlerBody, /const swimlaneId = resolveContainerSwimlaneId\(list\);/);
assert.match(clickHandlerBody, /Utils\.getListCollapseState\(list, swimlaneId\)/);
assert.match(clickHandlerBody, /Utils\.setListCollapseState\(list, !status, swimlaneId\)/);

const list = read('client/components/lists/list.js');
assert.match(list, /function resolveContainerSwimlaneId\(list\)/);
assert.match(list, /collapsed\(\) \{\s*return Utils\.getListCollapseState\(this, resolveContainerSwimlaneId\(this\)\);/);
// The drag-resize-handle visibility logic runs from onCreated/async code with
// no active Blaze render for Template.parentData() to read - it needs the
// View-walking variant instead (negative: Template.parentData() would
// silently return undefined there and fall back to unscoped behavior).
assert.match(list, /function resolveContainerSwimlaneIdFromView\(view, list\)/);
assert.match(list, /const swimlaneId = resolveContainerSwimlaneIdFromView\(tpl\.view, list\);/);
const initResize = list.slice(list.indexOf('tpl.initializeListResize = function'));
assert.match(initResize, /Utils\.getListCollapseState\(list, swimlaneId\)/g);
assert.doesNotMatch(initResize.split('resolveContainerSwimlaneIdFromView')[0], /Utils\.getListCollapseState\(list\)(?!,)/,
  'no remaining bare (unscoped) getListCollapseState(list) call in the resize-handle logic (negative)');

console.log('listCollapsePerSwimlane: a board-wide list\'s collapse state is scoped per swimlane row, not shared across all of them');
