'use strict';

// Guard: Board View / Version Control - the board as a GitHub / Gitea issue
// tracker (docs/Features/Board/Version-Control-View.md).
// Run: node tests/versionControlView.test.cjs
//
// It keeps no data of its own: a card is an issue, a label is a label, a label
// with a due date is a milestone, the comments are the conversation and the
// change history is the history - with its undo. These pin the rules that turn
// a board into that, and that the writes go where the history records them.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vcs = require('../models/lib/versionControlView.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const issues = [
  { _id: 'a', number: 1, title: 'Crash on start', body: 'stack trace', state: 'open', labelIds: ['bug'],
    labelNames: ['bug'], milestoneIds: ['m1'], milestoneTitles: ['v1.0'], author: 'alice', assignees: ['bob'],
    comments: 3, createdAt: '2026-01-01' },
  { _id: 'b', number: 2, title: 'Dark theme', body: '', state: 'closed', labelIds: ['ui', 'm1'],
    labelNames: ['ui', 'needs review'], milestoneIds: ['m1'], milestoneTitles: ['v1.0'], author: 'bob', assignees: [],
    comments: 0, createdAt: '2026-02-01' },
  { _id: 'c', number: 3, title: 'Docs for import', body: 'GitHub import', state: 'open', labelIds: [],
    labelNames: [], milestoneIds: [], milestoneTitles: [], author: 'alice', assignees: [], comments: 9,
    createdAt: '2026-03-01' },
];
const ids = rows => rows.map(r => r._id);

test('state: archived or in a Closed / Done list is closed, anything else open', () => {
  assert.strictEqual(vcs.issueState({}, 'Open'), 'open');
  assert.strictEqual(vcs.issueState({}, 'Closed'), 'closed');
  assert.strictEqual(vcs.issueState({}, ' done '), 'closed');
  assert.strictEqual(vcs.issueState({ archived: true }, 'Open'), 'closed');
  assert.strictEqual(vcs.issueState({}, 'In progress'), 'open');
  // negative: a list merely containing the word is not a closed column
  assert.strictEqual(vcs.issueState({}, 'Closed beta feedback'), 'open');
});

test('number: the upstream one from the importer footer, else the card number', () => {
  assert.strictEqual(vcs.issueNumber({ description: 'text\n\nSource: #42 https://github.com/o/r/issues/42', cardNumber: 7 }), 42);
  assert.strictEqual(vcs.issueNumber({ description: 'x\n\nSource: group/proj#9 https://gitlab.com/group/proj/-/issues/9' }), 9);
  assert.strictEqual(vcs.issueNumber({ description: 'no footer', cardNumber: 7 }), 7);
  assert.strictEqual(vcs.issueNumber({ description: 'mentions Source: #5 inline', cardNumber: 0 }), null);
  assert.strictEqual(vcs.issueBody('Body\n\nSource: #42 https://github.com/o/r/issues/42'), 'Body');
  assert.strictEqual(vcs.issueBody('Body only'), 'Body only');
});

test('milestones: labels with a due date (#2802) and the importers\' milestone: labels', () => {
  const labels = [
    { _id: 'l1', name: 'bug', color: 'red' },
    { _id: 'l2', name: 'Sprint 1', color: 'blue', dueAt: '2026-05-01' },
    { _id: 'l3', name: 'milestone:v2.0', color: 'green' },
  ];
  const ms = vcs.boardMilestones(labels);
  assert.deepStrictEqual(ms.map(m => [m._id, m.title]), [['l2', 'Sprint 1'], ['l3', 'v2.0']]);
  assert.deepStrictEqual(vcs.boardPlainLabels(labels).map(l => l._id), ['l1']);
  assert.deepStrictEqual(vcs.boardMilestones(null), []);
});

test('search: GitHub qualifiers filter, words search number, title and body', () => {
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, 'is:open')), ['c', 'a']);
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, 'is:closed')), ['b']);
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, 'label:"needs review"')), ['b']);
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, '-label:bug')), ['c', 'b']);
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, 'milestone:v1.0 sort:created-asc')), ['a', 'b']);
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, 'author:@alice no:label')), ['c']);
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, 'assignee:BOB')), ['a']);
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, 'import')), ['c']);
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, '#2')), ['b']);
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, 'sort:comments-desc')), ['c', 'a', 'b']);
  // negative: an unknown qualifier is text, not silently ignored
  assert.deepStrictEqual(ids(vcs.filterIssues(issues, 'type:bug')), []);
});

test('counts ignore the state, as GitHub\'s Open / Closed tabs do', () => {
  assert.deepStrictEqual(vcs.stateCounts(issues, 'is:open milestone:v1.0'), { open: 1, closed: 1 });
});

test('withQualifier replaces milestone and sort, adds labels once', () => {
  assert.strictEqual(vcs.withQualifier('is:open milestone:a', 'milestone', 'v 2'), 'is:open milestone:"v 2"');
  assert.strictEqual(vcs.withQualifier('is:open label:bug', 'label', 'ui'), 'is:open label:bug label:ui');
  assert.strictEqual(vcs.withQualifier('is:open label:bug', 'label', 'bug'), 'is:open label:bug');
});

test('milestone progress and label usage', () => {
  const [m] = vcs.milestoneProgress([{ _id: 'm1', title: 'v1.0', dueAt: new Date('2026-01-15') }], issues, new Date('2026-06-01'));
  assert.deepStrictEqual([m.open, m.closed, m.percent, m.overdue], [1, 1, 50, true]);
  const usage = vcs.labelUsage([{ _id: 'bug', name: 'bug' }, { _id: 'ui', name: 'ui' }], issues);
  assert.deepStrictEqual(usage.map(l => [l._id, l.open]), [['bug', 1], ['ui', 0]]);
});

