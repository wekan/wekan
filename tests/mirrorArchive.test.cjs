'use strict';
// Real archive filesystem operations under an isolated fixture checkout only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const repo = path.resolve(__dirname, '..');
process.env.TMPDIR = path.join(repo, '.tools/tmp');
fs.mkdirSync(process.env.TMPDIR, { recursive: true });
const work = fs.mkdtempSync(path.join(process.env.TMPDIR, 'mirror-archive-test-'));
const hash = text => createHash('sha256').update(text).digest('hex');
(async () => {
  const m = await import(pathToFileURL(path.join(repo, 'tools/mirror-archive.mjs')));
  let passed = 0, sequence = 0;
  const now = new Date('2026-09-13T12:34:56Z');
  const cases = [];
  async function test(name, fn) { await fn(); passed++; console.log('  ok -', name); }
  function fixture() {
    const root = path.join(work, `case-${cases.length}`); cases.push(root);
    const bodies = new Map(), requests = [], records = [];
    const attachment = 'https://github.com/user-attachments/files/123/screenshot(1).png';
    bodies.set(attachment, 'image');
    const asset = (id, content, name = `file-${id}.zip`) => {
      bodies.set(`asset:${id}`, content);
      return { id, name, size: Buffer.byteLength(content), digest: `sha256:${hash(content)}`, browser_download_url: `https://github.com/wekan/wekan/releases/download/v10.00/${name}` };
    };
    const snapshot = { issues: [{ number: 1234, title: 'An issue', body: `![image](${attachment})`, html_url: 'https://github.com/wekan/wekan/issues/1234', commentsToMirror: [] }], releases: [{ id: 10, tag_name: 'v10.00', name: 'WeKan 10.00', body: 'Release notes', html_url: 'https://github.com/wekan/wekan/releases/tag/v10.00', assets: [asset(1, 'first')], zipball_url: 'https://api.github.com/repos/wekan/wekan/zipball/v10.00', tarball_url: 'https://api.github.com/repos/wekan/wekan/tarball/v10.00' }] };
    for (const url of [snapshot.releases[0].zipball_url, snapshot.releases[0].tarball_url]) bodies.set(url, 'source');
    const write = (key, temporary) => {
      const content = bodies.get(key);
      if (content instanceof Error) throw content;
      if (content === undefined) return { missing: true };
      fs.mkdirSync(temporary, { recursive: true });
      const file = path.join(temporary, `download-${sequence++}`); fs.writeFileSync(file, content);
      return { file, etag: `"${hash(content)}"` };
    };
    const options = {
      root, now, record: (...v) => records.push(v),
      downloadAsset: async (a, temporary) => { requests.push(`asset:${a.id}`); return write(`asset:${a.id}`, temporary).file; },
      fetchFile: async (url, { temporary, previous, cachedFile }) => {
        requests.push(url);
        if (bodies.get(url) instanceof Error) throw bodies.get(url);
        const content = bodies.get(url);
        if (cachedFile && content !== undefined && previous?.etag === `"${hash(content)}"`) return { file: cachedFile, reused: true, etag: previous.etag, originalName: previous.originalName };
        return write(url, temporary);
      },
    };
    return { root, bodies, records, requests, snapshot, options, asset, attachment, issueDir: path.join(root, '.tools/mirror/github.com/wekan/wekan/issues/1234'), releaseDir: path.join(root, '.tools/mirror/github.com/wekan/wekan/releases/10.00') };
  }
  const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');
  const oldFiles = (dir, name) => fs.readdirSync(dir).filter(f => f.startsWith('old-') && f.includes(name));
  await test('archive has exact issue/version directories, metadata, binary attachments and source archives', async () => {
    const f = fixture(); await m.archiveSnapshot(f.snapshot, f.options);
    assert.equal(read(f.releaseDir, 'file-1.zip'), 'first');
    assert.equal(read(f.releaseDir, 'source-code.zip'), 'source');
    assert.equal(read(f.releaseDir, 'source-code.tar.gz'), 'source');
    assert.match(read(f.issueDir, 'README.md'), /An issue/);
    assert.equal(JSON.parse(read(f.issueDir, 'issue.json')).number, 1234);
    assert.deepEqual(JSON.parse(read(f.issueDir, 'comments.json')), []);
    const file = m.issueFiles(f.snapshot.issues[0])[0];
    assert.equal(read(f.issueDir, file.name), 'image');
    assert.ok(!f.records.some(r => r[0] === 'failed'), JSON.stringify(f.records));
    const assets = m.archivedAssets(f.root, f.snapshot.releases);
    assert.equal(assets.assets.get(1), path.join(f.releaseDir, 'file-1.zip'));
    assert.equal(assets.sources.get('v10.00').length, 2);
  });
  await test('unchanged rerun is idempotent and adds new issue/release files', async () => {
    const f = fixture(); await m.archiveSnapshot(f.snapshot, f.options);
    const before = fs.readdirSync(f.releaseDir), issueBefore = fs.readdirSync(f.issueDir), requests = f.requests.length;
    await m.archiveSnapshot(f.snapshot, f.options);
    assert.deepEqual(fs.readdirSync(f.releaseDir), before); assert.deepEqual(fs.readdirSync(f.issueDir), issueBefore);
    assert.ok(!f.requests.slice(requests).includes('asset:1'), 'unchanged immutable GitHub asset is cached');
    f.snapshot.releases[0].assets.push(f.asset(2, 'second'));
    const next = 'https://user-images.githubusercontent.com/123/new.png'; f.bodies.set(next, 'new-image');
    f.snapshot.issues[0].commentsToMirror.push({ body: `![new](${next})` });
    await m.archiveSnapshot(f.snapshot, f.options);
    assert.equal(read(f.releaseDir, 'file-2.zip'), 'second');
    assert.ok(fs.readdirSync(f.issueDir).some(n => n.endsWith('new.png')));
    assert.equal(read(f.releaseDir, 'file-1.zip'), 'first');
  });
  await test('removed and changed files retain bytes under the requested old timestamp prefix', async () => {
    const f = fixture(); await m.archiveSnapshot(f.snapshot, f.options);
    f.snapshot.releases[0].assets = []; f.snapshot.issues[0].body = 'Updated without screenshot';
    await m.archiveSnapshot(f.snapshot, f.options);
    assert.ok(!fs.existsSync(path.join(f.releaseDir, 'file-1.zip')));
    const old = oldFiles(f.releaseDir, 'file-1.zip'); assert.equal(old.length, 1);
    assert.match(old[0], /^old-2026-09-13_\d{2}-34-56-file-1\.zip$/);
    assert.equal(read(f.releaseDir, old[0]), 'first');
    assert.ok(oldFiles(f.issueDir, 'screenshot(1).png').length);
    assert.ok(oldFiles(f.issueDir, 'issue.json').length);
    const before = fs.readdirSync(f.releaseDir); await m.archiveSnapshot(f.snapshot, f.options);
    assert.deepEqual(fs.readdirSync(f.releaseDir), before);
  });
  await test('replacement asset with the same filename keeps the new active file and old bytes', async () => {
    const f = fixture(); await m.archiveSnapshot(f.snapshot, f.options);
    f.snapshot.releases[0].assets = [f.asset(2, 'replacement', 'file-1.zip')];
    await m.archiveSnapshot(f.snapshot, f.options);
    assert.equal(read(f.releaseDir, 'file-1.zip'), 'replacement');
    assert.equal(read(f.releaseDir, oldFiles(f.releaseDir, 'file-1.zip')[0]), 'first');
    assert.equal(m.archivedAssets(f.root, f.snapshot.releases).assets.get(2), path.join(f.releaseDir, 'file-1.zip'));
  });
  await test('network failures preserve current files; 404 removal renames them', async () => {
    const f = fixture(); await m.archiveSnapshot(f.snapshot, f.options);
    const name = m.issueFiles(f.snapshot.issues[0])[0].name;
    f.bodies.set(f.attachment, new Error('offline'));
    await m.archiveSnapshot(f.snapshot, f.options); assert.equal(read(f.issueDir, name), 'image');
    assert.ok(f.records.some(r => r[0] === 'failed' && /offline/.test(r[1])));
    f.bodies.delete(f.attachment); await m.archiveSnapshot(f.snapshot, f.options);
    assert.ok(!fs.existsSync(path.join(f.issueDir, name))); assert.equal(read(f.issueDir, oldFiles(f.issueDir, name)[0]), 'image');
  });
  await test('whole removed source items retire managed files and preserve manual/history files', async () => {
    const f = fixture(); await m.archiveSnapshot(f.snapshot, f.options);
    fs.writeFileSync(path.join(f.issueDir, 'my-notes.txt'), 'Manual');
    await m.archiveSnapshot({ issues: [], releases: [] }, f.options);
    assert.ok(oldFiles(f.issueDir, 'issue.json').length); assert.ok(oldFiles(f.releaseDir, 'file-1.zip').length);
    assert.equal(read(f.issueDir, 'my-notes.txt'), 'Manual');
    assert.equal(JSON.parse(read(f.issueDir, 'mirror-index.json')).sourceMissing, true);
    const before = fs.readdirSync(f.issueDir); await m.archiveSnapshot({ issues: [], releases: [] }, f.options);
    assert.deepEqual(fs.readdirSync(f.issueDir), before);
  });
  await test('failed new downloads retry and integrity failure never replaces existing bytes', async () => {
    const f = fixture(); await m.archiveSnapshot(f.snapshot, f.options);
    f.snapshot.releases[0].assets[0] = f.asset(1, 'updated', 'file-1.zip');
    f.bodies.set('asset:1', 'corrupt'); await m.archiveSnapshot(f.snapshot, f.options);
    assert.equal(read(f.releaseDir, 'file-1.zip'), 'first'); assert.equal(oldFiles(f.releaseDir, 'file-1.zip').length, 0);
    assert.ok(f.records.some(r => r[0] === 'failed' && /digest mismatch/.test(r[1])));
    assert.ok(!m.archivedAssets(f.root, f.snapshot.releases).assets.has(1), 'stale binary cannot be uploaded after failed refresh');
    f.bodies.set('asset:1', 'updated'); await m.archiveSnapshot(f.snapshot, f.options);
    assert.equal(read(f.releaseDir, 'file-1.zip'), 'updated'); assert.equal(oldFiles(f.releaseDir, 'file-1.zip').length, 1);
  });
  await test('PR patches, raw bodies and reviews are archived; unsafe/case-colliding names stay safe', async () => {
    const f = fixture(), i = f.snapshot.issues[0];
    i.originalBody = i.body; i.body += '\nCalculated PR info'; i.pullMetadata = { patch_url: 'https://github.com/wekan/wekan/pull/1234.patch' }; i.reviews = [{ state: 'APPROVED' }];
    f.bodies.set(i.pullMetadata.patch_url, 'diff patch');
    f.snapshot.releases[0].assets.push(f.asset(2, 'readme asset', 'readme.md'), f.asset(3, 'safe asset', '../CON:bad.zip'));
    await m.archiveSnapshot(f.snapshot, f.options);
    const pullDir = path.join(f.root, '.tools/mirror/github.com/wekan/wekan/pulls/1234');
    assert.ok(!fs.existsSync(f.issueDir));
    assert.equal(read(pullDir, 'pull-request.patch'), 'diff patch');
    assert.deepEqual(JSON.parse(read(pullDir, 'reviews.json')), i.reviews);
    assert.ok(!JSON.parse(read(pullDir, 'issue.json')).body.includes('Calculated PR info'));
    assert.equal(read(f.releaseDir, '2-readme.md'), 'readme asset');
    assert.ok(fs.readdirSync(f.releaseDir).some(n => n.includes('_CON_bad.zip')));
    assert.equal(m.archiveName('CON.txt'), '_CON.txt');
    assert.throws(() => m.archiveName('..'), /unsafe/);
  });
  await test('preview makes no archive changes and corrupt indexes cannot traverse directories', async () => {
    const f = fixture(); await m.archiveSnapshot(f.snapshot, { ...f.options, apply: false });
    assert.ok(!fs.existsSync(path.join(f.root, '.tools/mirror'))); assert.equal(f.requests.length, 0);
    await m.archiveSnapshot(f.snapshot, f.options);
    const index = JSON.parse(read(f.issueDir, 'mirror-index.json')); index.files[0].name = '../outside';
    fs.writeFileSync(path.join(f.issueDir, 'mirror-index.json'), JSON.stringify(index));
    await m.archiveSnapshot(f.snapshot, f.options);
    assert.ok(f.records.some(r => r[0] === 'failed' && /Invalid file entry/.test(r[1])));
    assert.ok(fs.existsSync(path.join(f.issueDir, 'issue.json')));
  });
  await test('native relative file links resolve to their original forge without fetching arbitrary websites', () => {
    const source = 'https://gitlab.com/wekan/wekan/-/issues/7';
    const text = '![file](/uploads/hash/file(1).png) [new](/-/project/123/uploads/hash/new.zip) [web](https://example.com/no.zip)';
    const files = m.issueFiles({ source_url: source, html_url: 'https://github.com/wekan/wekan/issues/123', body: text });
    assert.equal(files.length, 2);
    assert.ok(files.some(f => f.source === 'https://gitlab.com/wekan/wekan/uploads/hash/file(1).png'));
    assert.ok(files.some(f => f.source === 'https://gitlab.com/-/project/123/uploads/hash/new.zip'));
    assert.match(m.resolveFileLinks(text, source), /\]\(https:\/\/gitlab\.com\/wekan\/wekan\/uploads/);
    assert.equal(m.resolveFileLinks(text, 'https://example.com/no'), text);
    assert.equal(m.issueFiles({ body: '[web](https://example.com/no.zip)' }).length, 0);
  });
  await test('switching source isolates numeric IDs and retirement; native assets can omit API size', async () => {
    const f = fixture(); await m.archiveSnapshot(f.snapshot, f.options);
    const original = read(f.issueDir, 'issue.json');
    f.snapshot.sourceName = 'gitlab'; f.snapshot.issues[0].title = 'GitLab issue';
    const asset = f.snapshot.releases[0].assets[0]; asset.sourceName = 'gitlab'; delete asset.size;
    f.bodies.set(asset.browser_download_url, 'first');
    await m.archiveSnapshot(f.snapshot, f.options);
    const nativeDir = path.join(f.root, '.tools/mirror/gitlab.com/wekan/wekan/issues/1234');
    assert.equal(JSON.parse(read(nativeDir, 'issue.json')).title, 'GitLab issue');
    assert.equal(read(f.issueDir, 'issue.json'), original);
    assert.equal(m.archivedAssets(f.root, f.snapshot.releases, 'gitlab').assets.size, 1);
    f.snapshot.issues = []; await m.archiveSnapshot(f.snapshot, f.options);
    assert.ok(!fs.existsSync(path.join(nativeDir, 'issue.json')));
    assert.equal(read(f.issueDir, 'issue.json'), original);
    assert.ok(fs.readdirSync(nativeDir).some(n => n.startsWith('old-')));
  });
  await test('HTTP redirects, conditional responses, filenames and truncated transfers are checked locally', async () => {
    const temporary = path.join(work, 'http'), headers = [], url = 'https://github.com/user-attachments/assets/abc';
    const fetcher = async (u, opts) => {
      headers.push(opts.headers);
      if (u === url) return new Response(null, { status: 302, headers: { location: 'https://user-images.githubusercontent.com/image' } });
      return new Response('png', { headers: { etag: '"v1"', 'content-length': '3', 'content-disposition': 'attachment; filename="real.png"' } });
    };
    const file = await m.downloadUrl(url, { temporary, fetcher });
    assert.equal(fs.readFileSync(file.file, 'utf8'), 'png'); assert.equal(file.originalName, 'real.png');
    const result = await m.downloadUrl(url, { temporary, previous: { etag: '"v1"' }, cachedFile: file.file, fetcher: async (u, opts) => { assert.equal(opts.headers['If-None-Match'], '"v1"'); return new Response(null, { status: 304 }); } });
    assert.equal(result.reused, true);
    await assert.rejects(m.downloadUrl(url, { temporary, fetcher: async () => new Response('x', { headers: { 'content-length': '10' } }) }), /Incomplete/);
    await assert.rejects(m.downloadUrl(url, { temporary, fetcher: async () => new Response(null, { status: 302, headers: { location: 'https://example.invalid/file' } }) }), /redirect host/);
    assert.equal((await m.downloadUrl(url, { temporary, fetcher: async () => new Response(null, { status: 404 }) })).missing, true);
    let archiveUrl;
    await m.downloadUrl('https://api.github.com/repos/wekan/wekan/zipball/v10.00', { temporary, fetcher: async u => { archiveUrl = u; return new Response('zip'); } });
    assert.equal(archiveUrl, 'https://codeload.github.com/wekan/wekan/legacy.zip/v10.00');
  });
  await test('attachment header filenames persist across reruns and collisions keep distinct release directories', async () => {
    const f = fixture(), original = f.options.fetchFile;
    f.options.fetchFile = async (url, opts) => ({ ...await original(url, opts), ...(url === f.attachment ? { originalName: 'original screenshot.png' } : {}) });
    await m.archiveSnapshot(f.snapshot, f.options);
    const names = fs.readdirSync(f.issueDir); assert.ok(names.some(n => n.endsWith('original screenshot.png')));
    await m.archiveSnapshot(f.snapshot, f.options); assert.deepEqual(fs.readdirSync(f.issueDir), names);
    f.snapshot.releases.push({ ...f.snapshot.releases[0], tag_name: '10.00', body: 'Other tag', assets: [f.asset(2, 'other')], zipball_url: undefined, tarball_url: undefined });
    await m.archiveSnapshot(f.snapshot, f.options);
    const map = m.archivedAssets(f.root, f.snapshot.releases);
    assert.notEqual(path.dirname(map.assets.get(1)), path.dirname(map.assets.get(2)));
    assert.equal(fs.readFileSync(map.assets.get(2), 'utf8'), 'other');
  });
  await test('active archive writers are serialized and stale temporary locks recover', async () => {
    const f = fixture(); let unblock, started;
    const gate = new Promise(resolve => { unblock = resolve; });
    const ready = new Promise(resolve => { started = resolve; });
    const original = f.options.fetchFile;
    const active = m.archiveSnapshot(f.snapshot, { ...f.options, fetchFile: async (...args) => { started(); await gate; return original(...args); } });
    await ready;
    try { await assert.rejects(m.archiveSnapshot(f.snapshot, f.options), /Another archive run is active/); }
    finally { unblock(); await active; }
    const lock = path.join(f.root, '.tools/tmp/mirror-archive.lock');
    fs.mkdirSync(lock); fs.writeFileSync(path.join(lock, 'owner.json'), JSON.stringify({ pid: 2147483647 }));
    await m.archiveSnapshot(f.snapshot, f.options); assert.ok(!fs.existsSync(lock));
  });
  console.log(`mirrorArchive: ${passed} tests passed`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => fs.rmSync(work, { recursive: true, force: true }));
