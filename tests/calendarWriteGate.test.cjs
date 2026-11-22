'use strict';
// The Calendar view offers its writes - dragging a card to another day, and a
// click on a day that adds a card - only to who may write on the board. The
// server refuses them for anybody else (createCardWithDueDate, DueDateBleed)
// and records the refusal in Admin Panel / Problems as an attempt; a calendar
// that offered the click to a read-only member made every such click look like
// an attack.
// Run: node tests/calendarWriteGate.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const body = read('client/components/boards/boardBody.js');
assert.match(body, /editable: Utils\.canModifyBoard\(\),\s*selectable: Utils\.canModifyBoard\(\),/);
// Negative: no calendar of this view offers the writes to everyone.
assert.doesNotMatch(body.slice(body.indexOf("id: 'calendar-view'")), /^\s*selectable: true,/m);
const server = read('server/models/cards.js');
const method = server.slice(server.indexOf('async createCardWithDueDate('), server.indexOf('async createCardWithDueDate(') + 1500);
assert.match(method, /allowIsBoardMemberWithWriteAccess\(this\.userId, destBoard\)/, 'the server still refuses');
assert.match(method, /record\(\{ key: 'authz\.copy', action: 'blocked'/, 'and records the refusal');
console.log('calendarWriteGate: the calendar offers writes only to writers; the server refuses and records the rest');
