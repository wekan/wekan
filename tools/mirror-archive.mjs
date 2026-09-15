// Persistent, additive GitHub issue/release files for the human-run mirrors.
import fs from 'node:fs';
import path from 'node:path';
import { limiter } from './mirror-rate-limits.mjs';
import { generateStatic, generateCatalog, staticCommentIdentity } from './mirror-static.mjs';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { repositoryArchive, organization, destinationNamespaces } from './mirror-repository.mjs';
import { createHash, randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const indexName = 'mirror-index.json';
const reserved = new Set([indexName, 'issue.json', 'comments.json', 'pull-request.json', 'pull-request.patch', 'reviews.json', 'release.json', 'README.md', 'source-code.zip', 'source-code.tar.gz', 'source-item.json', 'source-comment.json', 'source-review.json', 'source-comment-files.json', 'source-review-files.json', 'source-assets.json']);
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
  if (value.version !== 1 || !Array.isArray(value.files) || !['issues', 'pulls', 'releases', 'projects', 'repository', 'comments'].includes(value.type)) throw new Error(`Invalid archive index in ${directory}`);
  const keys = new Set(), names = new Set();
  for (const entry of value.files) {
    if (typeof entry.key !== 'string' || typeof entry.name !== 'string' || archiveName(entry.name) !== entry.name || !Number.isSafeInteger(entry.size) || entry.size < 0 || !Number.isFinite(entry.mtimeMs) || !/^[a-f0-9]{64}$/.test(entry.sha256 || '') || keys.has(entry.key) || names.has(entry.name.toLowerCase())) throw new Error(`Invalid file entry in archive index in ${directory}`);
    keys.add(entry.key); names.add(entry.name.toLowerCase());
  }
  return value;
}
function itemDirectory(base, type, key) {
  let directory = path.join(base, ...(type === 'comments' ? [] : [type]), type !== 'releases' ? String(key) : releaseFolder(key));
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
export function writeBytes(file, bytes, now) {
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
export function resolveFileLinks(text, sourceUrl) {
  let source;
  try { source = new URL(sourceUrl); } catch { return text; }
  if (!['gitlab.com', 'codeberg.org', 'sourceforge.net'].includes(source.hostname)) return text;
  return String(text || '').replace(/(\]\(\s*)(\/(?:uploads\/|attachments\/|-\/project\/\d+\/uploads\/|p\/[A-Za-z0-9_.-]+\/)[^\s]*)/g, (_, prefix, relative) => {
    const base = source.hostname === 'gitlab.com' && relative.startsWith('/uploads/') ? `${source.origin}/${source.pathname.split('/').filter(Boolean).slice(0, 2).join('/')}` : source.origin;
    return `${prefix}${base}${relative}`;
  });
}
export function issueFiles(issue, allLinks = false) {
  const texts = [resolveFileLinks(issue.body || '', issue.source_url || issue.html_url), ...(issue.commentsToMirror || []).map(c => resolveFileLinks(c.body || '', c.source_url || issue.source_url || c.html_url || issue.html_url)), ...(issue.reviews || []).map(c => resolveFileLinks(c.body || '', issue.source_url || issue.html_url))];
  const urls = new Set();
  // Parse URL parentheses so filenames such as screenshot(1).png survive.
  for (const text of texts) {
    const starts = [...text.matchAll(/https?:\/\//g)].map(m => m.index);
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
        if (allLinks || (u.hostname === 'github.com' && /^\/(?:user-attachments\/(?:assets|files)\/|[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/files\/)/.test(u.pathname)) || /^(?:user-images|private-user-images)\.githubusercontent\.com$/.test(u.hostname) || (u.hostname === 'gitlab.com' && /^\/(?:[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\/(?:-\/)?|-\/project\/\d+\/)uploads\//.test(u.pathname)) || (u.hostname === 'codeberg.org' && /^\/attachments\//.test(u.pathname)) || (u.hostname === 'sourceforge.net' && /^\/(?:rest\/)?p\/[A-Za-z0-9_.-]+\/.+\/(?:attachment|attachments)\//.test(u.pathname))) urls.add(u.href);
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

// Never send forge credentials to prose links or let linked pages reach local
// network services. Redirects are checked independently; HTML is not crawled.
export async function publicLink(url, resolveHost = lookup) {
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{address:host}] : await resolveHost(host, {all:true});
  if (!addresses.length || addresses.some(({address}) => {
    const a = address.toLowerCase();
    if (isIP(a) === 4) {
      const [x,y] = a.split('.').map(Number);
      return x === 0 || x === 10 || x === 127 || x >= 224 || (x === 169 && y === 254) || (x === 172 && y >=16 && y <=31) || (x === 192 && y ===168) || (x ===100 && y >=64 && y <=127);
    }
    return !a.startsWith('2') && !a.startsWith('3');
  })) throw new Error('Linked URL does not resolve exclusively to public Internet addresses');
  return addresses;
}
export async function pinnedFetch(url, options, addresses, transport = url.protocol === 'https:' ? https : http) {
  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      headers: options.headers,
      signal: options.signal,
      lookup: (host, lookupOptions, callback) => {
        const values = addresses.map(a => ({ address: a.address, family: isIP(a.address) }));
        if (lookupOptions.all) callback(null, values);
        else callback(null, values[0].address, values[0].family);
      },
    }, response => {
      // Node accepts status codes outside Fetch's 200..599 range. Errors in
      // this event callback must reject the download, not escape and crash
      // the archive process (including malformed response headers).
      try {
        const status = response.statusCode;
        if (!Number.isInteger(status) || status < 200 || status > 599) {
          throw new Error(`Linked URL returned unsupported HTTP status ${status}`);
        }
        const emptyBody = [204, 205, 304].includes(status);
        const headers = Object.fromEntries(Object.entries(response.headers)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value]));
        const result = new Response(emptyBody ? null : Readable.toWeb(response), { status, headers });
        if (emptyBody) response.resume();
        resolve(result);
      } catch (error) {
        response.destroy();
        reject(error);
      }
    });
    request.on('error', reject);
    request.end();
  });
}
export function commentIdentity(comment) {return staticCommentIdentity(comment);}

export async function downloadUrl(url, { temporary, previous, cachedFile, fetcher = fetch, allLinks = false, resolveHost = lookup, timeoutMs = 30000 } = {}) {
  const signal = AbortSignal.timeout(timeoutMs);
  const requested = new URL(url);
  const archive = requested.hostname === 'api.github.com' && requested.pathname.match(/^\/repos\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/(zipball|tarball)\/(.+)$/);
  // Use the file service directly so hundreds of public release archives do
  // not consume the unauthenticated REST API quota just to obtain redirects.
  if (archive) url = `https://codeload.github.com/${archive[1]}/${archive[2]}/legacy.${archive[3] === 'zipball' ? 'zip' : 'tar.gz'}/${archive[4]}`;
  // Attachment redirects are limited to GitHub's file hosts. No credentials
  // are forwarded to linked websites or arbitrary hosts from issue Markdown.
  const allowed = host => ['github.com', 'codeload.github.com', 'api.github.com', 'gitlab.com', 'codeberg.org', 'sourceforge.net', 'downloads.sourceforge.net'].includes(host) || host.endsWith('.dl.sourceforge.net') || host.endsWith('.githubusercontent.com') || /^github-production-[a-z0-9-]+\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/.test(host);
  const headers = {};
  if (cachedFile && previous?.etag) headers['If-None-Match'] = previous.etag;
  if (cachedFile && previous?.lastModified) headers['If-Modified-Since'] = previous.lastModified;
  let response;
  for (let hop = 0; hop < 10; hop++) {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol) || (!allLinks && (u.protocol !== 'https:' || !allowed(u.hostname))) || u.username || u.password) throw new Error('Unsupported attachment redirect host');
    const addresses = allLinks ? await publicLink(u, (host,opts) => new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(signal.reason),{once:true});Promise.resolve(resolveHost(host,opts)).then(resolve,reject);} )) : undefined;
    const requestOptions = { headers, redirect: 'manual', signal };
    const operation=()=>{const options={...requestOptions,signal};return allLinks && fetcher === fetch ? pinnedFetch(u,options,addresses) : fetcher(u.href,options);};
    response=fetcher===fetch?await limiter.perform(u.hostname,operation,{maxWaitMs:3000,noRetry:true}):await operation();
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
  try { await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(file), {signal}); }
  catch (error) { fs.rmSync(file,{force:true}); throw error; }
  const length = response.headers.get('content-length');
  // Encoded responses are transparently decoded by fetch.
  if (length !== null && !response.headers.get('content-encoding') && fs.statSync(file).size !== Number(length)) throw new Error('Incomplete attachment download');
  const disposition = response.headers.get('content-disposition') || '';
  let originalName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] || disposition.match(/filename="([^"]+)"/i)?.[1] || disposition.match(/filename=([^;]+)/i)?.[1];
  if (originalName) { try { originalName = decodeURIComponent(originalName.trim()); } catch { /* Preserve undecodable filenames safely. */ } }
  if (!originalName) {
    const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'application/pdf': '.pdf', 'video/mp4': '.mp4', 'text/html': '.html', 'application/xhtml+xml': '.html', 'text/plain': '.txt', 'video/webm': '.webm', 'audio/mpeg': '.mp3' }[response.headers.get('content-type')?.split(';')[0]];
    const name = new URL(url).pathname.split('/').pop() || new URL(url).hostname;
    if (ext && (!path.extname(name) || ext === '.html')) originalName = `${name}${name.toLowerCase().endsWith(ext) ? '' : ext}`;
  }
  return { file, etag: response.headers.get('etag') || undefined, lastModified: response.headers.get('last-modified') || undefined, originalName };
}

