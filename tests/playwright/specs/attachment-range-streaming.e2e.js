'use strict';

/**
 * #6745: a big attachment is streamed, and a Range request (a video seek, a
 * resumed download) streams only the bytes asked for. The download route used
 * to ignore Range and always send the whole file from the start.
 *
 * tests/attachmentRangeStreaming.test.cjs pins the parser and the source.
 */

const fs = require('fs');
const path = require('path');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test.describe('#6745 attachment downloads honour Range', () => {
  let attachmentId;
  let storedPath;
  let bytes;

  test.beforeEach(async ({ board }) => {
    attachmentId = `range${Date.now()}`;
    // build.sh mounts the running server's files directory at /wekan-files in
    // the browser container. A direct local run keeps the bundle fallback.
    const filesPath = process.env.WEKAN_FILES_PATH || path.join(
      __dirname, '..', '..', '..', '.build', 'bundle', 'files');
    storedPath = path.join(filesPath, 'attachments', attachmentId);
    bytes = Buffer.from(Array.from({ length: 1000 }, (_, i) => i % 256));
    fs.mkdirSync(path.dirname(storedPath), { recursive: true });
    fs.writeFileSync(storedPath, bytes);
    db.insertOne('attachments', {
      _id: attachmentId,
      name: 'clip.mp4',
      size: bytes.length,
      type: 'video/mp4',
      meta: {
        boardId: board.boardId,
        cardId: db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' }),
      },
      versions: {
        original: {
          path: storedPath, name: 'clip.mp4', size: bytes.length,
          type: 'video/mp4', extension: 'mp4', storage: 'fs',
        },
      },
    });
  });

  test.afterEach(() => {
    fs.rmSync(storedPath, { force: true });
    db.deleteOne('attachments', { _id: attachmentId });
  });

  test('a range is answered 206 with just those bytes', async ({ boardPage }) => {
    const url = `/cdn/storage/attachments/${attachmentId}`;
    const whole = await boardPage.request.get(url);
    expect(whole.status()).toBe(200);
    expect(whole.headers()['accept-ranges']).toBe('bytes');
    expect(Buffer.compare(await whole.body(), bytes)).toBe(0);

    const part = await boardPage.request.get(url, { headers: { Range: 'bytes=100-199' } });
    expect(part.status()).toBe(206);
    expect(part.headers()['content-range']).toBe('bytes 100-199/1000');
    expect(Buffer.compare(await part.body(), bytes.subarray(100, 200))).toBe(0);

    const tail = await boardPage.request.get(url, { headers: { Range: 'bytes=-10' } });
    expect(tail.status()).toBe(206);
    expect(Buffer.compare(await tail.body(), bytes.subarray(990))).toBe(0);
  });

  test('negative: an unsatisfiable range is 416, a stale If-Range gets the whole file', async ({ boardPage }) => {
    const url = `/cdn/storage/attachments/${attachmentId}`;
    const beyond = await boardPage.request.get(url, { headers: { Range: 'bytes=5000-' } });
    expect(beyond.status()).toBe(416);
    expect(beyond.headers()['content-range']).toBe('bytes */1000');

    const stale = await boardPage.request.get(url, { headers: { Range: 'bytes=0-9', 'If-Range': '"another"' } });
    expect(stale.status()).toBe(200);
    expect((await stale.body()).length).toBe(1000);
  });
});
