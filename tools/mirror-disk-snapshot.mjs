// Disk-backed GitHub collection. Only one API page and one conversation are held.
import fs from 'node:fs';
import path from 'node:path';
import { repositoryArchive, organization, repository } from './mirror-repository.mjs';
import { archiveSnapshot, releaseFolder, writeBytes } from './mirror-archive.mjs';
import { generateStatic, generateCatalog, staticCommentIdentity, page, prose } from './mirror-static.mjs';

export class DiskItems {
  constructor(base, files, predicate = () => true, decorate = value => value) {
    this.base = base; this.files = files; this.predicate = predicate; this.decorate = decorate;
  }
  *[Symbol.iterator]() {
    for (const name of this.files) {
      const file = path.resolve(this.base, name);
      if (!file.startsWith(path.resolve(this.base) + path.sep)) throw Error('Unsafe disk snapshot item path');
      const value = this.decorate(JSON.parse(fs.readFileSync(file, 'utf8')));
      if (this.predicate(value)) yield value;
    }
  }
  get length() { return this.files.length; }
  filter(predicate) { return new DiskItems(this.base, this.files, value => this.predicate(value) && predicate(value), this.decorate); }
  map(fn) { return Array.from(this, fn); }
}
export function diskSnapshot(manifest, { requireComplete = true } = {}) {
  if (manifest.diskSnapshot !== 1 || typeof manifest.base !== 'string' || !Array.isArray(manifest.issueFiles) || !Array.isArray(manifest.releaseFiles)) throw Error('Invalid disk snapshot manifest');
  if (requireComplete && !manifest.complete) throw Error('Incomplete source collection; saved files are preserved, destination sync is stopped');
  const { issueFiles, releaseFiles, ...metadata } = manifest;
  return { ...metadata, issues: new DiskItems(manifest.base, issueFiles), releases: new DiskItems(manifest.base, releaseFiles) };
}
export function readSnapshot(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return data.diskSnapshot === 1 ? diskSnapshot(data) : data;
}
async function eachPage(api, endpoint, consume, { manifest, save } = {}) {
  const checkpoint = manifest?.pages[endpoint] || { next: 1, complete: false };
  if (checkpoint.complete) return;
  if (manifest) manifest.pages[endpoint] = checkpoint;
  let previous;
  for (let number = checkpoint.next; ; number++) {
    const values = await api(`${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${number}&per_page=100`);
    if (!Array.isArray(values)) throw Error(`Expected a GitHub array at ${endpoint}`);
    if (!values.length) { checkpoint.complete = true; if (save) save(); return; }
    const fingerprint = values.map(value => value.id ?? value.number).join(',');
    if (fingerprint === previous) throw Error(`Server repeated a page at ${endpoint}`);
    previous = fingerprint;
    for (const value of values) await consume(value);
    checkpoint.next = number + 1; if (save) save();
  }
}
export async function collectGithub({ root, api, exportFile, downloadAsset, fetchFile, log = console.log, now = new Date(), cacheOnly = false, issuesEnabled = process.env.WEKAN_MIRROR_HAS_ISSUES !== 'false' }) {
  const base = repositoryArchive(root, repository, organization, 'github.com');
  fs.mkdirSync(base, { recursive: true });
  const stateFile = path.join(base, 'source-manifest.json');
  const previousManifest = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : undefined;
  const resume = previousManifest?.diskSnapshot === 1 && (previousManifest.complete === false || (!cacheOnly && previousManifest.archiveComplete === false));
  const manifest = resume ? previousManifest : { diskSnapshot: 1, base, sourceName: 'github', sourceUrl: `https://github.com/${organization}/${repository}`, repository, organization,
    capturedAt: now.toISOString(), complete: false, issueFiles: [], releaseFiles: [], labels: [], milestones: [], pages: {}, detailsDone: [], releasesDone: [], failedArchiveItems: [] };
  if (manifest.base !== base || manifest.repository !== repository || manifest.organization !== organization || !manifest.pages) throw Error('Checkpoint does not match repository');
  const retryItems = new Set(manifest.failedArchiveItems || []);
  manifest.failedArchiveItems = []; delete manifest.archiveFailed; manifest.complete = false;
  const state = (file, value) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const incoming = `${file}.incoming-${process.pid}`;
    fs.writeFileSync(incoming, JSON.stringify(value, null, 2) + '\n'); fs.renameSync(incoming, file);
  };
  const save = () => { state(stateFile, manifest); if (exportFile) state(exportFile, manifest); };
  const collectPage = (endpoint, consume) => eachPage(api, endpoint, consume, { manifest, save });
  const write = (file, value) => writeBytes(file, Buffer.from(JSON.stringify(value, null, 2) + '\n'), now);
  const source = `repos/${organization}/${repository}`;
  const itemPaths = new Map(manifest.issueFiles.map(name => [Number(path.basename(path.dirname(name))), name]));
  let activeItem;
  const normalized = raw => ({ ...raw, source_url: raw.html_url });
  const lock = path.join(base, 'source-collection.lock');
  if (fs.existsSync(lock)) {
    const owner = JSON.parse(fs.readFileSync(path.join(lock, 'owner.json'), 'utf8'));
    if (!Number.isSafeInteger(owner.pid) || owner.pid < 1 || fs.readdirSync(lock).some(name => name !== 'owner.json')) throw Error('Invalid source collection lock; preserved');
    try { process.kill(owner.pid, 0); throw Error('Another source collection is running'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
    fs.rmSync(lock, { recursive: true });
  }
  fs.mkdirSync(lock); state(path.join(lock, 'owner.json'), { pid: process.pid });
  const interrupted = signal => { save(); fs.rmSync(lock, { recursive: true, force: true }); process.exit(signal === 'SIGINT' ? 130 : 143); };
  const onInt = () => interrupted('SIGINT'), onTerm = () => interrupted('SIGTERM');
  process.once('SIGINT', onInt); process.once('SIGTERM', onTerm);
  try {
  save();
  if (resume) log(`[archive] Resuming saved GitHub collection (${manifest.detailsDone.length} completed conversations)`);
  log(`[archive] Saving GitHub responses directly under ${base}`);
  const saveIssue = async raw => {
    if (!Number.isSafeInteger(raw.number) || raw.number < 1) throw Error('Invalid GitHub issue identity');
    const type = raw.pull_request ? 'pulls' : 'issues', relative = `${type}/${raw.number}/source-item.json`;
    const dir = path.join(base, type, String(raw.number)); fs.mkdirSync(dir, { recursive: true });
    write(path.join(base, relative), normalized(raw));
    // A separate raw response remains usable even if comments/reviews stop later.
    write(path.join(dir, 'issue.json'), normalized(raw));
    writeBytes(path.join(dir, 'index.html'), Buffer.from(page(`#${raw.number} ${raw.title}`, prose(raw.body), '../../index.html')), now);
    state(path.join(dir, 'source-comment-files.json'), []);
    state(path.join(dir, 'source-review-files.json'), []);
    itemPaths.set(raw.number, relative); if (!manifest.issueFiles.includes(relative)) manifest.issueFiles.push(relative);
    if (manifest.issueFiles.length % 100 === 0) save();
    log(`[archive] Saved ${type}/${raw.number}/issue.json`);
  };
  if (issuesEnabled) await collectPage(`${source}/issues?state=all&sort=created&direction=asc`, saveIssue);
  await collectPage(`${source}/pulls?state=all&sort=created&direction=asc`, async pull => {
    if (!itemPaths.has(pull.number)) await saveIssue({ ...pull, pull_request: { patch_url: pull.patch_url } });
    const dir = path.dirname(path.join(base, itemPaths.get(pull.number)));
    write(path.join(dir, 'pull-request.json'), pull);
  });
  save();
  const saveComment = async comment => {
    const number = Number((comment.issue_url || comment.pull_request_url)?.split('/').pop());
    if (!Number.isSafeInteger(number) || number < 1) throw Error('Invalid comment parent identity');
    if (!itemPaths.has(number)) {
      log(`[archive] Fetching missing issue/pull #${number} referenced by a comment`);
      const parent = await api(`${source}/issues/${number}`);
      if (parent?.number !== number) throw Error(`Unexpected comment parent response for #${number}`);
      await saveIssue(parent);
      save();
    }
    const relative = itemPaths.get(number);
    const dir = path.dirname(path.join(base, relative)), id = staticCommentIdentity(comment);
    if (relative.startsWith('pulls/') && !fs.existsSync(path.join(dir, 'pull-request.json'))) {
      const pull = await api(`${source}/pulls/${number}`);
      if (pull?.number !== number) throw Error(`Unexpected pull response for #${number}`);
      write(path.join(dir, 'pull-request.json'), pull);
    }
    const commentDir = path.join(dir, id); fs.mkdirSync(commentDir, { recursive: true });
    write(path.join(commentDir, 'source-comment.json'), { ...comment, source_url: comment.html_url });
    writeBytes(path.join(commentDir, 'index.html'), Buffer.alloc(0), now);
    const listFile = path.join(dir, 'source-comment-files.json');
    const names = JSON.parse(fs.readFileSync(listFile, 'utf8'));
    const name = `${id}/source-comment.json`; if (!names.includes(name)) { names.push(name); state(listFile, names); }
    log(`[archive] Saved ${path.relative(base, commentDir)}/source-comment.json`);
  };
  if (issuesEnabled) await collectPage(`${source}/issues/comments?sort=created&direction=asc`, saveComment);
  else for (const [number] of itemPaths) await collectPage(`${source}/issues/${number}/comments`, c => saveComment({ ...c, issue_url: `${source}/${number}` }));
  await collectPage(`${source}/pulls/comments?sort=created&direction=asc`, saveComment);
  const archiveRecord = (status, detail) => { log(`[archive] ${status}: ${detail}`); if (status === 'failed') { manifest.archiveFailed = true; if (activeItem && !manifest.failedArchiveItems.includes(activeItem)) manifest.failedArchiveItems.push(activeItem); } };
  const options = { root, apply: true, partial: true, downloadAsset, ...(fetchFile ? { fetchFile } : {}), record: archiveRecord, now };
  for (const relative of manifest.issueFiles) {
    activeItem = relative;
    if (manifest.detailsDone.includes(relative)) {
      if (!cacheOnly && (retryItems.has(relative) || manifest.cacheOnly)) await archiveSnapshot({ ...manifest, issues: [JSON.parse(fs.readFileSync(path.join(base, relative), 'utf8'))], releases: [] }, options);
      save(); continue;
    }
    const file = path.join(base, relative), dir = path.dirname(file), item = JSON.parse(fs.readFileSync(file, 'utf8'));
    item.commentsToMirror = JSON.parse(fs.readFileSync(path.join(dir, 'source-comment-files.json'), 'utf8')).map(name => {
      const local = path.resolve(dir, name); if (!local.startsWith(dir + path.sep)) throw Error('Unsafe comment path');
      return JSON.parse(fs.readFileSync(local, 'utf8'));
    });
    if (item.pull_request) {
      item.pullMetadata = JSON.parse(fs.readFileSync(path.join(dir, 'pull-request.json'), 'utf8'));
      item.originalBody = item.body;
      const reviewList = path.join(dir, 'source-review-files.json');
      await collectPage(`${source}/pulls/${item.number}/reviews`, async review => {
        const id = staticCommentIdentity(review), reviewDir = path.join(dir, id);
        fs.mkdirSync(reviewDir, { recursive: true }); write(path.join(reviewDir, 'source-review.json'), review);
        writeBytes(path.join(reviewDir, 'index.html'), Buffer.alloc(0), now);
        log(`[archive] Saved pulls/${item.number}/${id}/source-review.json`);
        const names = JSON.parse(fs.readFileSync(reviewList, 'utf8')), name = `${id}/source-review.json`;
        if (!names.includes(name)) { names.push(name); state(reviewList, names); }
      });
      item.reviews = JSON.parse(fs.readFileSync(reviewList, 'utf8')).map(name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
      for (const review of item.reviews) if (review.html_url) item.commentsToMirror.push({ ...review, source_url: review.html_url, created_at: review.submitted_at, review_state: review.state });
      const pr = item.pullMetadata;
      item.body = `${item.body || ''}\n\nPull request: ${pr.head?.label || '?'} → ${pr.base?.label || '?'}.\nMerged: ${Boolean(pr.merged_at)}.\nPatch: ${item.pull_request.patch_url || `${item.html_url}.patch`}`;
    }
    item.commentsToMirror.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    write(file, item);
    if (!cacheOnly) await archiveSnapshot({ ...manifest, issues: [item], releases: [] }, options);
    manifest.detailsDone.push(relative); save();
  }
  await collectPage(`${source}/releases`, async raw => {
    const dir = path.join(base, 'releases', releaseFolder(raw.tag_name)); fs.mkdirSync(dir, { recursive: true });
    const relative = `releases/${path.basename(dir)}/source-item.json`;
    activeItem = relative;
    if (manifest.releasesDone.includes(relative)) {
      if (!cacheOnly && (retryItems.has(relative) || manifest.cacheOnly)) await archiveSnapshot({ ...manifest, issues: [], releases: [JSON.parse(fs.readFileSync(path.join(base, relative), 'utf8'))] }, options);
      return;
    }
    const release = normalized(raw);
    write(path.join(base, relative), release); write(path.join(dir, 'release.json'), release);
    log(`[archive] Saved releases/${path.basename(dir)}/release.json`);
    const assetsFile = path.join(dir, 'source-assets.json');
    release.assets = manifest.pages[`${source}/releases/${release.id}/assets`] && fs.existsSync(assetsFile) ? JSON.parse(fs.readFileSync(assetsFile, 'utf8')) : [];
    await collectPage(`${source}/releases/${release.id}/assets`, async asset => {
      if (!release.assets.some(a => a.id === asset.id)) release.assets.push(asset);
      write(path.join(base, relative), release); state(assetsFile, release.assets);
    });
    write(path.join(base, relative), release); if (!manifest.releaseFiles.includes(relative)) manifest.releaseFiles.push(relative); save();
    if (!cacheOnly) await archiveSnapshot({ ...manifest, issues: [], releases: [release] }, options);
    manifest.releasesDone.push(relative); save();
  });
  if (issuesEnabled) {
    await collectPage(`${source}/labels`, label => { if (!manifest.labels.some(l => l.id === label.id)) manifest.labels.push(label); });
    await collectPage(`${source}/milestones?state=all`, milestone => { if (!manifest.milestones.some(m => m.id === milestone.id)) manifest.milestones.push(milestone); });
  } else {
    const labels = new Map(), milestones = new Map();
    for (const issue of diskSnapshot(manifest, { requireComplete: false }).issues) {
      for (const label of issue.labels || []) labels.set(label.name, label);
      if (issue.milestone) milestones.set(issue.milestone.title, issue.milestone);
    }
    manifest.labels = [...labels.values()]; manifest.milestones = [...milestones.values()];
  }
  // Releases whose outer listing page completed before an attachment failure
  // still retry from disk, without repeating completed GitHub API pages.
  for (const relative of retryItems) if (relative.startsWith('releases/') && manifest.releasesDone.includes(relative) && !cacheOnly) {
    activeItem = relative;
    await archiveSnapshot({ ...manifest, issues: [], releases: [JSON.parse(fs.readFileSync(path.join(base, relative), 'utf8'))] }, options);
  }
  if (!cacheOnly && manifest.cacheOnly) for (const relative of manifest.releaseFiles) {
    activeItem = relative;
    await archiveSnapshot({ ...manifest, issues: [], releases: [JSON.parse(fs.readFileSync(path.join(base, relative), 'utf8'))] }, options);
  }
  activeItem = undefined;
  manifest.cacheOnly = cacheOnly;
  manifest.complete = true; manifest.archiveComplete = !cacheOnly && !manifest.archiveFailed; save();
  // Reconcile removed items only after every required inventory succeeded.
  if (!cacheOnly) await archiveSnapshot(diskSnapshot(manifest), { ...options, partial: false, reconcileOnly: true });
  if (manifest.archiveFailed) { manifest.archiveComplete = false; save(); }
  if (manifest.archiveFailed) throw Error('Source responses were saved, but some archive downloads failed; rerun to retry');
  return manifest;
  } finally {
    save(); process.removeListener('SIGINT', onInt); process.removeListener('SIGTERM', onTerm);
    fs.rmSync(lock, { recursive: true, force: true });
  }
}