test('new issue input is trimmed and bounded; negative: empty or huge is refused', () => {
  assert.deepStrictEqual(vcs.cleanNewIssue({ title: '  Bug\n here ', body: ' b ', labelIds: ['x', 5] }),
    { title: 'Bug here', body: 'b', labelIds: ['x'] });
  assert.throws(() => vcs.cleanNewIssue({ title: '  ' }), /vcs-issue-title-required/);
  assert.throws(() => vcs.cleanNewIssue({ title: 'x'.repeat(1001) }), /too-long/);
  assert.throws(() => vcs.cleanNewIssue({ title: 'x', body: 'y'.repeat(65537) }), /too-long/);
});

test('close / reopen targets the Closed / Open list, or names the one to create', () => {
  const lists = [{ _id: 'todo', title: 'To Do' }, { _id: 'done', title: 'Done' }, { _id: 'old', title: 'Closed', archived: true }];
  assert.deepStrictEqual(vcs.stateTarget(lists, 'closed'), { listId: 'done' });
  assert.deepStrictEqual(vcs.stateTarget(lists, 'open'), { listId: 'todo' });
  assert.deepStrictEqual(vcs.stateTarget([{ _id: 'todo', title: 'To Do' }], 'closed'), { create: 'Closed' });
  assert.deepStrictEqual(vcs.stateTarget([{ _id: 'c', title: 'Closed' }], 'open'), { create: 'Open' });
});

const server = read('server/versionControlView.js');
test('writes check write access and go through the hooked collections (history + undo)', () => {
  assert.match(server, /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
  assert.match(server, /Cards\.insertAsync\(/);
  assert.match(server, /Cards\.updateAsync\(card\._id, \{ \$set: \{ listId/);
  // negative: .direct bypasses the change history, so Undo could not see it
  assert.doesNotMatch(server, /\.direct\./);
  assert.match(server, /check\(state, Match\.OneOf\('open', 'closed'\)\)/);
});

const jade = read('client/components/boards/versionControlView.jade');
const js = read('client/components/boards/versionControlView.js');
test('History tab is the board history table, with its Restore (undo)', () => {
  assert.match(jade, /\+historyTable\(scope="board" scopeId=boardId\)/);
});

test('read-only for visitors: every write control is behind canWrite / canComment', () => {
  for (const cls of ['js-vcs-new', 'js-vcs-set-state']) {
    const at = jade.indexOf(cls);
    const before = jade.slice(Math.max(0, jade.lastIndexOf('\n', at) - 400), at);
    assert.match(before, /if canWrite/, `${cls} without canWrite`);
  }
  assert.match(jade, /if canComment\n\s+form\.vcs-comment-form/);
  assert.match(js, /canWrite\(\) \{ return Utils\.canModifyBoard\(\); \}/);
  assert.match(js, /canComment\(\) \{ return Utils\.currentUserCan\('comment'\); \}/);
});

test('theme colours: the accent is the theme\'s, no fixed page background', () => {
  const css = read('client/components/boards/versionControlView.css');
  assert.match(css, /var\(--theme-accent, #01628c\)/);
  assert.doesNotMatch(css, /\.vcs-view\s*\{[^}]*background/);
});

test('import links are the existing GitHub / GitLab / Gitea / Forgejo importers', () => {
  assert.match(js, /const SOURCES = \['github', 'gitlab', 'gitea', 'forgejo'\];/);
  assert.match(jade, /pathFor 'import' source=key/);
});

test('Attachments tab: the controls of an opened card\'s attachments', () => {
  const files = jade.slice(jade.indexOf("if isTab 'files'"), jade.indexOf("if isTab 'history'"));
  // A click views it in the card's viewer, walking the tab's files.
  assert.match(files, /button\.vcs-file-view\.js-vcs-file-view/);
  assert.match(js, /openAttachmentSlideshow\(event\.currentTarget\.dataset\.attachmentId, ids\)/);
  assert.match(js, /canPreview: !!\(kind\.isImage \|\| kind\.isPDF/);
  // Download, rename, delete and the cover / background menu, through the card's popups.
  for (const cls of ['js-download', 'js-vcs-file-rename', 'js-vcs-file-delete', 'js-vcs-file-menu']) assert.ok(files.includes(cls), cls);
  assert.match(js, /Popup\.open\('attachmentRename'\)\.call\(file, event, tpl\)/);
  assert.match(js, /Popup\.open\('attachmentActions'\)\.call\(file, event, tpl\)/);
  assert.match(js, /Popup\.afterConfirm\('attachmentDelete'[\s\S]{0,160}attachments\.softDelete/);
  // Negative: the writes only for the members the card's gallery lets write,
  // and no hard delete.
  const rename = files.indexOf('js-vcs-file-rename');
  assert.match(files.slice(files.lastIndexOf('if currentUser.isBoardMember', rename), rename),
    /unless currentUser\.isCommentOnly\n\s+unless currentUser\.isWorker/);
  assert.ok(files.indexOf('js-vcs-file-view') < files.indexOf('if currentUser.isBoardMember'), 'viewing is for every reader');
  assert.doesNotMatch(js, /Attachments\.remove|attachments\.remove/i);
});

console.log(`# ${passed} passed`);
