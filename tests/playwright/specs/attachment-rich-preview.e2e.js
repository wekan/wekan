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
    // The mimetype entry stored, first and uncompressed, as the OpenDocument
    // standard requires and LibreOffice writes: deflated, WeKan's type detection
    // rightly reads the file as a plain ZIP and names it so.
    body: Buffer.from(zipSync({ mimetype: [strToU8('application/vnd.oasis.opendocument.text'), { level: 0 }], 'content.xml': strToU8(ODT) })) },
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
    await expect(rich.locator('.attachment-csv-row:not(.attachment-csv-header) .attachment-csv-cell'))
      .toHaveText(['Smith, Jo', '<img src=x onerror=window.csvRan=1>']);
    await expect(rich.locator('img')).toHaveCount(0);
    await page.locator('#viewer-close').click();

    await openPreview('py');
    await expect(rich.locator('.attachment-window-row').nth(1)).toHaveText('    return "<b>hi</b>"');
    await expect(rich.locator('.attachment-window-row span.hljs-keyword').first()).toHaveText('def');
    await expect(rich.locator('b')).toHaveCount(0);
    await page.locator('#viewer-close').click();

    await openPreview('html');
    await expect(rich.locator('.attachment-window-row').first()).toContainText('<script>window.htmlRan = 1</script>');
    await expect(rich.locator('script, h1')).toHaveCount(0);
    await page.locator('#viewer-close').click();

    await openPreview('ics');
    await expect(rich.locator('.attachment-csv-row:not(.attachment-csv-header) .attachment-csv-cell').first()).toHaveText('Sprint review');
    await page.locator('#viewer-close').click();

    await openPreview('tgz');
    await expect(rich.locator('li')).toHaveText(['src/app.js', '<img onerror=alert(1)>.txt']);
    await expect(rich.locator('img')).toHaveCount(0);
    await page.locator('#viewer-close').click();

    await openPreview('odt');
    await expect(rich.locator('.attachment-preview-heading')).toHaveText('Project plan');
    await expect(rich.locator('.attachment-window-row', { hasText: 'first step' })).toHaveText('<script>alert(1)</script> first step');
    await expect(rich.locator('script')).toHaveCount(0);
    await page.locator('#viewer-close').click();

    // Negative: nothing any of these files contained ran.
    expect(await page.evaluate(() => [window.mdRan, window.csvRan, window.htmlRan])).toEqual([undefined, undefined, undefined]);
  } finally {
    for (const id of Object.values(ids)) db.deleteOne('attachments', { _id: id });
    for (const filename of written) fs.rmSync(filename, { force: true });
  }
});

