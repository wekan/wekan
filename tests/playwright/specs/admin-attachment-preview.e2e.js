'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const fs = require('node:fs');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');

for (const extension of ['docx', 'png', 'pdf', 'zip']) {
test(`Files Report previews a private ${extension} file for a non-member administrator only`, async ({ page, request, adminUser, user, user2, board }) => {
  const previewErrors = [];
  page.on('console', message => { if (message.type() === 'error' && message.text().includes('preview Office')) previewErrors.push(message.text()); });
  const id = db.uid('officepreview');
  let bytes = Buffer.from(zipSync(Object.fromEntries(Object.entries({
    '[Content_Types].xml': '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Private report preview</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>',
  }).map(([name, text]) => [name, strToU8(text)]))));
  const zipNames = ['folder/hello.txt', '日本語.txt', '<img onerror=alert(1)>.txt'];
  if (extension === 'zip') {
    bytes = Buffer.from(zipSync(Object.fromEntries(zipNames.map(name => [name, strToU8('hello')]))));
  } else if (extension === 'png') {
    bytes = fs.readFileSync(path.resolve(__dirname, '../../../public/favicon-32x32.png'));
  } else if (extension === 'pdf') {
    const PDFDocument = require('pdfkit');
    bytes = await new Promise((resolve, reject) => {
      const doc = new PDFDocument(), chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.text('Private report preview');
      doc.end();
    });
  }
  const directory = path.join(process.env.WEKAN_FILES_PATH, 'attachments');
  const filename = path.join(directory, `${id}.${extension}`);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(filename, bytes);
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const storage = await page.evaluate(() => Meteor.callAsync('getAttachmentStoragePaths'));
    const type = { zip: 'application/zip', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', png: 'image/png', pdf: 'application/pdf' }[extension];
    db.insertOne('attachments', { _id: id, name: `${id}.${extension}`, extension, type, size: bytes.length,
      meta: { boardId: board.boardId, cardId: db.findOne('cards', { boardId: board.boardId })._id },
      versions: { original: { storage: 'fs', path: `${storage.attachments}/${id}.${extension}`, size: bytes.length, extension, type } } });
    const url = `/cdn/storage/attachments/${id}`;
    expect((await request.get(url)).status()).toBe(403);
    expect((await request.get(`${url}?download=true`)).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${user2.token}` } })).status()).toBe(403);
    await navigateInApp(page, '/admin/problems/files');
    const response = extension === 'docx' ? page.waitForResponse(r => new URL(r.url()).pathname === url && r.request().resourceType() === 'fetch') : null;
    await page.locator(`.js-table-page-attachment-preview[data-attachment-id="${id}"]`).first().click();
    if (response) expect((await response).status()).toBe(200);
    const download = await page.request.get(url);
    expect(download.status()).toBe(200);
    expect(await download.body()).toEqual(bytes);
    if (extension === 'docx') {
      // The Office worker paints text onto canvases rather than DOM text nodes.
      await expect(page.locator('#office-viewer canvas').first()).toBeVisible({ timeout: 30000 });
      expect(previewErrors).toEqual([]);
    } else if (extension === 'png') {
      await expect(page.locator('#image-viewer')).toBeVisible();
      await expect.poll(() => page.locator('#image-viewer').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
      const thumbnail = page.locator(`.table-page-attachment-preview[data-attachment-id="${id}"] img`);
      await expect.poll(() => thumbnail.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
    } else if (extension === 'zip') {
      await expect(page.locator('#zip-viewer li')).toHaveText(zipNames);
      await expect(page.locator('#zip-viewer img')).toHaveCount(0);
    } else {
      expect(download.headers()['content-type']).toContain('application/pdf');
      await expect(page.locator('#pdf-viewer')).toBeVisible();
      await expect(page.locator('#pdf-viewer')).toHaveAttribute('data', url);
    }
    await page.locator('#viewer-close').click();
    const [file] = await Promise.all([
      page.waitForEvent('download'),
      page.locator(`.js-table-page-attachment-download[href="${url}?download=true"]`).click(),
    ]);
    expect(file.suggestedFilename()).toBe(`${id}.${extension}`);
    const chunks = [];
    for await (const chunk of await file.createReadStream()) chunks.push(chunk);
    expect(Buffer.concat(chunks)).toEqual(bytes);
    expect(db.getBoard(board.boardId).members.some(member => member.userId === adminUser.id)).toBe(false);
    if (extension === 'zip') {
      await loginWithToken(page, user.id, user.token);
      const card = db.findOne('cards', { boardId: board.boardId });
      await navigateInApp(page, `/b/${board.boardId}/${board.slug}/${card._id}`);
      await page.locator(`.open-preview[data-attachment-id="${id}"]`).click();
      await expect(page.locator('#zip-viewer li')).toHaveText(zipNames);
      await page.locator('#viewer-close').click();
      await expect(page.locator('#zip-viewer li')).toHaveCount(0);
    }
  } finally {
    db.deleteOne('attachments', { _id: id });
    fs.rmSync(filename, { force: true });
  }
});

}
