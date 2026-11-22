'use strict';
// A Gitea backup restored into WeKan (gitea-patches mirror/common/gitea_backup.py,
// "Restore a backup into WeKan"): its WeKan .zip - wekan.json and
// attachments/<id>-<name> - becomes a new board through POST
// /api/import/zip?newBoard=1, with a card for each issue and pull request in
// Open, Closed or Merged, the comment, the label, and the issue's file.
//
// The .zip is made by gitea-patches' tests/lib/sample_backup.py, so the test
// checks what that script really writes; without the gitea-patches checkout
// under .tools/w the test is skipped.
const { test, expect } = require('../fixtures');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const db = require('../helpers/db');

const repo = path.resolve(__dirname, '../../..');
const sample = path.join(repo, '.tools/w/gitea-patches/tests/lib/sample_backup.py');

test('a Gitea backup imports as a WeKan board, with its comments, labels and files', async ({ loggedInPage: page, user }) => {
  test.skip(!fs.existsSync(sample), 'the gitea-patches checkout is not under .tools/w');
  test.setTimeout(120000);
  const parent = process.env.TMPDIR || path.join(repo, '.tools/tmp');
  fs.mkdirSync(parent, { recursive: true });
  const work = fs.mkdtempSync(path.join(parent, 'gitea-backup-wekan-'));
  let boardId;
  try {
    const zip = execFileSync('python3', ['-I', sample, work], { encoding: 'utf8' }).trim();
    const bytes = fs.readFileSync(zip);
    const answer = await page.evaluate(async ({ base64, token }) => {
      const body = Uint8Array.from(atob(base64), value => value.charCodeAt(0));
      const response = await fetch(`/api/import/zip?newBoard=1&membersMode=me&authToken=${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/zip' }, body,
      });
      return { status: response.status, body: await response.json() };
    }, { base64: bytes.toString('base64'), token: user.token });
    expect(answer.status).toBe(200);
    boardId = answer.body.boardId;
    expect(boardId).toBeTruthy();

    const board = db.findOne('boards', { _id: boardId });
    expect(board.title).toBe('sample/proj');
    const lists = Object.fromEntries(db.find('lists', { boardId }).map(l => [l._id, l.title]));
    const cards = db.find('cards', { boardId });
    expect(Object.fromEntries(cards.map(c => [c.title, lists[c.listId]]))).toEqual({
      '#1 Sample open issue': 'Open', '#2 Sample merged PR': 'Merged', '#3 Sample closed issue': 'Closed',
    });
    const open = cards.find(c => c.title === '#1 Sample open issue');
    expect(open.description).toContain('Body of the issue');
    const bug = board.labels.find(l => l.name === 'bug');
    expect(bug && bug.color).toBe('red');
    expect(open.labelIds).toContain(bug._id);
    const comments = db.find('card_comments', { cardId: open._id });
    expect(comments.map(c => c.text).join('\n')).toContain('Sample comment text');
    expect(comments[0].text).toContain('@bob');
    await expect.poll(() => db.find('attachments', { 'meta.cardId': open._id }).map(a => a.name)).toEqual(['notes.txt']);

    // Negative: the same file without its wekan.json is not a WeKan import.
    const JSZip = require('jszip');
    const broken = new JSZip();
    broken.file('attachments/x-notes.txt', 'x');
    const refused = await page.evaluate(async ({ base64, token }) => {
      const body = Uint8Array.from(atob(base64), value => value.charCodeAt(0));
      const response = await fetch(`/api/import/zip?newBoard=1&authToken=${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/zip' }, body,
      });
      return response.status;
    }, { base64: (await broken.generateAsync({ type: 'nodebuffer' })).toString('base64'), token: user.token });
    expect(refused).toBe(400);
  } finally {
    if (boardId) db.cleanup({ boardIds: [boardId] });
    fs.rmSync(work, { recursive: true, force: true });
  }
});
