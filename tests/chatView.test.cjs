'use strict';

// Board View / Chat: the saved layout, the pane order in both reading
// directions, the resize arithmetic, the channel tree, where a drop goes, and
// the wiring.
// Run: node tests/chatView.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  DEFAULT_LAYOUT, MIN_WIDTH, MAX_WIDTH, cleanChatLayout, paneOrder, resizePane, buildBoardTree,
  buildWorkspaceTree, dropNeighbours, dropAllowed, buildChannelTree,
} = require('../models/lib/chatView');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('the layout keeps only known keys, clamps widths, and defaults the rest', () => {
  assert.deepEqual(cleanChatLayout(undefined), DEFAULT_LAYOUT);
  assert.deepEqual(cleanChatLayout({ treeWidth: '300.4', chatWidth: 99999, treeCollapsed: true, chatCollapsed: 'yes', $set: 1 }),
    { treeWidth: 300, chatWidth: MAX_WIDTH, treeCollapsed: true, cardCollapsed: false, chatCollapsed: false });
  assert.equal(cleanChatLayout({ treeWidth: -5 }).treeWidth, MIN_WIDTH);
  assert.equal(cleanChatLayout({ treeWidth: 'abc' }).treeWidth, DEFAULT_LAYOUT.treeWidth);
  assert.equal('$set' in cleanChatLayout({ $set: 1 }), false, 'nothing unknown reaches the profile (negative)');
});

test('left to right: tree | card | chat; right to left: the mirror image', () => {
  assert.deepEqual(paneOrder(false), ['tree', 'card', 'chat']);
  assert.deepEqual(paneOrder(true), ['chat', 'card', 'tree']);
});

test('dragging a border widens the pane it belongs to, in either direction', () => {
  const base = { treeWidth: 300, chatWidth: 400 };
  // LTR: the tree is on the left, its border on its right.
  assert.equal(resizePane(base, 'tree', 50, false).treeWidth, 350);
  assert.equal(resizePane(base, 'chat', 50, false).chatWidth, 350);
  // RTL: the tree is on the right, so moving its border right narrows it.
  assert.equal(resizePane(base, 'tree', 50, true).treeWidth, 250);
  assert.equal(resizePane(base, 'chat', 50, true).chatWidth, 450);
  assert.equal(resizePane(base, 'tree', -10000, false).treeWidth, MIN_WIDTH);
  assert.equal(resizePane(base, 'card', 50, false).treeWidth, 300, 'the card pane has no width of its own');
});

test('channels: swimlanes > lists (shared or own) > cards, sorted, nothing archived', () => {
  const tree = buildBoardTree({
    swimlanes: [{ _id: 's2', title: 'B', sort: 2 }, { _id: 's1', title: 'A', sort: 1 }, { _id: 'sx', archived: true }],
    lists: [{ _id: 'l2', title: 'Doing', sort: 2 }, { _id: 'l1', title: 'Todo', sort: 1 },
      { _id: 'lo', title: 'Only B', sort: 3, swimlaneId: 's2' }],
    cards: [{ _id: 'c2', title: 'two', listId: 'l1', swimlaneId: 's1', sort: 2 },
      { _id: 'c1', title: 'one', listId: 'l1', swimlaneId: 's1', sort: 1 },
      { _id: 'c3', title: 'B card', listId: 'l1', swimlaneId: 's2', sort: 0 },
      { _id: 'cx', title: 'gone', listId: 'l1', swimlaneId: 's1', archived: true }],
  });
  assert.deepEqual(tree.map(s => s._id), ['s1', 's2']);
  assert.deepEqual(tree[0].lists.map(l => l._id), ['l1', 'l2']);
  assert.deepEqual(tree[1].lists.map(l => l._id), ['l1', 'l2', 'lo'], 'a list of its own appears only in its swimlane');
  assert.deepEqual(tree[0].lists[0].cards.map(c => c._id), ['c1', 'c2']);
  assert.deepEqual(tree[1].lists[0].cards.map(c => c._id), ['c3']);
});

test('workspaces hold their boards; the rest are listed after', () => {
  const ws = buildWorkspaceTree(
    [{ id: 'w1', name: 'Work', children: [{ id: 'w2', name: 'Sub', children: [] }] }],
    { b1: 'w1', b2: 'w2', b9: 'missing' },
    [{ _id: 'b1' }, { _id: 'b2' }, { _id: 'b3' }, { _id: 'b9' }],
  );
  assert.deepEqual(ws.workspaces[0].boards.map(b => b._id), ['b1']);
  assert.deepEqual(ws.workspaces[0].children[0].boards.map(b => b._id), ['b2']);
  assert.deepEqual(ws.unassigned.map(b => b._id), ['b3', 'b9'], 'a board in a deleted workspace is not lost');
  assert.deepEqual(buildWorkspaceTree(null, null, null), { workspaces: [], unassigned: [] });
});