export async function archiveItem(base, type, key, source, files, options) {
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
        if (descriptor.asset && (!descriptor.asset.sourceName || descriptor.asset.sourceName === 'github')) {
          if (cached && old.assetId === descriptor.asset.id && old.size === descriptor.asset.size && old.digest === descriptor.asset.digest) fetched = { file: path.join(directory, old.name), reused: true };
          else fetched = { file: await downloadAsset(descriptor.asset, temporary) };
        } else { const downloadOptions = { temporary, previous: old, cachedFile: cached ? path.join(directory, old.name) : undefined, allLinks: descriptor.allLinks === true }; fetched = await fetchFile(descriptor.source,downloadOptions); }
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
        if (descriptor.asset && ((descriptor.asset.size !== undefined && fs.statSync(fetched.file).size !== descriptor.asset.size) || (descriptor.asset.digest && descriptor.asset.digest !== `sha256:${hash}`))) throw new Error('Source asset size/digest mismatch');
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
      record(descriptor.allLinks ? 'skipped' : 'failed', `${type}/${key}/${descriptor.name}: ${error.message}`);
    }
  }
  if (!apply) return;
  writeBytes(path.join(directory, indexName), serialized({ version: 1, type, key, source, files: current }), now);
}
export async function archiveProjects(base, projects, options) {
  const present = new Set();
  for (const project of projects) {
    const key = String(project.number);
    if (!/^\d+$/.test(key) || Number(key) < 1) throw new Error('Invalid source project number');
    present.add(key);
    await archiveItem(base, 'projects', key, project.url, [
      { key: 'project', name: 'project.json', kind: 'metadata', bytes: serialized(project) },
      { key: 'notes', name: 'README.md', kind: 'metadata', bytes: Buffer.from(`# ${project.title}\n\n${project.shortDescription || ''}\n\n${project.readme || ''}\n\nSource: ${project.url}\n\nPortable project data; native automation and accounts are not recreated.\n`) },
    ], options);
  }
  const directory = path.join(base, 'projects');
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const item = path.join(directory, entry.name), index = loadIndex(item);
    if (!index || index.type !== 'projects' || present.has(String(index.key)) || index.sourceMissing) continue;
    if (!options.apply) { options.record?.('planned', `retire removed projects/${entry.name}`); continue; }
    for (const file of index.files) if (retire(path.join(item, file.name), options.now)) options.record?.('retired', `projects/${index.key}/${file.name}: source project removed`);
    writeBytes(path.join(item, indexName), serialized({ ...index, files: [], sourceMissing: true }), options.now);
  }
}


