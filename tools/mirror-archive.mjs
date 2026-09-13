// Persistent, additive GitHub issue/release files for the human-run mirrors.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const indexName = 'mirror-index.json';
const reserved = new Set([indexName, 'issue.json', 'comments.json', 'pull-request.json', 'pull-request.patch', 'reviews.json', 'release.json', 'README.md', 'source-code.zip', 'source-code.tar.gz']);
export function archiveName(value) {
  const name = String(value).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/, '');
  if (!name || name === '.' || name === '..') throw new Error('Empty or unsafe archive filename');
  const prefix = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name) ? `_${name}` : name;
  if (Buffer.byteLength(prefix, 'utf8') <= 220) return prefix;
  let shorter = prefix;
  while (Buffer.byteLength(shorter, 'utf8') > 180) shorter = [...shorter].slice(0, -1).join('');
  return `${shorter}-${createHash('sha256').update(name).digest('hex').slice(0, 12)}`;
}
export function releaseFolder(tag) { return archiveName(String(tag).replace(/^v(?=\d+\.\d)/, '')); }
export function timestamp(date = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}`;
}
export function retire(file, now = new Date()) {
  if (!fs.existsSync(file)) return;
  const prefix = `old-${timestamp(now)}-${path.basename(file)}`;
  let dest = path.join(path.dirname(file), prefix), count = 1;
  while (fs.existsSync(dest)) dest = path.join(path.dirname(file), `${prefix}.${count++}`);
  fs.renameSync(file, dest);
  return dest;
}
export async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
function loadIndex(directory) {
  const file = path.join(directory, indexName);
  if (!fs.existsSync(file)) return null;
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (value.version !== 1 || !Array.isArray(value.files) || !['issues', 'pulls', 'releases'].includes(value.type)) throw new Error(`Invalid archive index in ${directory}`);
  const keys = new Set(), names = new Set();
  for (const entry of value.files) {
    if (typeof entry.key !== 'string' || typeof entry.name !== 'string' || archiveName(entry.name) !== entry.name || !Number.isSafeInteger(entry.size) || entry.size < 0 || !Number.isFinite(entry.mtimeMs) || !/^[a-f0-9]{64}$/.test(entry.sha256 || '') || keys.has(entry.key) || names.has(entry.name.toLowerCase())) throw new Error(`Invalid file entry in archive index in ${directory}`);
    keys.add(entry.key); names.add(entry.name.toLowerCase());
  }
  return value;
}
function itemDirectory(base, type, key) {
  let directory = path.join(base, type, type !== 'releases' ? String(key) : releaseFolder(key));
  const index = loadIndex(directory);
  if (index && index.type !== type) throw new Error(`Archive type mismatch in ${directory}`);
  if (index && String(index.key) !== String(key)) {
    if (type !== 'releases') throw new Error(`Archive issue identity mismatch in ${directory}`);
    directory += `-${createHash('sha256').update(String(key)).digest('hex').slice(0, 12)}`;
    const alternate = loadIndex(directory);
    if (alternate && (alternate.type !== type || String(alternate.key) !== String(key))) throw new Error(`Archive directory collision for ${key}`);
  }
  return directory;
}
const serialized = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
function writeBytes(file, bytes, now) {
  if (fs.existsSync(file) && fs.readFileSync(file).equals(bytes)) return false;
  const incoming = path.join(path.dirname(file), `.incoming-${randomUUID()}`);
  try {
    fs.writeFileSync(incoming, bytes);
    if (fs.existsSync(file)) retire(file, now);
    fs.renameSync(incoming, file); return true;
  } catch (error) { if (fs.existsSync(incoming)) retire(incoming, now); throw error; }
}
function validCache(directory, entry) {
  if (!entry) return false;
  const file = path.join(directory, entry.name);
  if (!fs.existsSync(file)) return false;
  const stat = fs.statSync(file);
  return stat.isFile() && stat.size === entry.size && stat.mtimeMs === entry.mtimeMs;
}
export function issueFiles(issue) {
  const texts = [issue.body || '', ...(issue.commentsToMirror || []).map(c => c.body || ''), ...(issue.reviews || []).map(c => c.body || '')];
  const urls = new Set();
  // Parse URL parentheses so filenames such as screenshot(1).png survive.
  for (const text of texts) {
    const starts = [...text.matchAll(/https:\/\//g)].map(m => m.index);
    for (const start of starts) {
      let end = start, depth = 0;
      while (end < text.length && !/[\s<>"'`\]]/.test(text[end])) {
        if (text[end] === '(') depth++;
        if (text[end] === ')') { if (!depth) break; depth--; }
        end++;
      }
      const raw = text.slice(start, end).replace(/[.,;]+$/, '');
      try {
        const u = new URL(raw.replace(/&amp;/g, '&'));
        if (u.username || u.password) continue;
        if ((u.hostname === 'github.com' && /^\/(?:user-attachments\/(?:assets|files)\/|wekan\/wekan\/files\/)/.test(u.pathname)) || /^(?:user-images|private-user-images)\.githubusercontent\.com$/.test(u.hostname)) urls.add(u.href);
      } catch { /* Prose is not a file URL. */ }
    }
  }
  return [...urls].sort().map(url => {
    const u = new URL(url);
    let name;
    try { name = decodeURIComponent(u.pathname.split('/').pop()); } catch { name = u.pathname.split('/').pop(); }
    return { key: url, source: url, kind: 'attachment', name: `attachment-${createHash('sha256').update(url).digest('hex').slice(0, 8)}-${archiveName(name || 'file')}` };
  });
}
export async function downloadUrl(url, { temporary, previous, cachedFile, fetcher = fetch } = {}) {
  const requested = new URL(url);
  const archive = requested.hostname === 'api.github.com' && requested.pathname.match(/^\/repos\/wekan\/wekan\/(zipball|tarball)\/(.+)$/);
  // Use the file service directly so hundreds of public release archives do
  // not consume the unauthenticated REST API quota just to obtain redirects.
  if (archive) url = `https://codeload.github.com/wekan/wekan/legacy.${archive[1] === 'zipball' ? 'zip' : 'tar.gz'}/${archive[2]}`;
  // Attachment redirects are limited to GitHub's file hosts. No credentials
  // are forwarded to linked websites or arbitrary hosts from issue Markdown.
  const allowed = host => host === 'github.com' || host === 'codeload.github.com' || host === 'api.github.com' || host.endsWith('.githubusercontent.com') || /^github-production-[a-z0-9-]+\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/.test(host);
  const headers = {};
  if (cachedFile && previous?.etag) headers['If-None-Match'] = previous.etag;
  if (cachedFile && previous?.lastModified) headers['If-Modified-Since'] = previous.lastModified;
  let response;
  for (let hop = 0; hop < 10; hop++) {
    const u = new URL(url);
    if (u.protocol !== 'https:' || !allowed(u.hostname) || u.username || u.password) throw new Error('Unsupported attachment redirect host');
    response = await fetcher(u.href, { headers, redirect: 'manual', signal: AbortSignal.timeout(3600000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get('location');
    if (!location) throw new Error('File redirect has no Location');
    await response.body?.cancel();
    url = new URL(location, u).href;
    if (hop === 9) throw new Error('Too many attachment redirects');
  }
  if (response.status === 304 && cachedFile) return { file: cachedFile, reused: true, etag: previous.etag, lastModified: previous.lastModified, originalName: previous.originalName };
  if ([404, 410].includes(response.status)) return { missing: true };
  if (!response.ok || !response.body) throw new Error(`File download failed: HTTP ${response.status}`);
  fs.mkdirSync(temporary, { recursive: true });
  const file = path.join(temporary, `${randomUUID()}.part`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(file));
  const length = response.headers.get('content-length');
  // Encoded responses are transparently decoded by fetch.
  if (length !== null && !response.headers.get('content-encoding') && fs.statSync(file).size !== Number(length)) throw new Error('Incomplete attachment download');
  const disposition = response.headers.get('content-disposition') || '';
  let originalName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] || disposition.match(/filename="([^"]+)"/i)?.[1] || disposition.match(/filename=([^;]+)/i)?.[1];
  if (originalName) { try { originalName = decodeURIComponent(originalName.trim()); } catch { /* Preserve undecodable filenames safely. */ } }
  if (!originalName) {
    const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'application/pdf': '.pdf', 'video/mp4': '.mp4' }[response.headers.get('content-type')?.split(';')[0]];
    const name = new URL(url).pathname.split('/').pop();
    if (ext && name && !path.extname(name)) originalName = `${name}${ext}`;
  }
  return { file, etag: response.headers.get('etag') || undefined, lastModified: response.headers.get('last-modified') || undefined, originalName };
}

