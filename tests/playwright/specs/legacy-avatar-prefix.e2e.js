const { test, expect } = require('../fixtures');
const { ObjectId, Binary } = require('bson');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('versioned avatar prefix renders an authenticated CollectionFS image', async ({ page, user }) => {
  const id = db.uid('legacyAvatar');
  const gridId = new ObjectId();
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64');
  db.insertOne('cfs.avatars.filerecord', {
    _id: id, userId: user.id,
    original: { name: 'avatar.png', type: 'image/png', size: image.length },
    copies: { avatars: { key: gridId.toHexString() } },
  });
  db.insertOne('cfs_gridfs.avatars.files', {
    _id: gridId, filename: 'avatar.png', contentType: 'image/png',
    length: image.length, chunkSize: 261120, uploadDate: new Date(),
  });
  db.insertOne('cfs_gridfs.avatars.chunks', {
    _id: new ObjectId(), files_id: gridId, n: 0, data: new Binary(image),
  });
  try {
    await loginWithToken(page, user.id, user.token);
    const url = `/cdn/storage/avatars/${id}/original/avatar.png?authToken=${encodeURIComponent(user.token)}`;
    const response = await page.request.get(url);
    expect(response.status()).toBe(200);
    expect(await response.body()).toEqual(image);
    await page.evaluate(src => {
      const image = document.createElement('img');
      image.id = 'legacy-avatar-regression';
      image.src = src;
      document.body.appendChild(image);
    }, url);
    await expect.poll(() => page.locator('#legacy-avatar-regression').evaluate(image => image.naturalWidth)).toBe(1);
    // An anonymous public-board claim must not authorize a legacy avatar.
    const denied = await page.request.get(`/cdn/storage/avatars/${id}/original/avatar.png?boardId=public`, {
      headers: { Cookie: '', Authorization: '', 'X-Auth-Token': '' },
    });
    expect(denied.status()).toBe(404);
  } finally {
    db.deleteOne('cfs.avatars.filerecord', { _id: id });
    db.deleteOne('cfs_gridfs.avatars.files', { _id: gridId });
    db.deleteMany('cfs_gridfs.avatars.chunks', { files_id: gridId });
  }
});
