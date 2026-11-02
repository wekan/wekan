'use strict';

// #6854: the site announcement (Admin Panel -> Announcement) was shown only
// where a board is open, because the banner asked for membership of the current
// board on every page - and Home and All Boards (Remaining, Starred, Templates,
// Archive) have no board. It is for every signed-in user on those pages, and for
// the members of the open board on a board page; nobody signed out sees it
// (#1281).
//
// Run: node tests/announcementAudience.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const source = read('models/announcements.js');
const body = source.slice(source.indexOf('export function showAnnouncementToUser'), source.indexOf('export default Announcements'));
const sandbox = {};
vm.runInNewContext(`${body.replace('export function', 'function')}\nthis.fn = showAnnouncementToUser;`, sandbox);
const show = sandbox.fn;

const member = { hasMember: id => id === 'U' };
assert.equal(show({ userId: 'U', board: null }), true, 'Home and All Boards: no board, signed in');
assert.equal(show({ userId: 'U', board: undefined }), true);
assert.equal(show({ userId: 'U', board: member }), true, 'a member of the open board');
assert.equal(show({ userId: 'V', board: member }), false, 'negative: not a member of the open board');
assert.equal(show({ userId: 'U', board: {} }), false, 'negative: a board that cannot say');
assert.equal(show({ userId: null, board: null }), false, 'negative: signed out (#1281)');
assert.equal(show({ userId: undefined, board: member }), false);

// The banner uses it on every page, and no page-specific membership test is
// left in front of it.
const jade = read('client/components/main/header.jade');
const banner = jade.slice(jade.indexOf('if appIsOffline'), jade.indexOf('template(name="offlineWarning")'));
assert.match(banner, /if announcementForUser\s+if hasAnnouncement/);
assert.doesNotMatch(banner, /isBoardMember/, 'the banner does not wait for a current board');
assert.match(read('client/components/main/header.js'), /showAnnouncementToUser\(\{[\s\S]*Utils\.getCurrentBoard\(\)/);
// The header is part of the default layout, so Home and every All Boards list have it.
assert.match(read('client/components/main/layouts.jade'), /template\(name="defaultLayout"\)[\s\S]*\+header\b/);

console.log('announcementAudience: signed-in users on Home and All Boards, members on a board, nobody signed out');