async function archiveItem(base, type, key, source, files, options) {
  const { apply, record, downloadAsset, fetchFile, temporary, now } = options;
  const directory = itemDirectory(base, type, key);
  const previous = loadIndex(directory);
  if (previous && String(previous.key) !== String(key)) throw new Error(`Archive directory collision for ${key}`);
  const oldByKey = new Map((previous?.files || []).map(f => [f.key, f]));
  const desired = new Set(files.map(f => f.key)), current = [];
  if (apply) fs.mkdirSync(directory, { recursive: true });
  // Retire removed identities before installing new files: a replacement
  // GitHub asset may reuse the removed asset's filename with a different ID.
  for (const old of previous?.files || []) {
    if (desired.has(old.key)) continue;
    if (!apply) { record('planned', `retire ${type}/${key}/${old.name}`); continue; }
    if (retire(path.join(directory, old.name), now)) record('retired', `${type}/${key}/${old.name}: removed from source inventory`);
  }
  for (const descriptor of files) {
    const old = oldByKey.get(descriptor.key);
    try {
      if (!apply) { record('planned', `${type}/${path.basename(directory)}/${descriptor.name}`); continue; }
      let file = path.join(directory, descriptor.name), changed = false, validators = {}, contentHash;
      if (descriptor.bytes) {
        changed = writeBytes(file, descriptor.bytes, now);
      } else {
        const cached = validCache(directory, old);
        let fetched;
        if (descriptor.asset) {
          if (cached && old.assetId === descriptor.asset.id && old.size === descriptor.asset.size && old.digest === descriptor.asset.digest) fetched = { file: path.join(directory, old.name), reused: true };
          else fetched = { file: await downloadAsset(descriptor.asset, temporary) };
        } else fetched = await fetchFile(descriptor.source, { temporary, previous: old, cachedFile: cached ? path.join(directory, old.name) : undefined });
        if (fetched.missing) {
          if (old && fs.existsSync(path.join(directory, old.name))) { retire(path.join(directory, old.name), now); record('retired', `${type}/${key}/${old.name}: source returned 404/410`); }
          record('missing', `${descriptor.source}: source file is no longer available`); continue;
        }
        if (descriptor.kind === 'attachment' && fetched.originalName) {
          descriptor.name = `attachment-${createHash('sha256').update(descriptor.source).digest('hex').slice(0, 8)}-${archiveName(fetched.originalName)}`;
          file = path.join(directory, descriptor.name);
        }
        validators = { etag: fetched.etag, lastModified: fetched.lastModified, originalName: fetched.originalName };
        const hash = contentHash = fetched.reused && old ? old.sha256 : await sha256(fetched.file);
        if (descriptor.asset && (fs.statSync(fetched.file).size !== descriptor.asset.size || (descriptor.asset.digest && descriptor.asset.digest !== `sha256:${hash}`))) throw new Error('GitHub asset size/digest mismatch');
        const same = fs.existsSync(file) && ((cached && old.name === descriptor.name && old.sha256 === hash) || await sha256(file) === hash);
        if (!same) {
          const incoming = path.join(directory, `.incoming-${randomUUID()}`);
          try {
            // Complete the copy before retiring any current file.
            fs.copyFileSync(fetched.file, incoming);
            if (fs.existsSync(file)) retire(file, now);
            if (old && old.name !== descriptor.name && fs.existsSync(path.join(directory, old.name))) retire(path.join(directory, old.name), now);
            fs.renameSync(incoming, file); changed = true;
          } catch (error) { if (fs.existsSync(incoming)) retire(incoming, now); throw error; }
        }
        if (old && old.name !== descriptor.name && fs.existsSync(path.join(directory, old.name))) retire(path.join(directory, old.name), now);
        if (!fetched.reused && path.resolve(fetched.file).startsWith(path.resolve(temporary) + path.sep)) fs.rmSync(fetched.file);
      }
      const stat = fs.statSync(file);
      const hash = contentHash || (!changed && validCache(directory, old) ? old.sha256 : await sha256(file));
      current.push({ key: descriptor.key, name: descriptor.name, source: descriptor.source, kind: descriptor.kind, ...(descriptor.asset ? { assetId: descriptor.asset.id, digest: descriptor.asset.digest } : {}), size: stat.size, mtimeMs: stat.mtimeMs, sha256: hash, ...validators });
      if (changed) record('copied', `${type}/${key}/${descriptor.name}`);
    } catch (error) {
      // A network or disk failure is not proof the file was removed.
      if (old) current.push({ ...old, fetchFailed: true });
      record('failed', `${type}/${key}/${descriptor.name}: ${error.message}`);
    }
  }
  if (!apply) return;
  writeBytes(path.join(directory, indexName), serialized({ version: 1, type, key, source, files: current }), now);
}
async function archiveUnlockedSnapshot(snapshot, { root, apply = true, downloadAsset, fetchFile = downloadUrl, record = () => {}, now = new Date() } = {}) {
  const base = path.join(root, '.tools/mirror'), temporary = path.join(root, '.tools/tmp/mirror-archive');
  if (apply) fs.mkdirSync(temporary, { recursive: true });
  const options = { apply, record, downloadAsset, fetchFile, temporary, now };
  const isPull = issue => Boolean(issue.pull_request || issue.pullMetadata);
  const present = { issues: new Set(snapshot.issues.filter(i => !isPull(i)).map(i => String(i.number))), pulls: new Set(snapshot.issues.filter(isPull).map(i => String(i.number))), releases: new Set(snapshot.releases.map(r => String(r.tag_name))) };
  for (const issue of snapshot.issues) {
    const type = isPull(issue) ? 'pulls' : 'issues';
    try {
      if (!Number.isSafeInteger(issue.number) || issue.number < 1) throw new Error('Invalid GitHub issue number');
      const { commentsToMirror = [], pullMetadata, reviews = [], originalBody, ...raw } = issue;
      if (originalBody !== undefined) raw.body = originalBody;
      const files = [{ key: 'issue', name: 'issue.json', kind: 'metadata', bytes: serialized(raw) }, { key: 'notes', name: 'README.md', kind: 'metadata', bytes: Buffer.from(`# ${raw.title}\n\n${raw.body || ''}\n\nSource: ${issue.html_url}\n`) }, { key: 'comments', name: 'comments.json', kind: 'metadata', bytes: serialized(commentsToMirror) }, ...issueFiles(issue)];
      if (pullMetadata) files.push({ key: 'pull', name: 'pull-request.json', kind: 'metadata', bytes: serialized(pullMetadata) }, { key: 'reviews', name: 'reviews.json', kind: 'metadata', bytes: serialized(reviews) }, { key: 'patch', name: 'pull-request.patch', kind: 'patch', source: pullMetadata.patch_url || `${issue.html_url}.patch` });
      await archiveItem(base, type, issue.number, issue.html_url, files, options);
    } catch (error) { record('failed', `${type}/${issue.number}: ${error.message}`); }
  }
  for (const release of snapshot.releases) {
    try {
      const used = new Set([...reserved].map(n => n.toLowerCase()));
      const files = [{ key: 'release', name: 'release.json', kind: 'metadata', bytes: serialized(release) }, { key: 'notes', name: 'README.md', kind: 'metadata', bytes: Buffer.from(`${release.body || ''}\n\nSource: ${release.html_url}\n`) }];
      for (const asset of release.assets || []) {
        let name = archiveName(asset.name);
        if (used.has(name.toLowerCase())) name = `${asset.id}-${name}`;
        if (used.has(name.toLowerCase())) throw new Error('Duplicate archive asset name');
        used.add(name.toLowerCase()); files.push({ key: `asset:${asset.id}`, name, kind: 'asset', source: asset.browser_download_url, asset });
      }
      for (const [key, url, name] of [['zip', release.zipball_url, 'source-code.zip'], ['tar', release.tarball_url, 'source-code.tar.gz']]) if (url) files.push({ key, name, source: url, kind: 'source-archive' });
      await archiveItem(base, 'releases', release.tag_name, release.html_url, files, options);
    } catch (error) { record('failed', `releases/${release.tag_name}: ${error.message}`); }
  }
  // The full snapshot is authoritative for removed issues/releases. Only
  // tracked files are renamed; user-added files and historical versions stay.
  for (const type of ['issues', 'pulls', 'releases']) {
    const directory = path.join(base, type);
    if (!fs.existsSync(directory)) continue;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        const item = path.join(directory, entry.name), index = loadIndex(item);
        if (!index || present[type].has(String(index.key)) || index.sourceMissing) continue;
        if (index.type !== type) throw new Error('Archive type mismatch');
        if (!apply) { record('planned', `retire removed ${type}/${entry.name}`); continue; }
        for (const file of index.files) if (retire(path.join(item, file.name), now)) record('retired', `${type}/${index.key}/${file.name}: source item removed`);
        writeBytes(path.join(item, indexName), serialized({ ...index, files: [], sourceMissing: true }), now);
      } catch (error) { record('failed', `${type}/${entry.name}: ${error.message}`); }
    }
  }
}
export async function archiveSnapshot(snapshot, options = {}) {
  if (options.apply === false) return archiveUnlockedSnapshot(snapshot, options);
  const parent = path.join(options.root, '.tools/tmp');
  fs.mkdirSync(parent, { recursive: true });
  const lock = path.join(parent, 'mirror-archive.lock'), ownerFile = path.join(lock, 'owner.json');
  if (fs.existsSync(lock)) {
    let owner;
    try { owner = JSON.parse(fs.readFileSync(ownerFile, 'utf8')); } catch { throw new Error('Archive lock has no valid owner; preserved'); }
    if (!Number.isSafeInteger(owner.pid) || owner.pid < 1 || owner.pid > 2147483647 || fs.readdirSync(lock).some(name => name !== 'owner.json')) throw new Error('Archive lock has unexpected contents; preserved');
    let stale = false;
    try { process.kill(owner.pid, 0); } catch (error) { stale = error.code === 'ESRCH'; }
    if (!stale) throw new Error('Another archive run is active; wait for it to finish');
    fs.rmSync(lock, { recursive: true }); // Only the stale temporary lock.
  }
  try { fs.mkdirSync(lock); } catch (error) { if (error.code === 'EEXIST') throw new Error('Another archive run is active; wait for it to finish'); throw error; }
  try {
    fs.writeFileSync(ownerFile, JSON.stringify({ pid: process.pid }));
    return await archiveUnlockedSnapshot(snapshot, options);
  } finally { fs.rmSync(lock, { recursive: true, force: true }); }
}
export function archivedAssets(root, releases) {
  const assets = new Map(), sources = new Map();
  for (const release of releases) {
    const directory = itemDirectory(path.join(root, '.tools/mirror'), 'releases', release.tag_name);
    const index = loadIndex(directory);
    if (!index || index.sourceMissing || String(index.key) !== String(release.tag_name)) continue;
    for (const file of index.files) {
      if (file.fetchFailed || !validCache(directory, file)) continue;
      const local = path.join(directory, file.name);
      if (file.kind === 'asset') {
        const current = (release.assets || []).find(a => a.id === file.assetId);
        if (current && current.size === file.size && current.digest === file.digest) assets.set(file.assetId, local);
      }
      if (file.kind === 'source-archive') {
        const list = sources.get(release.tag_name) || [];
        list.push({ name: file.name, size: file.size, digest: `sha256:${file.sha256}`, browser_download_url: file.source, local }); sources.set(release.tag_name, list);
      }
    }
  }
  return { assets, sources };
}
