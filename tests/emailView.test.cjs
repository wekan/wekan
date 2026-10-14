'use strict';

// Board View / Email (#794): folders, search, what may be sent, threading,
// and that the view is wired like every other board view.
// Run: node tests/emailView.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  parseFolder, emailFolderSelector, emailSearchSelector, cleanOutgoingEmail, snippet, previewMarkdown, MAX_RECIPIENTS,
} = require('../models/lib/emailView');
const { fromProviderFields, messageIds } = require('../server/lib/inboundEmailPayload');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('folders: Inbox is the email list without what was sent, then Sent, All mail, lists and labels', () => {
  const base = { boardId: 'B', archived: false, type: { $nin: ['template-container'] } };
  assert.deepEqual(emailFolderSelector('B', 'inbox', { inboxListId: 'L' }), { ...base, listId: 'L', 'email.direction': { $ne: 'out' } });
  assert.deepEqual(emailFolderSelector('B', 'sent'), { ...base, 'email.direction': 'out' });
  assert.deepEqual(emailFolderSelector('B', 'all'), { ...base, email: { $exists: true } });
  assert.deepEqual(emailFolderSelector('B', 'list:L2'), { ...base, listId: 'L2' });
  assert.deepEqual(emailFolderSelector('B', 'label:x1'), { ...base, labelIds: 'x1' });
  // A board without a list has an empty Inbox, not every card.
  assert.equal(emailFolderSelector('B', 'inbox').listId, '__none__');
});

test('a folder that is not one of those is the Inbox, never a selector of its own (negative)', () => {
  for (const folder of ['list:', 'list:{"$ne":1}', 'label:a b', 'card:x', '', null, { $ne: 1 }, 'list:x:y']) {
    const parsed = parseFolder(folder);
    assert.ok(parsed.kind === 'inbox' || /^[A-Za-z0-9_-]+$/.test(parsed.id), String(folder));
  }
  assert.equal(parseFolder('list:{"$ne":1}').kind, 'inbox');
  assert.equal(parseFolder({ $ne: 1 }).kind, 'inbox');
});

test('search is plain text: regex characters are escaped, empty searches everything', () => {
  assert.deepEqual(emailSearchSelector('  '), {});
  const s = emailSearchSelector('a.b*(c');
  assert.equal(s.$or[0].title.$regex, 'a\\.b\\*\\(c');
  assert.equal(s.$or.length, 4);
  assert.equal(emailSearchSelector('x'.repeat(500)).$or[0].title.$regex.length, 200);
});

test('what may be sent: addresses checked, duplicates dropped, subject on one line', () => {
  assert.deepEqual(cleanOutgoingEmail({ to: ['Ann@X.org, b@y.org'], cc: ['b@y.org', 'c@z.org'], subject: ' Hi\r\nBcc: evil@x.org ', text: 'T' }),
    { to: ['ann@x.org', 'b@y.org'], cc: ['c@z.org'], subject: 'Hi Bcc: evil@x.org', text: 'T' });
});

test('a header cannot be injected and the limits hold (negative)', () => {
  for (const [input, code] of [
    [{ to: [], subject: 's' }, 'email-view-no-recipient'],
    [{ to: ['a@x.org'], subject: '  ' }, 'email-view-no-subject'],
    [{ to: ['a@x.org\r\nBcc: e@x.org'], subject: 's' }, 'email-view-invalid-address'],
    [{ to: ['"Ann" <a@x.org>'], subject: 's' }, 'email-view-invalid-address'],
    [{ to: ['a@localhost'], subject: 's' }, 'email-view-invalid-address'],
    [{ to: Array.from({ length: MAX_RECIPIENTS + 1 }, (_, i) => `u${i}@x.org`), subject: 's' }, 'email-view-too-many-recipients'],
  ]) {
    assert.throws(() => cleanOutgoingEmail(input), new RegExp(code));
  }
});

test('a row preview leaves out the sender line and is one line', () => {
  assert.equal(snippet('From: Ann <a@x>\n\nHello\nthere'), 'Hello there');
  assert.equal(snippet('x'.repeat(200), 10), `${'x'.repeat(9)}…`);
  assert.equal(snippet(undefined), '');
});

