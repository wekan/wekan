'use strict';
// #3275: /cdn/storage/attachments/<id>/thumbnail serves a small WebP of an
// image attachment, under exactly the original's access rules.
const path = require('path');
const fs = require('fs');
const { solidPng, imageDimensions } = require('../helpers/images');
const { request: playwrightRequest } = require('@playwright/test');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

// The server reads attachments only inside its own storage root. Same
// convention as 07-attachments-links: build.sh passes the running server's
// files directory; a direct run falls back to the release bundle's.
const dir = path.join(process.env.WEKAN_FILES_PATH || path.join(
  __dirname, '..', '..', '..', '.build', 'bundle', 'files'), 'attachments');

function seed(board, id, name, type, bytes) {
  fs.mkdirSync(dir, { recursive: true });
  const stored = path.join(dir, id);
  fs.writeFileSync(stored, bytes);
  const extension = name.split('.').pop();
  db.insertOne('attachments', {
    _id: id, name, size: bytes.length, type, extension, isImage: type.startsWith('image/'),
    meta: { boardId: board.boardId, cardId: db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' }) },
    versions: { original: { path: stored, name, size: bytes.length, type, extension, storage: 'fs' } },
  });
  return () => { fs.rmSync(stored, { force: true }); db.deleteOne('attachments', { _id: id }); };
}

test('an image attachment has a small thumbnail with the same access rules', async ({ boardPage: page, board, baseURL }) => {
  const suffix = Date.now();
  const png = await solidPng(page, 2000, 1500, '#3366aa');
  const cleanups = [
    seed(board, `thumbpng${suffix}`, 'photo.png', 'image/png', png),
    seed(board, `thumbsvg${suffix}`, 'drawing.svg', 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),
    seed(board, `thumbbad${suffix}`, 'broken.png', 'image/png', Buffer.from('this is not a png')),
  ];
  try {
    db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
    const base = `/cdn/storage/attachments/thumbpng${suffix}`;

    const thumb = await page.request.get(`${base}/thumbnail`);
    expect(thumb.status()).toBe(200);
    expect(thumb.headers()['content-type']).toBe('image/webp');
    expect(thumb.headers()['cache-control']).toBe('private, max-age=86400');
    expect(thumb.headers()['x-content-type-options']).toBe('nosniff');
    const body = await thumb.body();
    expect(body.toString('ascii', 0, 4)).toBe('RIFF');
    expect(body.toString('ascii', 8, 12)).toBe('WEBP');
    expect(await imageDimensions(page, body, 'image/webp')).toEqual([512, 384]);
    expect(body.length).toBeLessThan(png.length);
    // Revalidation, and the original is untouched.
    const again = await page.request.get(`${base}/thumbnail`, { headers: { 'If-None-Match': thumb.headers().etag } });
    expect(again.status()).toBe(304);
    const original = await page.request.get(base);
    expect(original.status()).toBe(200);
    expect(Buffer.compare(await original.body(), png)).toBe(0);

    // SVG has no thumbnail; a damaged image falls back to its original.
    expect((await page.request.get(`/cdn/storage/attachments/thumbsvg${suffix}/thumbnail`)).status()).toBe(404);
    const broken = await page.request.get(`/cdn/storage/attachments/thumbbad${suffix}/thumbnail`, { maxRedirects: 0 });
    expect(broken.status()).toBe(302);
    expect(broken.headers().location).toMatch(new RegExp(`/cdn/storage/attachments/thumbbad${suffix}$`));

    // The card gallery shows the thumbnail, not the original.
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.minicard', { hasText: 'Alpha Card' }).first().locator('.minicard-title').click();
    await expect(page.locator('img.attachment-thumbnail[title="photo.png"]')).toHaveAttribute('src', new RegExp(`${base}/thumbnail$`));

    // Negative: on a private board, nobody signed out reads it.
    db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'private' } });
    const anonymous = await playwrightRequest.newContext({ baseURL });
    try {
      expect((await anonymous.get(`${base}/thumbnail`)).status()).toBe(403);
      expect((await anonymous.get(base)).status()).toBe(403);
    } finally {
      await anonymous.dispose();
    }
  } finally {
    cleanups.forEach(cleanup => cleanup());
  }
});