test('a drop goes between the right neighbours, and only where it means something', () => {
  const siblings = [{ _id: 'a', sort: 1 }, { _id: 'b', sort: 2 }, { _id: 'c', sort: 3 }];
  assert.deepEqual(dropNeighbours(siblings, 'c', 'a', 'before'), { prev: null, next: siblings[0] });
  assert.deepEqual(dropNeighbours(siblings, 'a', 'b', 'after'), { prev: siblings[1], next: siblings[2] });
  assert.deepEqual(dropNeighbours(siblings, 'a', null, 'after'), { prev: siblings[2], next: null }, 'onto a list: its end');
  assert.equal(dropAllowed('card', 'list'), true);
  assert.equal(dropAllowed('card', 'card'), true);
  for (const [a, b] of [['card', 'swimlane'], ['swimlane', 'list'], ['list', 'card'], ['board', 'card'], ['workspace', 'board']]) {
    assert.equal(dropAllowed(a, b), false, `${a} onto ${b} is refused (negative)`);
  }
});

test('wired like every other board view, the layout saved on the profile', () => {
  const bvs = require('../models/lib/boardViewSettings');
  assert.ok(bvs.BOARD_VIEWS.some(v => v.view === 'board-view-chat' && v.icon === 'fa-comments'));
  assert.match(read('client/components/boards/boardBody.jade'), /else if isViewChat\n\s*\+chatView/);
  const features = read('client/features/boards.js');
  for (const f of ['chatView.jade', 'chatView.js', 'chatView.css']) assert.ok(features.includes(`/client/components/boards/${f}`), f);
  assert.match(read('server/models/users.js'), /async setChatViewLayout\(layout\) \{[\s\S]*?cleanChatLayout\(layout\)/);
  assert.match(read('models/users.js'), /'profile\.chatViewLayout'/);
  const js = read('client/components/boards/chatView.js');
  // Reordering uses the board's own paths, so the same permissions apply.
  assert.match(js, /Meteor\.callAsync\('updateListSort'/);
  assert.match(js, /card\.move\(boardId, swimlaneId, listId/);
  // Where a card lands is read from the tree it was dropped on, not a cached
  // copy of the target card (which can hold the list it was in before a move).
  assert.match(js, /target\.closest\('\[data-kind="list"\]'\)\.dataset\.id/);
  assert.match(js, /Meteor\.call\('setWorkspacesTree', next\)/);
  // A comment is the same document the card's own comment form writes.
  assert.match(js, /CardComments\.insert\(\{ text, boardId: card\.boardId, cardId: card\._id/);
  // The container is LTR and the order comes from paneOrder, so RTL is
  // mirrored once, not twice (negative: no dir attribute on the flex row).
  assert.match(read('client/components/boards/chatView.css'), /\.chat-view \{\n  direction: ltr;/);
  assert.doesNotMatch(read('client/components/boards/chatView.jade'), /\.chat-view\(dir=/);
});

// The channel tree (2026-10-14): only cards with a conversation, under
// workspaces > boards > swimlanes > lists; every other board under Other
// boards; unread messages at every level; a board opened with all its cards.
const summary = {
  boards: [{ _id: 'b1', title: 'Roadmap', slug: 'roadmap' }, { _id: 'b2', title: 'Quiet', slug: 'quiet' },
    { _id: 'b3', title: 'Loose', slug: 'loose' }],
  channels: [
    { cardId: 'c1', boardId: 'b1', swimlaneId: 's1', listId: 'l1', title: 'Demo', sort: 2, comments: 3, unread: 2 },
    { cardId: 'c2', boardId: 'b1', swimlaneId: 's1', listId: 'l1', title: 'Other', sort: 1, comments: 1, unread: 1 },
    { cardId: 'c3', boardId: 'b3', swimlaneId: 's3', listId: 'l3', title: 'X', sort: 0, comments: 1, unread: 0 },
  ],
  swimlanes: [{ _id: 's1', boardId: 'b1', title: 'Default', sort: 0 }, { _id: 's3', boardId: 'b3', title: 'D', sort: 0 }],
  lists: [{ _id: 'l1', boardId: 'b1', title: 'Todo', sort: 0 }, { _id: 'l3', boardId: 'b3', title: 'T', sort: 0 }],
};
const workspaces = [{ id: 'w1', name: 'Work', children: [{ id: 'w2', name: 'Empty' }] }];
test('the channel tree holds only cards with a conversation, and adds up what is unread', () => {
  const tree = buildChannelTree(summary, workspaces, { b1: 'w1', b2: 'w1' });
  assert.equal(tree.workspaces.length, 1);
  const [work] = tree.workspaces;
  // A workspace with nothing said in it is still there, to drag a board into.
  assert.deepEqual([work.name, work.unread, work.children.map(c => [c.name, c.boards.length])], ['Work', 3, [['Empty', 0]]]);
  const [board] = work.boards;
  assert.deepEqual([board.title, board.unread, board.hasMessages, board.full], ['Roadmap', 3, true, false]);
  assert.deepEqual(board.swimlanes[0].lists[0].cards.map(c => [c.title, c.unread, c.boardId]),
    [['Other', 1, 'b1'], ['Demo', 2, 'b1']], 'in board order, each knowing its board');
  assert.deepEqual(tree.unassigned.map(b => b.title), ['Loose'], 'a board with a conversation in no workspace');
  assert.deepEqual(tree.other.map(b => [b.title, b.hasMessages]), [['Quiet', false]], 'Other boards: no conversation');
});
test('a board\'s first message moves it from Other boards to its place', () => {
  const later = { ...summary, channels: [...summary.channels,
    { cardId: 'c9', boardId: 'b2', swimlaneId: 's9', listId: 'l9', title: 'First', comments: 1, unread: 1 }],
  swimlanes: [...summary.swimlanes, { _id: 's9', boardId: 'b2', title: 'S' }], lists: [...summary.lists, { _id: 'l9', boardId: 'b2', title: 'L' }] };
  const tree = buildChannelTree(later, workspaces, { b1: 'w1', b2: 'w1' });
  assert.deepEqual(tree.workspaces[0].boards.map(b => b.title), ['Quiet', 'Roadmap']);
  assert.deepEqual(tree.other, []);
  assert.equal(tree.workspaces[0].unread, 4);
});
test('a board opened with all its cards shows every card, the talked-about ones with their counts', () => {
  const full = { b2: { swimlanes: [{ _id: 's2', title: 'Default', sort: 0 }],
    lists: [{ _id: 'l2', title: 'Todo', sort: 0, swimlaneId: '' }, { _id: 'l3x', title: 'Done', sort: 1, swimlaneId: '' }],
    cards: [{ cardId: 'k1', boardId: 'b2', swimlaneId: 's2', listId: 'l2', title: 'Fresh', sort: 0 }] } };
  const quiet = buildChannelTree(summary, workspaces, {}, full).other.find(b => b._id === 'b2');
  assert.equal(quiet.full, true);
  assert.deepEqual(quiet.swimlanes[0].lists.map(l => [l.title, l.cards.length]), [['Todo', 1], ['Done', 0]],
    'every list, also an empty one, to start a conversation in');
  assert.deepEqual(quiet.swimlanes[0].lists[0].cards[0], { _id: 'k1', boardId: 'b2', title: 'Fresh', comments: 0, unread: 0 });
  // Negative: nothing at all is not a crash.
  assert.deepEqual(buildChannelTree(null, null, null), { workspaces: [], unassigned: [], other: [] });
});
test('the tree: carets before the icons, rows that fold rather than navigate, names as Markdown', () => {
  const jade = read('client/components/boards/chatView.jade');
  for (const kind of ['workspace', 'board', 'swimlane', 'list']) {
    assert.match(jade, new RegExp(`\\.chat-view-row\\.js-chat-toggle\\(data-key="${kind}:\\{\\{(id|_id)\\}\\}"[^\\n]*\\n\\s*i\\.chat-view-caret\\.fa\\.fa-caret-right`), `${kind}: the caret comes first`);
  }
  assert.equal((jade.match(/\.chat-view-collapse\n/g) || []).length, 4, 'every level folds');
  assert.equal((jade.match(/\+chatViewUnread\(count=unread\)/g) || []).length, 5, 'unread on every level');
  // Every name is rendered; nothing is interpolated raw.
  assert.ok((jade.match(/\+inlineViewer/g) || []).length >= 6);
  assert.doesNotMatch(jade, /chat-view-row-title \{\{|\| # \{\{selectedCard\.title\}\}/);
  const js = read('client/components/boards/chatView.js');
  // Negative: a board row does not leave the Chat view.
  assert.doesNotMatch(js, /js-chat-open-board/);
  assert.match(js, /'click \.js-chat-toggle'\(event\) \{[\s\S]{0,600}setOpen\(key, open\);/);
  const css = read('client/components/boards/chatView.css');
  assert.match(css, /\.chat-view-node\.is-open > \.chat-view-collapse \{\n  grid-template-rows: 1fr;/);
  assert.match(css, /\.chat-view-tree\[dir="rtl"\] \.chat-view-caret \{\n  transform: scaleX\(-1\);/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
test('the server sends only what the member may read', () => {
  const server = read('server/chatView.js');
  assert.match(server, /if \(!this\.userId\) throw new Meteor\.Error\('not-authorized'\);/);
  assert.match(server, /visibleAllBoards\(user,/);
  // Negative: no conversation for a role that reads no comments, and only
  // assigned cards on an assigned-only board.
  assert.match(server, /return !\(member && member\.isNoComments\);/);
  assert.match(server, /\.filter\(card => !limitedBoards\.includes\(card\.boardId\) \|\| mine\.has\(card\._id\)\)/);
  assert.match(server, /if \(!board\) throw new Meteor\.Error\('not-authorized'\);/);
  assert.match(server, /userId: \{ \$ne: this\.userId \}/, 'my own messages are not unread');
  assert.match(read('server/imports.js'), /^import '\/server\/chatView';$/m);
});
