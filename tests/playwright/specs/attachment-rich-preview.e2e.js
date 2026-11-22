'use strict';
// The attachment slideshow shows Markdown, CSV, source code, iCalendar, tar.gz
// and OpenDocument files with its own viewers (client/lib/attachmentRichViewer.js),
// each loaded when such a file is opened. What a file contains is text, never
// markup that runs.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const fs = require('node:fs');
const path = require('node:path');
const { gzipSync, zipSync, strToU8 } = require('fflate');

function tar(entries) {
  const parts = [];
  for (const [name, data] of entries) {
    const header = new Uint8Array(512);
    const bytes = strToU8(data);
    const put = (text, at) => header.set(strToU8(text), at);
    put(name, 0); put('0000644', 100); put(bytes.length.toString(8).padStart(11, '0'), 124);
    put('0', 156); put('ustar', 257); put('00', 263); put('        ', 148);
    put(`${header.reduce((a, b) => a + b, 0).toString(8).padStart(6, '0')}\0 `, 148);
    const body = new Uint8Array(Math.ceil(bytes.length / 512) * 512);
    body.set(bytes);
    parts.push(header, body);
  }
  parts.push(new Uint8Array(1024));
  return Buffer.concat(parts.map(p => Buffer.from(p)));
}

const ODT = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:text>
<text:h>Project plan</text:h><text:p>&lt;script&gt;alert(1)&lt;/script&gt; first step</text:p>
</office:text></office:body></office:document-content>`;

const FILES = [
  { ext: 'md', type: 'text/markdown', body: Buffer.from('# Release notes\n\n**Bold** text\n\n<script>window.mdRan = 1</script>') },
  { ext: 'csv', type: 'text/csv', body: Buffer.from('Name,Note\n"Smith, Jo","<img src=x onerror=window.csvRan=1>"\n') },
  { ext: 'py', type: 'text/x-python', body: Buffer.from('def hello():\n    return "<b>hi</b>"\n') },
  { ext: 'html', type: 'text/html', body: Buffer.from('<script>window.htmlRan = 1</script><h1>Page</h1>') },
  { ext: 'ics', type: 'text/calendar', body: Buffer.from(['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:e1',
    'SUMMARY:Sprint review', 'DTSTART:20261201T090000Z', 'DTEND:20261201T100000Z', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')) },
  { ext: 'tgz', type: 'application/gzip', body: Buffer.from(gzipSync(tar([['src/app.js', 'x'], ['<img onerror=alert(1)>.txt', 'y']]))) },
  { ext: 'odt', type: 'application/vnd.oasis.opendocument.text',
    body: Buffer.from(zipSync({ mimetype: strToU8('application/vnd.oasis.opendocument.text'), 'content.xml': strToU8(ODT) })) },
];

test('the slideshow shows Markdown, CSV, code, iCalendar, tar.gz and OpenDocument attachments as text', async ({ page, adminUser, user, board }) => {
  const directory = path.join(process.env.WEKAN_FILES_PATH, 'attachments');
  fs.mkdirSync(directory, { recursive: true });
  const card = db.findOne('cards', { boardId: board.boardId });
  const ids = {};
  const written = [];
  try {
    // The storage root is the administrator's to ask; the board member opens the files.
    await loginWithToken(page, adminUser.id, adminUser.token);
    const storage = await page.evaluate(() => Meteor.callAsync('getAttachmentStoragePaths'));
    const root = storage.attachments;
    for (const file of FILES) {
      const id = db.uid(`rich${file.ext}`);
      const name = `${id}.${file.ext}`;
      const filename = path.join(directory, name);
      fs.writeFileSync(filename, file.body);
      written.push(filename);
      ids[file.ext] = id;
      db.insertOne('attachments', { _id: id, name, extension: file.ext, type: file.type, size: file.body.length,
        meta: { boardId: board.boardId, cardId: card._id },
        versions: { original: { storage: 'fs', path: `${root}/${name}`, size: file.body.length, extension: file.ext, type: file.type } } });
    }
    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/${card._id}`);
    const rich = page.locator('#rich-viewer');
    const openPreview = async ext => {
      await page.locator(`.open-preview[data-attachment-id="${ids[ext]}"]`).click();
      await expect(rich).toBeVisible();
    };

    await openPreview('md');
    await expect(rich.locator('.viewer h1')).toHaveText('Release notes');
    await expect(rich.locator('.viewer strong')).toHaveText('Bold');
    await page.locator('#viewer-close').click();
    await expect(rich).toBeHidden();
    await expect(rich.locator('*')).toHaveCount(0);

    await openPreview('csv');
    await expect(rich.locator('td')).toHaveText(['Smith, Jo', '<img src=x onerror=window.csvRan=1>']);
    await expect(rich.locator('img')).toHaveCount(0);
    await page.locator('#viewer-close').click();

    await openPreview('py');
    await expect(rich.locator('code.language-python')).toContainText('return "<b>hi</b>"');
    await expect(rich.locator('code span.hljs-keyword').first()).toHaveText('def');
    await expect(rich.locator('b')).toHaveCount(0);
    await page.locator('#viewer-close').click();

    await openPreview('html');
    await expect(rich.locator('code')).toContainText('<script>window.htmlRan = 1</script>');
    await expect(rich.locator('script, h1')).toHaveCount(0);
    await page.locator('#viewer-close').click();

    await openPreview('ics');
    await expect(rich.locator('td').first()).toHaveText('Sprint review');
    await page.locator('#viewer-close').click();

    await openPreview('tgz');
    await expect(rich.locator('li')).toHaveText(['src/app.js', '<img onerror=alert(1)>.txt']);
    await expect(rich.locator('img')).toHaveCount(0);
    await page.locator('#viewer-close').click();

    await openPreview('odt');
    await expect(rich.locator('h3')).toHaveText('Project plan');
    await expect(rich.locator('p').first()).toHaveText('<script>alert(1)</script> first step');
    await page.locator('#viewer-close').click();

    // Negative: nothing any of these files contained ran.
    expect(await page.evaluate(() => [window.mdRan, window.csvRan, window.htmlRan])).toEqual([undefined, undefined, undefined]);
  } finally {
    for (const id of Object.values(ids)) db.deleteOne('attachments', { _id: id });
    for (const filename of written) fs.rmSync(filename, { force: true });
  }
});