export function migrateLegacyArchive(root,base,now,record=()=>{}) {
  const legacy=path.join(root,'.tools/mirror');
  function merge(from,to) {
    const stat=fs.lstatSync(from);
    if(stat.isSymbolicLink()) throw new Error('Legacy archive symlink preserved; migration requires review');
    if(stat.isDirectory()) {
      if(!fs.existsSync(to)) {fs.mkdirSync(path.dirname(to),{recursive:true});fs.renameSync(from,to);record('migrated',to);return;}
      if(!fs.statSync(to).isDirectory())throw Error('Legacy archive directory collision');
      for(const entry of fs.readdirSync(from))merge(path.join(from,entry),path.join(to,entry));
    } else {
      fs.mkdirSync(path.dirname(to),{recursive:true});
      if(fs.existsSync(to)) {const holding=path.join(path.dirname(to),`old-${timestamp(now)}-${path.basename(to)}`);let dest=holding,n=1;while(fs.existsSync(dest))dest=holding+'.'+n++;fs.renameSync(from,dest);}else fs.renameSync(from,to);
    }
  }
  for(const type of ['issues','pulls','releases','projects','repository'])if(fs.existsSync(path.join(legacy,type)))merge(path.join(legacy,type),path.join(base,type));
}

async function archiveUnlockedSnapshot(snapshot, { root, apply = true, downloadAsset, fetchFile = downloadUrl, record = () => {}, now = new Date(), partial = false, reconcileOnly = false } = {}) {
  const base = archiveBase(root, snapshot.sourceName, snapshot.repository, snapshot.organization), temporary = path.join(root, '.tools/tmp/mirror-archive');
  if (apply) {
    fs.mkdirSync(temporary, { recursive: true });
    if ((snapshot.organization || organization)==='wekan' && (snapshot.repository || 'wekan')==='wekan' && (!snapshot.sourceName || snapshot.sourceName==='github')) migrateLegacyArchive(root,base,now,record);
  }
  const options = { apply, record, downloadAsset, fetchFile, temporary, now };
  if (snapshot.repositoryMetadata) {
    const metadata = snapshot.repositoryMetadata;
    await archiveItem(base, 'repository', 'metadata', metadata.html_url, [{ key: 'repository', name: 'repository.json', kind: 'metadata', bytes: serialized(metadata) }, ...(snapshot.projectPageUrl ? [{key:'projects-page',name:'projects-page.html',kind:'webpage',source:snapshot.projectPageUrl,allLinks:true}] : [])], options);
  }
  if (snapshot.projects !== undefined) await archiveProjects(base, snapshot.projects, options);
  const isPull = issue => Boolean(issue.pull_request || issue.pullMetadata);
  const present = { issues: new Set(snapshot.issues.filter(i => !isPull(i)).map(i => String(i.number))), pulls: new Set(snapshot.issues.filter(isPull).map(i => String(i.number))), releases: new Set(snapshot.releases.map(r => String(r.tag_name))) };
  for (const issue of reconcileOnly ? [] : snapshot.issues) {
    const type = isPull(issue) ? 'pulls' : 'issues';
    try {
      if (!Number.isSafeInteger(issue.number) || issue.number < 1) throw new Error('Invalid GitHub issue number');
      const { commentsToMirror = [], pullMetadata, reviews = [], originalBody, ...raw } = issue;
      if (originalBody !== undefined) raw.body = originalBody;
      const files = [{ key: 'issue', name: 'issue.json', kind: 'metadata', bytes: serialized(raw) }, ...(snapshot.diskSnapshot ? [{key:'source-snapshot',name:'source-item.json',kind:'metadata',bytes:serialized(issue)}] : []), { key: 'notes', name: 'README.md', kind: 'metadata', bytes: Buffer.from(`# ${raw.title}\n\n${raw.body || ''}\n\nSource: ${issue.html_url}\n`) }, { key: 'comments', name: 'comments.json', kind: 'metadata', bytes: serialized(commentsToMirror) }, ...issueFiles(issue)];
      if (pullMetadata) files.push({ key: 'pull', name: 'pull-request.json', kind: 'metadata', bytes: serialized(pullMetadata) }, { key: 'reviews', name: 'reviews.json', kind: 'metadata', bytes: serialized(reviews) }, { key: 'patch', name: 'pull-request.patch', kind: 'patch', source: pullMetadata.patch_url || `${issue.html_url}.patch` });
      await archiveItem(base, type, issue.number, issue.html_url, files, options);
      const directory = itemDirectory(base, type, issue.number);
      const commentIds=new Set(['body']);
      for (const comment of [{...issue, id:'body', body: originalBody ?? issue.body}, ...commentsToMirror, ...reviews.filter(r=>!commentsToMirror.some(c=>c.html_url && c.html_url===r.html_url))]) {
        const id = comment.id === 'body' ? 'body' : commentIdentity(comment);
        commentIds.add(id);
        const archivedComment = {...comment, archiveCommentId:id};
        const linked = issueFiles({...comment, commentsToMirror:[], reviews:[], source_url:comment.source_url || issue.source_url || issue.html_url}, true).map(f=>({...f,allLinks:true,createdAt:comment.created_at || issue.created_at}));
        await archiveItem(directory, 'comments', id, comment.html_url || issue.html_url, [
          {key:'comment',name:'comment.json',kind:'metadata',bytes:serialized(archivedComment)},
          {key:'listing',name:'index.html',kind:'metadata',bytes:Buffer.alloc(0)},
          ...['source-comment.json','source-review.json'].filter(name=>fs.existsSync(path.join(directory,id,name))).map(name=>({key:name,name,kind:'metadata',bytes:fs.readFileSync(path.join(directory,id,name))})),
          ...linked,
        ],options);
        if (apply) {
          const commentDirectory = path.join(directory,id);
          const local = loadIndex(commentDirectory);
          writeBytes(path.join(commentDirectory,'index.csv'), Buffer.from('"name","source","sha256","size"\r\n' + local.files.filter(f=>f.kind==='attachment').map(f=>[f.name,f.source,f.sha256,f.size].map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n'),now);
        }
      }
      if(apply && fs.existsSync(directory)) for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
        if(!entry.isDirectory() || commentIds.has(entry.name))continue;
        const oldDirectory=path.join(directory,entry.name),index=loadIndex(oldDirectory);
        if(!index || index.type!=='comments' || index.sourceMissing)continue;
        for(const file of index.files)if(file.name!=='index.html')retire(path.join(oldDirectory,file.name),now);
        if(fs.existsSync(path.join(oldDirectory,'index.csv')))retire(path.join(oldDirectory,'index.csv'),now);
        writeBytes(path.join(oldDirectory,indexName),serialized({...index,files:[],sourceMissing:true}),now);
        writeBytes(path.join(oldDirectory,'index.html'),Buffer.alloc(0),now);
      }

    } catch (error) { record('failed', `${type}/${issue.number}: ${error.message}`); }
  }
  for (const release of reconcileOnly ? [] : snapshot.releases) {
    try {
      const used = new Set([...reserved].map(n => n.toLowerCase()));
      const files = [{ key: 'release', name: 'release.json', kind: 'metadata', bytes: serialized(release) }, ...(snapshot.diskSnapshot ? [{key:'source-snapshot',name:'source-item.json',kind:'metadata',bytes:serialized(release)}] : []), { key: 'notes', name: 'README.md', kind: 'metadata', bytes: Buffer.from(`${release.body || ''}\n\nSource: ${release.html_url}\n`) }];
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
  for (const type of partial ? [] : ['issues', 'pulls', 'releases']) {
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
  if (apply) {
    generateStatic(snapshot, base, (file, content) => writeBytes(file, Buffer.from(content), now), { listings: !partial });
    if (!partial) generateCatalog(root, (file, content) => writeBytes(file, Buffer.from(content), now));
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
function archiveBase(root, sourceName = 'github', repository = 'wekan', owner = organization) {
  if (!['github', 'gitlab', 'codeberg', 'sourceforge'].includes(sourceName)) throw new Error('Unknown archive source');
  return repositoryArchive(root,repository,sourceName==='github'?owner:destinationNamespaces[sourceName],{github:'github.com',gitlab:'gitlab.com',codeberg:'codeberg.org',sourceforge:'sourceforge.net'}[sourceName]);
}
export function archivedAssets(root, releases, sourceName = 'github', repository = 'wekan') {
  const assets = new Map(), sources = new Map();
  for (const release of releases) {
    const directory = itemDirectory(archiveBase(root, sourceName, repository), 'releases', release.tag_name);
    const index = loadIndex(directory);
    if (!index || index.sourceMissing || String(index.key) !== String(release.tag_name)) continue;
    for (const file of index.files) {
      if (file.fetchFailed || !validCache(directory, file)) continue;
      const local = path.join(directory, file.name);
      if (file.kind === 'asset') {
        const current = (release.assets || []).find(a => a.id === file.assetId);
        if (current && (current.size === undefined || current.size === file.size) && current.digest === file.digest && current.browser_download_url === file.source) assets.set(file.assetId, local);
      }
      if (file.kind === 'source-archive') {
        const list = sources.get(release.tag_name) || [];
        list.push({ name: file.name, size: file.size, digest: `sha256:${file.sha256}`, browser_download_url: file.source, local }); sources.set(release.tag_name, list);
      }
    }
  }
  return { assets, sources };
}

export function archivedCommentFiles(root, snapshot, issue, comment) {
  const base = archiveBase(root, snapshot.sourceName, snapshot.repository, snapshot.organization);
  const type = issue.pull_request || issue.pullMetadata ? 'pulls' : 'issues';
  const id = comment.id === 'body' ? 'body' : commentIdentity(comment);
  const directory = path.join(itemDirectory(base,type,issue.number),id);
  const index = loadIndex(directory);
  return (index?.files || []).filter(f=>f.kind==='attachment' && !f.fetchFailed && validCache(directory,f)).map(f=>({...f,local:path.join(directory,f.name)}));
}
