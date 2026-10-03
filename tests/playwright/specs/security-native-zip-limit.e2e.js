'use strict';
const { test, expect } = require('../fixtures');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const db = require('../helpers/db');

test('native ZIP import refuses inflated documents and remains usable from the browser', async ({ loggedInPage: page, user, board }) => {
  test.setTimeout(120000);
  const { ZipArchive } = require('../../../node_modules/archiver');
  const parent = process.env.TMPDIR || path.resolve('../../.tools/tmp');
  const work = fs.mkdtempSync(path.join(parent, 'native-zip-limit-'));
  try {
    const file = path.join(work, 'oversize.zip');
    // One MiB past the production document limit. Generate incrementally: the
    // test does not allocate a giant source buffer or attempt the reporter's GiB.
    const chunk = Buffer.alloc(1024 * 1024, 0x20);
    await new Promise((resolve, reject) => {
      const out = fs.createWriteStream(file);
      const zip = new ZipArchive({ zlib: { level: 9 } });
      out.on('close', resolve); out.on('error', reject); zip.on('error', reject);
      zip.pipe(out);
      zip.append(Readable.from((function* () { for (let i = 0; i < 257; i++) yield chunk; })()), { name: 'wekan.json' });
      zip.finalize();
    });
    const bytes = fs.readFileSync(file);
    expect(bytes.length).toBeLessThan(1024 * 1024);
    const before = db.find('cards', { boardId: board.boardId }).length;
    const upload = base64 => page.evaluate(async ({ base64, boardId, token }) => {
      const body = Uint8Array.from(atob(base64), value => value.charCodeAt(0));
      const response = await fetch(`/api/import/zip?boardId=${encodeURIComponent(boardId)}&authToken=${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/zip' }, body,
      });
      return { status: response.status, body: await response.json() };
    }, { base64, boardId: board.boardId, token: user.token });
    expect(await upload(bytes.toString('base64'))).toEqual({ status: 500, body: { error: 'import-failed' } });
    expect(db.find('cards', { boardId: board.boardId })).toHaveLength(before);
    const JSZip = require('jszip');
    const valid = new JSZip(); valid.file('wekan.json', JSON.stringify({ _format: 'wekan-board-1.0.0', lists: [], cards: [] }));
    const accepted = await upload((await valid.generateAsync({ type: 'nodebuffer' })).toString('base64'));
    expect(accepted.status).toBe(200); expect(accepted.body.ok).toBe(true);
    await expect.poll(() => page.evaluate(() => Meteor.status().connected)).toBe(true);
    expect(await page.evaluate(() => Meteor.userId())).toBe(user.id);
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
});