test('a row renders its subject and preview as Markdown, cut at a line end', () => {
  assert.equal(previewMarkdown('From: Ann <a@x>\n\n# Hello\nSee [docs](https://x.example) **now**'),
    '# Hello\nSee [docs](https://x.example) **now**', 'the Markdown kept, the sender line left out');
  assert.equal(previewMarkdown(['a', 'b', 'c'].join('\n'), 2), 'a\nb');
  // Negative: never cut inside a line (a link or a tag), and nothing for nothing.
  const long = `${'x'.repeat(30)}\n[link](https://example.org/${'y'.repeat(50)})`;
  assert.equal(previewMarkdown(long, 8, 60), 'x'.repeat(30));
  assert.equal(previewMarkdown(undefined), '');
  const jade = fs.readFileSync(path.join(__dirname, '../client/components/boards/emailView.jade'), 'utf8');
  assert.match(jade, /\.email-view-subject-title\s*\n\s*\+viewer\s*\n\s*= title/);
  assert.match(jade, /\.email-view-snippet\s*\n\s*\+viewer\s*\n\s*= snippet/);
  // Negative: no row text interpolated raw.
  assert.doesNotMatch(jade, /email-view-subject-title \{\{title\}\}|email-view-snippet[^\n]*\{\{snippet\}\}/);
  assert.match(fs.readFileSync(path.join(__dirname, '../client/components/boards/emailView.js'), 'utf8'), /snippet: previewMarkdown\(card\.description\)/);
});

test('threading: In-Reply-To and References are read from every provider shape', () => {
  assert.deepEqual(messageIds('<a@x> <b@y>\r\n <c@z>'), ['<a@x>', '<b@y>', '<c@z>']);
  assert.deepEqual(messageIds('no ids'), []);
  const mailgun = fromProviderFields({ 'In-Reply-To': '<a@x>', References: '<r@x> <a@x>' });
  assert.deepEqual([mailgun.inReplyTo, mailgun.references], [['<a@x>'], ['<r@x>', '<a@x>']]);
  const postmark = fromProviderFields({ Headers: [{ Name: 'In-Reply-To', Value: '<p@x>' }] });
  assert.deepEqual(postmark.inReplyTo, ['<p@x>']);
});

test('wired like every other board view', () => {
  const bvs = require('../models/lib/boardViewSettings');
  assert.ok(bvs.BOARD_VIEWS.some(v => v.view === 'board-view-email' && v.icon === 'fa-envelope'));
  assert.match(read('client/components/boards/boardBody.jade'), /else if isViewEmail\n\s*\+emailView/);
  assert.match(read('client/components/boards/boardHeader.js'), /'click \.js-open-email-view'/);
  const features = read('client/features/boards.js');
  for (const f of ['emailView.jade', 'emailView.js', 'emailView.css']) assert.ok(features.includes(`/client/components/boards/${f}`), f);
  assert.match(read('server/imports.js'), /import '\/server\/emailView';/);
  // The shared table page, as Table.md requires - not a table of its own.
  const jade = read('client/components/boards/emailView.jade');
  assert.match(jade, /\+tablePage\(tablePageData\)/);
  assert.doesNotMatch(jade, /^\s*table\b/m);
});

test('server: the page is server-side and access-checked, From is the member\'s own board address (negative)', () => {
  const server = read('server/emailView.js');
  assert.match(server, /board\.isVisibleBy\(user\)/, 'only a board the user may see');
  assert.match(server, /skip: \(page - 1\) \* TABLE_PAGE_ROWS_PER_PAGE/);
  assert.match(server, /publishReportPage\(this, EMAIL_VIEW_PAGE_ID, docs\)/);
  assert.match(server, /allowIsBoardMemberWithWriteAccess\(userId, board\)/, 'sending needs write access');
  assert.match(server, /const from = boardAddress\(row\.token, inboundMail\.domain\)/);
  assert.doesNotMatch(server, /from:\s*input\./, 'From never comes from the form');
  assert.match(server, /cleanOutgoingEmail\(input\)/);
  // The receiver threads replies onto the card whose conversation they answer.
  assert.match(read('server/emailToCard.js'), /'email\.threadIds': \{ \$in: threadKeys \}/);
});
