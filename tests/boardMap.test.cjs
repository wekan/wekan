'use strict';

// #3256: the Map board view (models/lib/boardMap.js). Run: node tests/boardMap.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { clampPercent, percentFromPoint, isPlaced, mapMarker } = require('../models/lib/boardMap.js');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

assert.equal(clampPercent(25), 25);
assert.equal(clampPercent('33.3333'), 33.33);
assert.equal(clampPercent(-5), 0);
assert.equal(clampPercent(140), 100);
for (const bad of [null, undefined, '', '  ', 'x', NaN, Infinity, {}]) assert.equal(clampPercent(bad), null, String(bad));
const rect = { left: 100, top: 50, width: 400, height: 200 };
assert.deepEqual(percentFromPoint({ clientX: 200, clientY: 150 }, rect), { x: 25, y: 50 });
assert.deepEqual(percentFromPoint({ clientX: 0, clientY: 999 }, rect), { x: 0, y: 100 }, 'outside the image lands on its edge');
assert.equal(percentFromPoint({ clientX: 1, clientY: 1 }, { left: 0, top: 0, width: 0, height: 10 }), null);
console.log('  ok - positions are percentages of the image, clamped to it');

const board = { labels: [{ _id: 'l1', color: 'red' }, { _id: 'l2', color: 'green' }] };
assert.ok(isPlaced({ mapX: 0, mapY: 0 }), 'the top-left corner is a place');
assert.ok(!isPlaced({ mapX: 10 }) && !isPlaced({}) && !isPlaced(null));
assert.ok(!isPlaced({ mapX: null, mapY: null }), 'null is not the top-left corner');
assert.ok(!isPlaced({ mapX: true, mapY: [] }));
assert.deepEqual(mapMarker({ mapX: 10, mapY: 20, labelIds: ['gone', 'l2', 'l1'], cardNumber: 7, title: 'Pump' }, board),
  { x: 10, y: 20, color: 'green', text: '7', title: 'Pump' });
assert.deepEqual(mapMarker({ mapX: 10, mapY: 20, title: 'Valve' }, board), { x: 10, y: 20, color: null, text: '', title: 'Valve' });
assert.equal(mapMarker({ title: 'Not placed' }, board), null);
console.log('  ok - a marker carries its place, first label colour and card number');

// Wiring: every registry knows the view, and the data is validated.
assert.match(read('models/lib/boardViewSettings.js'), /\{ view: 'board-view-map', labelKey: 'board-view-map', icon: 'fa-map-marker' \}/);
assert.match(read('client/components/boards/boardBody.jade'), /else if isViewMap\n\s*\+mapView/);
assert.match(read('client/components/boards/boardHeader.js'), /'click \.js-open-map-view'\(\) \{\s*Utils\.setBoardView\('board-view-map'\);/);
assert.equal((read('client/lib/utils.js').match(/'board-view-map',/g) || []).length, 2, 'stored and restored');
assert.match(read('models/users.js'), /'board-view-size-cycle-time',\s*'board-view-map',/);
const cards = read('models/cards.js');
assert.match(cards, /mapX: \{[\s\S]*?type: Number,\s*optional: true,\s*min: 0,\s*max: 100,/);
assert.match(cards, /mapY: \{[\s\S]*?type: Number,\s*optional: true,\s*min: 0,\s*max: 100,/);
assert.match(cards, /async setMapPosition\(x, y\) \{[\s\S]*?if \(mapX === null \|\| mapY === null\) return this\.clearMapPosition\(\);/);
assert.match(read('models/boards.js'), /mapImageAttachmentId: \{[\s\S]*?type: String,\s*optional: true,/);
const view = read('client/components/boards/mapView.js');
assert.match(view, /meta: \{ boardId: board\._id, source: 'board-map' \}/);
assert.match(view, /'drop \.js-map-canvas'\(event\) \{\s*event\.preventDefault\(\);\s*if \(!Utils\.canModifyBoard\(\)\) return;/, 'only editors place cards');
assert.match(read('client/features/boards.js'), /import '\/client\/components\/boards\/mapView\.js';/);
// The board's drag-to-scroll cancels mousedown, which would stop every drag.
assert.match(read('client/components/boards/mapView.jade'), /\.map-view\.js-map-view\.nodragscroll/);
execFileSync(process.execPath, ['--input-type=module', '--check'], { input: view });
console.log('  ok - the view is registered everywhere and its data is validated');