// No limit and no whole download: a 150,000-row CSV opens with only its screen
// fetched through Range requests and only its screen in the page, and the
// scrollbar is the file - its middle shows the middle, its end the last row.
test('a large CSV is read windowed: only the screen is fetched and drawn, the scrollbar is the whole file', async ({ page, adminUser, user, board }) => {
  const directory = path.join(process.env.WEKAN_FILES_PATH, 'attachments');
  fs.mkdirSync(directory, { recursive: true });
  const card = db.findOne('cards', { boardId: board.boardId });
  const id = db.uid('richbigcsv');
  const name = `${id}.csv`;
  const body = Buffer.from(`Name,Value\n${Array.from({ length: 150000 }, (_, i) => `row ${i},${i * 2}`).join('\n')}\n`);
  const filename = path.join(directory, name);
  fs.writeFileSync(filename, body);
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const storage = await page.evaluate(() => Meteor.callAsync('getAttachmentStoragePaths'));
    db.insertOne('attachments', { _id: id, name, extension: 'csv', type: 'text/csv', size: body.length,
      meta: { boardId: board.boardId, cardId: card._id },
      versions: { original: { storage: 'fs', path: `${storage.attachments}/${name}`, size: body.length, extension: 'csv', type: 'text/csv' } } });
    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/${card._id}`);
    const fetched = [];
    page.on('response', async response => {
      if (!response.url().includes(`/cdn/storage/attachments/${id}`)) return;
      fetched.push({ status: response.status(), range: response.request().headers().range || '',
        length: Number(response.headers()['content-length'] || 0) });
    });
    await page.locator(`.open-preview[data-attachment-id="${id}"]`).click();
    const rows = page.locator('#rich-viewer .attachment-csv-row:not(.attachment-csv-header)');
    const firstCell = () => rows.first().locator('.attachment-csv-cell').first().textContent();
    await expect(rows.first().locator('.attachment-csv-cell').first()).toHaveText('row 0');
    await expect(page.locator('#rich-viewer .attachment-csv-header .attachment-csv-cell')).toHaveText(['Name', 'Value']);
    expect(await page.locator('#rich-viewer .attachment-csv-row').count()).toBeLessThan(80);

    const scroller = page.locator('#rich-viewer .attachment-window');
    await scroller.evaluate(el => { el.scrollTop = (el.scrollHeight - el.clientHeight) / 2; });
    await expect.poll(async () => Number(String(await firstCell()).replace('row ', ''))).toBeGreaterThan(60000);
    const middle = Number(String(await firstCell()).replace('row ', ''));
    expect(middle).toBeLessThan(90000);

    await scroller.evaluate(el => { el.scrollTop = el.scrollHeight; });
    await expect(rows.last().locator('.attachment-csv-cell').first()).toHaveText('row 149999');
    await expect(page.locator('#rich-viewer .attachment-csv-header .attachment-csv-cell').first()).toHaveText('Name');
    expect(await page.locator('#rich-viewer .attachment-csv-row').count()).toBeLessThan(80);

    // Only ranges of it were fetched, never the whole file.
    expect(fetched.length).toBeGreaterThan(0);
    expect(fetched.every(f => f.status === 206 && /^bytes=\d+-\d+$/.test(f.range))).toBe(true);
    const sent = fetched.reduce((n, f) => n + f.length, 0);
    expect(sent).toBeLessThan(body.length / 2);
    await page.locator('#viewer-close').click();
    await expect(page.locator('#rich-viewer .attachment-csv-row')).toHaveCount(0);
  } finally {
    db.deleteOne('attachments', { _id: id });
    fs.rmSync(filename, { force: true });
  }
});

// An Outlook .msg - its content scattered through a Compound File - is
// converted once on the server, a piece at a time, into rows; the slideshow
// fetches only the visible rows of that preview, never the .msg itself.
test('an Outlook .msg is shown from its server-converted rows: only the screen is fetched, the scrollbar is exact', async ({ page, request, adminUser, user, board }) => {
  const { sampleMsg } = require('../../lib/outlookMsgFixture.cjs');
  const directory = path.join(process.env.WEKAN_FILES_PATH, 'attachments');
  fs.mkdirSync(directory, { recursive: true });
  const card = db.findOne('cards', { boardId: board.boardId });
  const id = db.uid('richmsg');
  const name = `${id}.msg`;
  const body = Buffer.from(sampleMsg({ big: 4 * 1024 * 1024,
    body: Array.from({ length: 100000 }, (_, i) => `Mail line ${i}`).join('\r\n') }));
  const filename = path.join(directory, name);
  fs.writeFileSync(filename, body);
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const storage = await page.evaluate(() => Meteor.callAsync('getAttachmentStoragePaths'));
    db.insertOne('attachments', { _id: id, name, extension: 'msg', type: 'application/vnd.ms-outlook', size: body.length,
      meta: { boardId: board.boardId, cardId: card._id },
      versions: { original: { storage: 'fs', path: `${storage.attachments}/${name}`, size: body.length, extension: 'msg', type: 'application/vnd.ms-outlook' } } });
    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/${card._id}`);
    const fetched = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes(`/cdn/storage/attachments/${id}`)) fetched.push({ url, status: response.status(), range: response.request().headers().range || '' });
    });
    await page.locator(`.open-preview[data-attachment-id="${id}"]`).click();
    const rich = page.locator('#rich-viewer');
    await expect(rich.locator('.attachment-preview-field').first()).toContainText('Quarterly plan');
    await expect(rich.locator('.attachment-window-row', { hasText: 'Mail line 0' })).toHaveCount(1);
    expect(await rich.locator('.attachment-window-row').count()).toBeLessThan(80);
    await rich.locator('.attachment-window').evaluate(el => { el.scrollTop = el.scrollHeight; });
    await expect(rich.locator('.attachment-window-row').last()).toHaveText('Mail line 99999');
    expect(await rich.locator('.attachment-window-row').count()).toBeLessThan(80);
    // Only the preview's parts, ranged; the .msg itself is never downloaded.
    expect(fetched.length).toBeGreaterThan(0);
    expect(fetched.every(f => /\/preview-(meta|index|rows)$/.test(f.url))).toBe(true);
    expect(fetched.filter(f => !f.url.endsWith('/preview-meta')).every(f => f.status === 206 && f.range)).toBe(true);
    // Without signing in the preview is refused, as the original is.
    expect((await request.get(`/cdn/storage/attachments/${id}/preview-meta`)).status()).toBe(403);
    expect((await request.get(`/cdn/storage/attachments/${id}/preview-rows`)).status()).toBe(403);
    await page.locator('#viewer-close').click();
    await expect(rich.locator('.attachment-window-row')).toHaveCount(0);
  } finally {
    db.deleteOne('attachments', { _id: id });
    fs.rmSync(filename, { force: true });
  }
});
