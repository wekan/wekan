#!/usr/bin/env node
// Human-run synchronization. No third-party runtime dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { collectGithub, diskSnapshot, DiskItems } from './mirror-disk-snapshot.mjs';
import { archiveSnapshot, archivedAssets, downloadUrl, resolveFileLinks, archivedCommentFiles } from './mirror-archive.mjs';
import { limitedFetch, limitedCliJson, commandHost, waitCommand, noteCommandFailure } from './mirror-rate-limits.mjs';
import { githubJson, githubRequest } from './mirror-github.mjs';
import { loadSettings } from './mirror-settings.mjs';

import { repository, organization, destinationNamespaces, repositoryForges, repositoryArchive, sourceForgeMount } from './mirror-repository.mjs';
const forges = repositoryForges(repository);
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = `repos/${organization}/${repository}`;
const encode = encodeURIComponent;
export const marker = url => `<!-- wekan-mirror:${url} -->`;
export const provenance = item => `Mirrored from ${item.html_url}.\nOriginal author: ${item.user?.login || item.author?.login || 'unknown'}; created: ${item.created_at || 'unknown'}.${item.milestone ? `\nMilestone: [${item.milestone.title}](${item.milestone.html_url}).` : ''}${item.assignees?.length ? `\nSource assignees: ${item.assignees.map(a => `[${a.login}](${a.html_url})`).join(', ')}.` : ''}`;
export const body = item => `${marker(item.html_url)}\n\n${resolveFileLinks(item.body || '', item.source_url || item.html_url)}\n\n---\n${provenance(item)}`;
export const safeSegment = text => {
  if (!text) throw new Error('Empty release path');
  // Keep a readable prefix and a hash: different unsafe names cannot collide.
  const value = String(text);
  const suffix = value.match(/(\.(?:tar\.)?(?:gz|xz|bz2|zst|zip|7z|tgz|deb|rpm|exe|msi|dmg|pkg|AppImage|json|md|txt))$/i)?.[1] || '';
  return `${value.slice(0, value.length - suffix.length).replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '_').slice(0, 100)}-${createHash('sha256').update(value).digest('hex').slice(0, 12)}${suffix}`;
};
export function activeMirrors(script) {
  const mirrors = [...script.matchAll(/^mirror "([^"]+)" "([^"]+)"\s*$/gm)].map(([, name, url]) => ({ name, url }));
  if (!mirrors.length || new Set(mirrors.map(m => m.name)).size !== mirrors.length) throw new Error('Missing or duplicate active mirrors in releases/mirror.sh');
  for (const m of mirrors) {
    if (!['gitlab', 'codeberg', 'sourceforge'].includes(m.name)) throw new Error(`No data adapter for active mirror ${m.name}`);
    const expected = { gitlab: /^git@gitlab\.com:wekan\/wekan(?:\.git)?$/, codeberg: /^git@codeberg\.org:wekan\/wekan(?:\.git)?$/, sourceforge: /^ssh:\/\/wekan@git\.code\.sf\.net\/p\/wekan\/code\/?$/ };
    if (!expected[m.name].test(m.url)) throw new Error(`The ${m.name} data adapter is configured for WeKan; update it before changing its Git destination`);
  }
  return mirrors;
}
export function mirroredUrl(text) {
  const marked = String(text || '').match(/<!-- wekan-mirror:(https:\/\/(?:github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|gitlab\.com\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\/[A-Za-z0-9_.-]+|codeberg\.org\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|sourceforge\.net\/(?:p|projects)\/[A-Za-z0-9_.-]+)\/[^\s>]+) -->/);
  if (marked) return marked[1];
  // Recognize the previous engine's footer; never deduplicate by title.
  return String(text || '').match(/Mirrored from (https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(?:issues|pull)\/\d+)/i)?.[1];
}
export async function pages(request, endpoint, { key, start = 1, size = 100, pageKey = 'page', sizeKey = 'per_page' } = {}) {
  const all = [];
  let previous;
  for (let page = start; ; page++) {
    const data = await request(`${endpoint}${endpoint.includes('?') ? '&' : '?'}${pageKey}=${page}&${sizeKey}=${size}`);
    const list = key ? data[key] : data;
    if (!Array.isArray(list)) throw new Error(`Expected a paginated array at ${endpoint}`);
    if (data.solr_error) throw new Error(`Tracker search failed: ${data.solr_error}`);
    if (!list.length) {
      if (Number.isFinite(data.count) && all.length < data.count) throw new Error(`Incomplete pagination at ${endpoint}`);
      break;
    }
    const fingerprint = JSON.stringify(list);
    if (fingerprint === previous) throw new Error(`Server repeated a page at ${endpoint}`);
    previous = fingerprint;
    all.push(...list);
    // Some servers cap page size below the requested size. Only stop on empty
    // or a declared total, never on a short page.
    if (Number.isFinite(data.count) && all.length >= data.count) break;
  }
  return all;
}
export function command(tool, args, input, options = {}) {
  waitCommand(commandHost(tool,args));
  const p = spawnSync(tool, args, { cwd: root, input, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, shell: false, windowsHide: true, ...options });
  if (p.error || p.status !== 0) { const message=`${tool} failed: ${p.error?.message || p.stderr?.trim() || `exit ${p.status}`}`;noteCommandFailure(commandHost(tool,args),message);throw new Error(message); }
  return p.stdout;
}
export function cliApi(kind, endpoint, method = 'GET', data) {
  if (kind === 'github') return githubJson(endpoint,method,data);
  if (kind === 'gitlab') return limitedCliJson('gitlab.com','glab', ['api', '--hostname', 'gitlab.com', '--method', method, ...(data ? ['--input', '-'] : []), endpoint], data && JSON.stringify(data));
  return limitedCliJson('codeberg.org','tea', ['api', '--repo', forges.codeberg.url, ...(process.env.WEKAN_CODEBERG_LOGIN ? ['--login', process.env.WEKAN_CODEBERG_LOGIN] : []), '--method', method, ...(data ? ['--data', '@-'] : []), endpoint], data && JSON.stringify(data));
}
export async function httpJson(url, options = {}) {
  const response = await limitedFetch(url, { ...options, signal: options.signal || AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} at ${new URL(url).origin}${new URL(url).pathname}`);
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}
export async function sourceSnapshot(api = cliApi) {
  const get = endpoint => api('github', endpoint);
  const issuesEnabled = process.env.WEKAN_MIRROR_HAS_ISSUES !== 'false';
  const pulls = await pages(get, `${source}/pulls?state=all&sort=created&direction=asc`);
  const issues = issuesEnabled ? await pages(get, `${source}/issues?state=all&sort=created&direction=asc`) : pulls.map(p => ({ ...p, pull_request: { patch_url: p.patch_url } }));
  const comments = issuesEnabled ? await pages(get, `${source}/issues/comments?sort=created&direction=asc`) : [];
  if (!issuesEnabled) for (const pull of pulls) for (const comment of await pages(get, `${source}/issues/${pull.number}/comments`)) comments.push({ ...comment, issue_url: `${source}/${pull.number}` });
  const inline = await pages(get, `${source}/pulls/comments?sort=created&direction=asc`);
  const grouped = new Map();
  for (const comment of [...comments, ...inline]) {
    const number = Number((comment.issue_url || comment.pull_request_url)?.split('/').pop());
    if (!Number.isInteger(number)) throw new Error('GitHub comment is missing its issue/PR identity');
    const list = grouped.get(number) || [];
    list.push(comment); grouped.set(number, list);
  }
  const pullMap = new Map(pulls.map(p => [p.number, p]));
  for (const issue of issues) {
    if (issue.pull_request) {
      const pr = pullMap.get(issue.number);
      if (!pr) throw new Error(`Incomplete GitHub PR listing for #${issue.number}`);
      issue.originalBody = issue.body;
      issue.pullMetadata = pr;
      issue.reviews = await pages(get, `${source}/pulls/${issue.number}/reviews`);
      const list = grouped.get(issue.number) || [];
      for (const review of issue.reviews) if (review.html_url) list.push({ ...review, created_at: review.submitted_at, review_state: review.state });
      grouped.set(issue.number, list);
      issue.body = `${issue.body || ''}\n\nPull request: ${pr.head?.label || '?'} → ${pr.base?.label || '?'}.\nMerged: ${Boolean(pr.merged_at)}.\nPatch: ${issue.pull_request.patch_url || `${issue.html_url}.patch`}`;
    }
    issue.commentsToMirror = (grouped.get(issue.number) || []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  }
  const releases = await pages(get, `${source}/releases`);
  for (const release of releases) release.assets = await pages(get, `${source}/releases/${release.id}/assets`);
  return { issues, releases, labels: issuesEnabled ? await pages(get, `${source}/labels`) : [...new Map(issues.flatMap(i => i.labels || []).map(l => [l.name, l])).values()], milestones: issuesEnabled ? await pages(get, `${source}/milestones?state=all`) : [...new Map(issues.map(i => i.milestone).filter(Boolean).map(m => [m.title, m])).values()], repository, organization, capturedAt: new Date().toISOString() };
}
export async function selectedSnapshot(kind = 'github', api = cliApi, sourceForge = new SourceForgeAdapter()) {
  if (kind === 'github') {
    const snapshot = await sourceSnapshot(api);
    for (const item of [...snapshot.issues, ...snapshot.releases]) {
      item.source_url = item.html_url;
      item.sourceMetadata = { ...item }; delete item.sourceMetadata.sourceMetadata;
      item.html_url = mirroredUrl(item.body) || item.html_url;
      if (!item.tag_name && !item.pull_request && /\/(?:pulls?|merge_requests)\/\d+$/.test(item.html_url)) item.pull_request = { patch_url: `${item.html_url}.patch` };
      for (const comment of item.commentsToMirror || []) { comment.source_url = comment.html_url; comment.html_url = mirroredUrl(comment.body) || comment.html_url; }
    }
    return { ...snapshot, sourceName: kind, sourceUrl: forges[kind].url };
  }
  if (!Object.hasOwn(forges, kind)) throw new Error(`Unknown source: ${kind}`);
  if (kind === 'sourceforge') return sourceForgeSnapshot(sourceForge);
  const adapter = new ForgeAdapter(kind, api), gitlab = kind === 'gitlab';
  const labels = (await adapter.list('labels')).map(l => ({ ...l, color: String(l.color).replace(/^#/, '') }));
  const milestones = (await adapter.list('milestones?state=all')).map(m => ({ ...m, html_url: m.web_url || m.html_url, due_on: m.due_date || m.due_on }));
  const issues = [], seen = new Set();
  const normalize = raw => {
    const text = gitlab ? raw.description || '' : raw.body || '';
    const sourceUrl = raw.web_url || raw.html_url;
    if (!sourceUrl) throw new Error('Source issue is missing its URL');
    return { ...raw, sourceMetadata: raw, milestone: raw.milestone && (milestones.find(m => m.title === raw.milestone.title) || raw.milestone), assignees: (raw.assignees || []).map(a => ({ ...a, login: a.username || a.login, html_url: a.web_url || a.html_url })), number: raw.iid || raw.number, html_url: mirroredUrl(text) || sourceUrl, source_url: sourceUrl, body: text, user: { ...raw.author || raw.user, login: raw.author?.username || raw.user?.login }, labels: (raw.labels || []).map(l => typeof l === 'string' ? labels.find(label => label.name === l) || { name: l, color: '808080' } : l), state: ['closed', 'merged'].includes(raw.state) ? 'closed' : 'open', commentsToMirror: [] };
  };
  for (const raw of await adapter.list(gitlab ? 'issues?state=all' : 'issues?state=all&type=issues')) {
    const issue = normalize(raw); issue.commentsToMirror = await sourceComments(adapter, raw, false);
    issues.push(issue); seen.add(issue.html_url);
  }
  for (const raw of await adapter.list(gitlab ? 'merge_requests?state=all' : 'pulls?state=all')) {
    const issue = normalize(raw);
    if (seen.has(issue.html_url)) continue;
    issue.originalBody = issue.body;
    issue.body += `\n\nPull request: ${raw.source_branch || raw.head?.label || '?'} → ${raw.target_branch || raw.base?.label || '?'}.\nMerged: ${Boolean(raw.merged_at)}.\nPatch: ${raw.patch_url || `${issue.source_url}.patch`}`;
    issue.pull_request = { patch_url: raw.patch_url || `${issue.source_url}.patch` }; issue.pullMetadata = { ...raw, patch_url: issue.pull_request.patch_url };
    issue.commentsToMirror = await sourceComments(adapter, raw, true);
    if (!gitlab) {
      issue.reviews = await adapter.list(`pulls/${raw.number}/reviews`);
      for (const review of issue.reviews) for (const comment of await adapter.list(`pulls/${raw.number}/reviews/${review.id}/comments`)) issue.commentsToMirror.push({ ...comment, html_url: mirroredUrl(comment.body) || comment.html_url });
      issue.commentsToMirror.push(...issue.reviews.filter(r => r.html_url).map(r => ({ ...r, review_state: r.state, created_at: r.submitted_at || r.created_at })));
    }
    issues.push(issue); seen.add(issue.html_url);
  }
  const releases = [];
  for (const raw of await adapter.releases()) {
    const text = gitlab ? raw.description || '' : raw.body || '', sourceUrl = raw._links?.self || raw.html_url || `${forges[kind].url}/-/releases/${encode(raw.tag_name)}`;
    const release = { ...raw, sourceMetadata: raw, body: text, html_url: mirroredUrl(text) || sourceUrl, source_url: sourceUrl, published_at: raw.released_at || raw.published_at, assets: [] };
    release.assets = (await adapter.assets(raw)).map(a => ({ ...a, id: `${kind}:${a.id}`, sourceName: kind, browser_download_url: a.direct_asset_url || a.browser_download_url || a.url }));
    const ref = encode(raw.tag_name);
    release.zipball_url = gitlab ? `${forges[kind].url}/-/archive/${ref}/wekan-${ref}.zip` : `${forges[kind].url}/archive/${ref}.zip`;
    release.tarball_url = gitlab ? `${forges[kind].url}/-/archive/${ref}/wekan-${ref}.tar.gz` : `${forges[kind].url}/archive/${ref}.tar.gz`;
    releases.push(release);
  }
  return { issues, releases, labels, milestones, sourceName: kind, sourceUrl: forges[kind].url, repository, organization, capturedAt: new Date().toISOString() };
}
export async function sourceForgeSnapshot(adapter, { run = command, fetchFile = downloadUrl, directory = path.join(root, '.tools/tmp/mirror-sourceforge') } = {}) {
  fs.mkdirSync(directory, { recursive: true });
  await adapter.prepare({ labels: [], milestones: [] }, false);
  const issues = [], labels = new Map();
  for (const raw of await adapter.issues()) {
    const sourceUrl = raw.url ? new URL(raw.url, 'https://sourceforge.net').href : `https://sourceforge.net/p/${destinationNamespaces.sourceforge}/${adapter.tracker}/${raw.ticket_num}/`;
    const issue = { sourceMetadata: raw, number: raw.ticket_num, title: raw.summary, body: raw.description, html_url: mirroredUrl(raw.description) || sourceUrl, source_url: sourceUrl, state: adapter.isClosed(raw) ? 'closed' : 'open', user: { login: raw.reported_by || raw.created_by || 'unknown' }, created_at: raw.created_date, labels: (raw.labels || []).map(name => ({ name, color: '808080' })) };
    for (const label of issue.labels) labels.set(label.name, label);
    if (/\/pull\/\d+$/.test(issue.html_url)) issue.pull_request = { patch_url: `${issue.html_url}.patch` };
    issue.commentsToMirror = (await adapter.comments(raw)).map(c => ({ ...c, body: c.text, html_url: mirroredUrl(c.text) || c.url || `${sourceUrl}#${c._id || c.slug}`, user: { login: c.author?.username || c.author || 'unknown' }, created_at: c.timestamp }));
    issues.push(issue);
  }
  const user = process.env.WEKAN_SOURCEFORGE_USER || 'wekan';
  if (!/^[a-zA-Z0-9_-]+$/.test(user)) throw new Error('Invalid SourceForge SSH username');
  const groups = new Map(), remoteRoot = `/home/frs/project/${destinationNamespaces.sourceforge}`;
  const visit = relative => {
    const output = run('sftp', ['-oBatchMode=yes', '-oConnectTimeout=30', '-b', '-', `${user}@frs.sourceforge.net`], `ls -l "${remoteRoot}${relative ? `/${relative}` : ''}"\n`);
    for (const line of output.split(/\r?\n/)) {
      if (!line.trim() || line.startsWith('sftp>') || /^Connected to|^Remote working/.test(line)) continue;
      const match = line.match(/^([d-])[rwxStTs-]{9}\+?\s+\d+\s+\S+\s+\S+\s+(\d+)\s+\S+\s+\d+\s+\S+\s+(.+)$/);
      if (!match) throw new Error(`Unrecognized SourceForge file inventory: ${line}`);
      const [, type, size, name] = match;
      if (!Number.isSafeInteger(Number(size))) throw new Error('Invalid SourceForge file size');
      if (name === '.' || name === '..') continue;
      if (/["\r\n/\\]/.test(name)) throw new Error('Unsafe SourceForge inventory filename');
      const filePath = relative ? `${relative}/${name}` : name;
      if (type === 'd') { visit(filePath); continue; }
      const list = groups.get(relative) || [];
      list.push({ id: `sourceforge:${filePath}`, name, size: Number(size), sourceName: 'sourceforge', browser_download_url: `https://downloads.sourceforge.net/project/${destinationNamespaces.sourceforge}/${filePath.split('/').map(encode).join('/')}` }); groups.set(relative, list);
    }
  };
  visit('');
  const readFile = async asset => {
    const result = await fetchFile(asset.browser_download_url, { temporary: directory });
    if (result.missing || !result.file) throw new Error(`Missing SourceForge metadata ${asset.name}`);
    if (fs.statSync(result.file).size !== asset.size) throw new Error(`Incomplete SourceForge metadata ${asset.name}`);
    return fs.readFileSync(result.file, 'utf8');
  };
  const releases = [];
  for (const [relative, assets] of groups) {
    const manifestAsset = assets.find(a => a.name === 'mirror.json'), notesAsset = assets.find(a => a.name === 'README.md');
    const manifest = manifestAsset ? JSON.parse(await readFile(manifestAsset)) : null;
    if (manifest && (!manifest.tag || !Array.isArray(manifest.assets) || !mirroredUrl(marker(manifest.source)))) throw new Error('Invalid SourceForge release manifest');
    const sourceUrl = `https://sourceforge.net/projects/wekan/files/${relative.split('/').filter(Boolean).map(encode).join('/')}/`;
    const notes = notesAsset ? await readFile(notesAsset) : '';
    for (const asset of assets) {
      const original = manifest?.assets.find(a => a.filename === asset.name);
      if (original) { asset.name = original.original_name; asset.digest = original.digest; }
    }
    releases.push({ tag_name: manifest?.tag || `sourceforge-${safeSegment(relative || 'root')}`, name: manifest?.tag || relative || 'SourceForge root files', body: notes, html_url: manifest?.source || sourceUrl, source_url: sourceUrl, published_at: manifest?.published_at, target_commitish: 'main', assets, sourceMetadata: manifest || { directory: relative, syntheticRelease: true } });
  }
  return { issues, releases, labels: [...labels.values()], milestones: [], sourceName: 'sourceforge', sourceUrl: forges.sourceforge.url, repository, organization, capturedAt: new Date().toISOString() };
}
async function sourceComments(adapter, item, pull) {
  const gitlab = adapter.kind === 'gitlab', id = item.iid || item.number;
  const endpoint = gitlab ? `${pull ? 'merge_requests' : 'issues'}/${id}/notes` : `issues/${id}/comments`;
  const comments = await adapter.list(endpoint);
  if (gitlab) {
    const ids = new Set(comments.map(c => c.id));
    for (const discussion of await adapter.list(`${pull ? 'merge_requests' : 'issues'}/${id}/discussions`)) {
      if (!Array.isArray(discussion.notes)) throw new Error('Incomplete GitLab discussion inventory');
      for (const note of discussion.notes) if (!ids.has(note.id)) { comments.push({ ...note, discussion_id: discussion.id }); ids.add(note.id); }
    }
  }
  return comments.map(c => ({ ...c, source_url: c.html_url || `${item.web_url || item.html_url}#note_${c.id}`, html_url: mirroredUrl(c.body) || c.html_url || `${item.web_url || item.html_url}#note_${c.id}`, user: { ...c.author || c.user, login: c.author?.username || c.user?.login }, path: c.position?.new_path || c.path, line: c.position?.new_line || c.line }));
}
const commentBody = c => `${marker(c.html_url)}\n\n${c.review_state ? `Source review: ${c.review_state}.\n\n` : ''}${c.path ? `Review comment at ${c.path}${c.line ? `:${c.line}` : ''}:\n\n` : ''}${body(c)}`;

export class ForgeAdapter {
  constructor(kind, api = cliApi, uploadMultipart = (endpoint, file) => limitedCliJson('gitlab.com','glab', ['api', '--hostname', 'gitlab.com', '--method', 'POST', '--form', `file=@${file}`, endpoint]), uploadGithub = (release, asset, file) => limitedCliJson('github.com','gh', ['api', '--method', 'POST', '--header', 'Content-Type: application/octet-stream', '--input', file, `https://uploads.github.com/repos/${organization}/${repository}/releases/${release.id}/assets?name=${encode(asset.name)}`])) {
    this.kind = kind; this.api = api;
    this.uploadMultipart = uploadMultipart; this.uploadGithub = uploadGithub;
    this.base = kind === 'gitlab' ? `projects/${encode(destinationNamespaces.gitlab + '/' + repository)}` : `repos/${kind === 'github' ? organization : destinationNamespaces.codeberg}/${repository}`;
    this.labels = new Map(); this.milestones = new Map();
  }
  request(endpoint, method, data) { return this.api(this.kind, `${this.base}/${endpoint}`, method, data); }
  list(endpoint) { return pages(p => this.api(this.kind, p), `${this.base}/${endpoint}`, this.kind === 'codeberg' ? { sizeKey: 'limit' } : {}); }
  async prepare(snapshot, apply, record = () => {}) {
    for (const label of await this.list('labels')) this.labels.set(label.name, label);
    for (const milestone of await this.list(this.kind === 'gitlab' ? 'milestones' : 'milestones?state=all')) this.milestones.set(milestone.title, milestone);
    for (const label of snapshot.labels) {
      if (this.labels.has(label.name)) continue;
      const data = { name: label.name, color: this.kind === 'gitlab' ? `#${label.color}` : label.color, description: label.description || '' };
      this.labels.set(label.name, apply ? await this.request('labels', 'POST', data) : { ...data, id: -1 });
      record(apply ? 'copied' : 'planned', `label ${label.name}`);
    }
    for (const milestone of snapshot.milestones) {
      const existing = this.milestones.get(milestone.title);
      if (existing) {
        if (apply && milestone.state === 'closed' && existing.state !== 'closed') await this.request(`milestones/${this.kind === 'github' ? existing.number : existing.id}`, this.kind === 'gitlab' ? 'PUT' : 'PATCH', this.kind === 'gitlab' ? { state_event: 'close' } : { state: 'closed' });
        continue;
      }
      const data = { title: milestone.title, description: `${milestone.description || ''}\n\n${marker(milestone.html_url)}\n${milestone.html_url}`, ...(milestone.due_on ? (this.kind === 'gitlab' ? { due_date: milestone.due_on.slice(0, 10) } : { due_on: milestone.due_on }) : {}) };
      const created = apply ? await this.request('milestones', 'POST', data) : { ...data, id: -1 };
      this.milestones.set(milestone.title, created);
      record(apply ? 'copied' : 'planned', `milestone ${milestone.title}`);
      if (apply && milestone.state === 'closed') await this.request(`milestones/${this.kind === 'github' ? created.number : created.id}`, this.kind === 'gitlab' ? 'PUT' : 'PATCH', this.kind === 'gitlab' ? { state_event: 'close' } : { state: 'closed' });
    }
  }
  async issues() { return this.list('issues?state=all'); }
  id(issue) { return this.kind === 'gitlab' ? issue.iid : issue.number; }
  text(issue) { return this.kind === 'gitlab' ? issue.description : issue.body; }
  async create(issue) {
    const labels = (issue.labels || []).map(l => this.labels.get(l.name)).filter(Boolean);
    const milestone = issue.milestone && this.milestones.get(issue.milestone.title);
    const data = { title: `${issue.pull_request ? '[PR] ' : ''}${issue.title}`, ...(this.kind === 'gitlab' ? { description: body(issue), labels: labels.map(l => l.name).join(','), ...(milestone ? { milestone_id: milestone.id } : {}) } : { body: body(issue), labels: labels.map(l => this.kind === 'github' ? l.name : l.id), ...(milestone ? { milestone: this.kind === 'github' ? milestone.number : milestone.id } : {}) }) };
    return this.request('issues', 'POST', data);
  }
  async comments(issue) { return this.list(`issues/${this.id(issue)}/${this.kind === 'gitlab' ? 'notes' : 'comments'}`); }
  async addComment(issue, comment) { return this.request(`issues/${this.id(issue)}/${this.kind === 'gitlab' ? 'notes' : 'comments'}`, 'POST', { body: commentBody(comment) }); }
  async editComment(issue, comment, text) {
    if (comment.mirrorDescription) return this.request(`issues/${this.id(issue)}`,this.kind==='gitlab'?'PUT':'PATCH',this.kind==='gitlab'?{description:text}:{body:text});
    const endpoint = this.kind === 'gitlab' ? `issues/${this.id(issue)}/notes/${comment.id}` : `issues/comments/${comment.id}`;
    return this.request(endpoint,this.kind === 'gitlab' ? 'PUT':'PATCH',{body:text});
  }
  async uploadCommentAttachment(issue, comment, attachment) {
    if (this.kind === 'github') throw new Error('GitHub has no public REST issue/comment attachment upload endpoint');
    const endpoint = this.kind === 'gitlab' ? `${this.base}/uploads` : comment.mirrorDescription ? `${this.base}/issues/${this.id(issue)}/assets` : `${this.base}/issues/comments/${comment.id}/assets`;
    let uploaded;
    if (this.kind === 'gitlab') uploaded = await this.uploadMultipart(endpoint,attachment.local);
    else {
      const token = await this.assetAccess();
      const form = new FormData(); form.append('attachment',await fs.openAsBlob(attachment.local),attachment.name);
      uploaded = await httpJson(`https://codeberg.org/api/v1/${endpoint}`,{method:'POST',headers:{Authorization:`token ${token}`},body:form,signal:AbortSignal.timeout(3600000)});
    }
    const url = this.kind === 'gitlab' ? new URL(uploaded.full_path || uploaded.url,forges.gitlab.url + '/').href : uploaded.browser_download_url;
    if (!url || !/^https:\/\//.test(url)) throw new Error('Attachment upload returned no download URL');
    return `[${attachment.name.replace(/[\[\]\\]/g,'_')}](${url})`;
  }
  async close(issue) { return this.request(`issues/${this.id(issue)}`, this.kind === 'gitlab' ? 'PUT' : 'PATCH', this.kind === 'gitlab' ? { state_event: 'close' } : { state: 'closed' }); }
  async releases() { return this.list('releases'); }
  releaseText(r) { return this.kind === 'gitlab' ? r.description : r.body; }
  async createRelease(release) {
    const text = `${body(release)}\n\nOriginal release assets:\n${(release.assets || []).map(a => `- [${a.name}](${a.browser_download_url})`).join('\n')}`;
    return this.request('releases', 'POST', this.kind === 'gitlab' ? { name: release.name || release.tag_name, tag_name: release.tag_name, description: text, ref: release.target_commitish || 'main', released_at: release.published_at || release.created_at } : { name: release.name || release.tag_name, tag_name: release.tag_name, body: text, draft: Boolean(release.draft), prerelease: Boolean(release.prerelease), ...(this.kind === 'github' && release.sourceMetadata?.syntheticRelease ? { make_latest: 'false' } : {}), target_commitish: release.target_commitish });
  }
  async assets(release) {
    return this.kind === 'gitlab' ? this.list(`releases/${encode(release.tag_name)}/assets/links`) : this.list(`releases/${release.id}/assets`);
  }
  async assetAccess() {
    if (this.kind === 'github') return '';
    if (this.uploadToken === undefined) this.uploadToken = this.kind === 'gitlab' ? (process.env.GITLAB_TOKEN || process.env.GLAB_TOKEN || process.env.OAUTH_TOKEN || '') : (process.env.CODEBERG_TOKEN || process.env.GITEA_TOKEN || '');
    const token = this.uploadToken;
    if (!token && this.kind !== 'gitlab') throw new Error('Set CODEBERG_TOKEN or GITEA_TOKEN to copy Codeberg release binaries (tea login still handles metadata)');
    return token;
  }
  async uploadAsset(release, asset, file) {
    if (this.kind === 'github') return this.uploadGithub(release, asset, file);
    const token = await this.assetAccess();
    const host = this.kind === 'gitlab' ? 'https://gitlab.com/api/v4' : 'https://codeberg.org/api/v1';
    const headers = this.kind === 'gitlab' ? { 'PRIVATE-TOKEN': token } : { Authorization: `token ${token}` };
    let uploaded;
    if (this.kind === 'gitlab' && !token) uploaded = await this.uploadMultipart(`${this.base}/uploads`, file);
    else {
      const form = new FormData();
      form.append(this.kind === 'gitlab' ? 'file' : 'attachment', await fs.openAsBlob(file), asset.name);
      const timeout = Number(process.env.WEKAN_MIRROR_UPLOAD_TIMEOUT_MS || 3600000);
      if (!Number.isSafeInteger(timeout) || timeout <= 0) throw new Error('Invalid WEKAN_MIRROR_UPLOAD_TIMEOUT_MS');
      uploaded = await httpJson(`${host}/${this.base}/${this.kind === 'gitlab' ? 'uploads' : `releases/${release.id}/assets`}`, { method: 'POST', headers, body: form, signal: AbortSignal.timeout(timeout) });
    }
    if (this.kind === 'gitlab') {
      if (!uploaded.full_path && !uploaded.url) throw new Error('GitLab upload did not return a file URL');
      const url = uploaded.full_path ? `https://gitlab.com${uploaded.full_path}` : `${forges.gitlab.url}${uploaded.url}`;
      await this.request(`releases/${encode(release.tag_name)}/assets/links`, 'POST', { name: asset.name, url, link_type: 'package' });
    }
  }
}

export class SourceForgeAdapter {
  constructor(request = httpJson, upload = fetch) { this.kind = 'sourceforge'; this.nativeCommentAttachments = true; this.upload = upload===fetch?limitedFetch:upload; this.http = request; this.base = `https://sourceforge.net/rest/p/${destinationNamespaces.sourceforge}`; }
  async request(endpoint, method = 'GET', data) {
    const token = process.env.SOURCEFORGE_TOKEN;
    if (method !== 'GET' && !token) throw new Error('Set SOURCEFORGE_TOKEN to a SourceForge OAuth bearer token to copy tracker data');
    return this.http(`${this.base}/${endpoint}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, ...(data ? { body: new URLSearchParams(data).toString() } : {}) });
  }
  async prepare(snapshot, apply, record = () => {}) {
    if (apply && !process.env.SOURCEFORGE_TOKEN) throw new Error('Set SOURCEFORGE_TOKEN to copy SourceForge tracker data');
    let project = await this.request('');
    const trackers = (project.tools || []).filter(t => t.name === 'tickets');
    const wanted = repository !== 'wekan' || destinationNamespaces.sourceforge !== 'wekan' ? sourceForgeMount(repository, '-issues') : process.env.WEKAN_SOURCEFORGE_TRACKER;
    let tracker = wanted ? trackers.find(t => t.mount_point === wanted) : trackers.length === 1 ? trackers[0] : null;
    if (!trackers.length || (wanted && !tracker)) {
      const mount = wanted || 'github-issues';
      if (!/^[a-zA-Z0-9_-]+$/.test(mount) || (project.tools || []).some(t => t.mount_point === mount)) throw new Error('SourceForge tracker mount is invalid or occupied');
      if (!apply) {
        this.tracker = mount; this.previewWithoutTracker = true;
        record('planned', `SourceForge Tracker tool ${mount}`); return;
      }
      const installed = await this.request('admin/install_tool', 'POST', { tool: 'tickets', mount_point: mount, mount_label: 'GitHub issues', order: 'last' });
      if (installed.success === false) throw new Error(`SourceForge Tracker installation failed: ${installed.info || 'unknown reason'}`);
      project = await this.request('');
      tracker = (project.tools || []).find(t => t.name === 'tickets' && t.mount_point === mount);
      if (!tracker) throw new Error('SourceForge did not confirm the installed Tracker tool');
      record('copied', `SourceForge Tracker tool ${mount}`);
    }
    if (!tracker) throw new Error('Select an existing SourceForge Tracker with WEKAN_SOURCEFORGE_TRACKER when there are multiple trackers');
    this.tracker = tracker.mount_point;
  }
  async issues() {
    if (this.previewWithoutTracker) return [];
    // Both index and search omit descriptions in Allura. Read every detail
    // before deduplication; treating summaries as full tickets creates copies.
    const tickets = await pages(p => this.request(p), `${this.tracker}/`, { key: 'tickets', start: 0, sizeKey: 'limit' });
    const full = [];
    for (const ticket of tickets) {
      const detail = await this.detail(ticket);
      if (!detail || typeof detail.description !== 'string') throw new Error(`Incomplete SourceForge ticket #${ticket.ticket_num}`);
      full.push(detail);
    }
    return full;
  }
  text(issue) { return issue.description; }
  isClosed(issue) { return issue.status === (process.env.WEKAN_SOURCEFORGE_CLOSED_STATUS || 'closed'); }
  async create(issue) {
    const result = await this.request(`${this.tracker}/new`, 'POST', { 'ticket_form.summary': `${issue.pull_request ? '[PR] ' : ''}${issue.title}`, 'ticket_form.description': body(issue), 'ticket_form.labels': (issue.labels || []).map(l => l.name).join(','), 'ticket_form.status': process.env.WEKAN_SOURCEFORGE_OPEN_STATUS || 'open' });
    if (!result.ticket?.ticket_num && !result.ticket_num) throw new Error('SourceForge did not return a created ticket number');
    return result.ticket || result;
  }
  async detail(issue) { return (await this.request(`${this.tracker}/${issue.ticket_num}`)).ticket; }
  async comments(issue) {
    const full = await this.detail(issue);
    const id = full?.discussion_thread?._id;
    if (!id) throw new Error('SourceForge ticket has no discussion thread');
    issue.threadId = id;
    return pages(async p => (await this.request(p)).thread, `${this.tracker}/_discuss/thread/${encode(id)}`, { key: 'posts', start: 0, sizeKey: 'limit' });
  }
  async addComment(issue, comment) { const result = await this.request(`${this.tracker}/_discuss/thread/${encode(issue.threadId)}/new`, 'POST', { text: commentBody(comment) }); return result.post || result; }
  async uploadCommentAttachment(issue,comment,attachment) {
    if (!process.env.SOURCEFORGE_TOKEN) throw new Error('Set SOURCEFORGE_TOKEN for SourceForge comment attachments');
    const slug = comment.slug;
    if (typeof slug!=='string' || !/^[A-Za-z0-9_/-]+$/.test(slug)) throw new Error('SourceForge comment has no valid post slug');
    const form = new FormData(); form.append('file_info',await fs.openAsBlob(attachment.local),attachment.name);
    const url = `${this.base}/${this.tracker}/_discuss/thread/${encode(issue.threadId)}/${slug}/attach`;
    const response = await this.upload(url,{method:'POST',headers:{Authorization:`Bearer ${process.env.SOURCEFORGE_TOKEN}`},body:form,redirect:'manual',signal:AbortSignal.timeout(3600000)});
    await response.body?.cancel();
    if (!response.ok && response.status!==302 && response.status!==303) throw new Error(`SourceForge comment attachment HTTP ${response.status}`);
    return `[${attachment.name}](${url.replace('/rest/','/').replace(/attach$/,'attachment/')}${encode(attachment.name)})`;
  }
  async close(issue) {
    const full = await this.detail(issue);
    if (!full) throw new Error('SourceForge returned no ticket to close');
    // Allura saves a validated complete form; a status-only form can erase
    // other fields. Preserve the current destination text and assignments.
    const fields = { 'ticket_form.summary': full.summary, 'ticket_form.description': full.description, 'ticket_form.status': process.env.WEKAN_SOURCEFORGE_CLOSED_STATUS || 'closed', 'ticket_form.labels': (full.labels || []).join(','), 'ticket_form.assigned_to': full.assigned_to || '', 'ticket_form.private': String(Boolean(full.private)), 'ticket_form.discussion_disabled': String(Boolean(full.discussion_disabled)) };
    for (const [key, value] of Object.entries(full.custom_fields || {})) fields[`ticket_form.custom_fields.${key}`] = String(value ?? '');
    return this.request(`${this.tracker}/${issue.ticket_num}/save`, 'POST', fields);
  }
}

export async function syncCommentAttachments(adapter,snapshot,issue,target,comment,destination,apply,record,localRoot=root) {
  const attachments = archivedCommentFiles(localRoot,snapshot,issue,comment);
  let text = destination.body || destination.text || '';
  for (const attachment of attachments) {
    const identity = `<!-- wekan-mirror-file:${createHash('sha256').update(attachment.source).digest('hex')}:${attachment.sha256} -->`;
    if (text.includes(identity)) continue;
    const uploadedName = `${attachment.sha256.slice(0,12)}-${attachment.name}`;
    if (adapter.nativeCommentAttachments && (destination.attachments || []).some(a=>a.url?.endsWith('/'+encode(uploadedName)))) continue;
    record('planned',`comment attachment ${comment.html_url || issue.html_url}: ${attachment.name}`);
    if (!apply) continue;
    try {
      if (!adapter.uploadCommentAttachment || (!adapter.editComment && !adapter.nativeCommentAttachments)) throw new Error(`${adapter.kind} has no implemented comment attachment API; local file retained`);
      const markdown = await adapter.uploadCommentAttachment(target,destination,{...attachment,name:uploadedName});
      text += `\n\n${identity}\n${markdown}`;
      if (adapter.editComment) await adapter.editComment(target,destination,text);
      destination.body = text;
      record('copied',`comment attachment ${attachment.name}`);
    } catch(error) { record('failed',`comment attachment ${attachment.name}: ${error.message}`); }
  }
}
export async function syncIssues(adapter, snapshot, apply, record) {
  await adapter.prepare(snapshot, apply, record);
  const targets = await adapter.issues(); // A failed inventory must never mean empty.
  const existing = new Map();
  for (const target of targets) {
    const url = mirroredUrl(adapter.text(target));
    if (url && existing.has(url)) throw new Error(`Duplicate existing mirror identity ${url}; resolve before synchronization`);
    if (url) existing.set(url, target);
    const ownUrl = target.html_url || target.web_url || target.url || (adapter.kind === 'sourceforge' ? `https://sourceforge.net/p/${destinationNamespaces.sourceforge}/${adapter.tracker}/${target.ticket_num}/` : undefined);
    if (ownUrl && !existing.has(ownUrl)) existing.set(ownUrl, target);
  }
  for (const issue of snapshot.issues) {
    try {
      let target = existing.get(issue.html_url);
      const created = !target;
      if (!target) {
        record('planned', `issue ${issue.html_url}`);
        if (!apply) continue;
        target = await adapter.create(issue); existing.set(issue.html_url, target);
        record('copied', `issue ${issue.html_url}`);
      }
      if (adapter.kind!=='sourceforge') await syncCommentAttachments(adapter,snapshot,issue,target,{...issue,id:'body'},{...target,mirrorDescription:true,body:adapter.text(target)},apply,record);
      if (issue.commentsToMirror?.length) {
        const comments = await adapter.comments(target);
        const urls = new Set(comments.flatMap(c => [mirroredUrl(c.body || c.text), c.html_url || c.web_url || c.url || (adapter.kind === 'gitlab' ? `${target.web_url}#note_${c.id}` : undefined)]).filter(Boolean));
        for (const comment of issue.commentsToMirror) {
          if (urls.has(comment.html_url)) {
            const destination = comments.find(c=>mirroredUrl(c.body || c.text) === comment.html_url || c.html_url === comment.html_url);
            if (destination) await syncCommentAttachments(adapter,snapshot,issue,target,comment,destination,apply,record);
            continue;
          }
          record('planned', `comment ${comment.html_url}`);
          if (apply) { const destination = await adapter.addComment(target, comment); if (destination) await syncCommentAttachments(adapter,snapshot,issue,target,comment,destination,apply,record); urls.add(comment.html_url); record('copied', `comment ${comment.html_url}`); }
        }
      }
      // Repair an interrupted first import without changing source-open tickets
      // that a maintainer has since closed at the destination.
      const closed = adapter.isClosed ? adapter.isClosed(target) : (target.state || target.status) === 'closed';
      if (apply && issue.state === 'closed' && (created || !closed)) await adapter.close(target);
      record('checked', `issue ${issue.html_url}`);
    } catch (error) { record('failed', `issue ${issue.html_url}: ${error.message}`); }
  }
}
export async function syncReleases(adapter, snapshot, apply, download, record) {
  const releases = await adapter.releases();
  const existing = new Map(releases.map(r => [r.tag_name, r]));
  for (const release of snapshot.releases) {
    try {
      if (release.draft) { record('unsupported', `draft release ${release.tag_name}: kept private at GitHub`); continue; }
      let target = existing.get(release.tag_name);
      if (target && mirroredUrl(adapter.releaseText(target)) && mirroredUrl(adapter.releaseText(target)) !== release.html_url) {
        record('conflict', `release ${release.tag_name}: existing destination release has no matching GitHub provenance; preserved`); continue;
      }
      if (!target) {
        record('planned', `release ${release.tag_name}`);
        if (!apply) continue;
        target = await adapter.createRelease(release); existing.set(release.tag_name, target);
        record('copied', `release ${release.tag_name}`);
      }
      const assets = await adapter.assets(target);
      const names = new Set(assets.map(a => a.name));
      for (const asset of release.assets || []) {
        if (names.has(asset.name)) continue;
        record('planned', `asset ${release.tag_name}/${asset.name}`);
        if (apply) {
          try {
            if (adapter.assetAccess) await adapter.assetAccess();
            await adapter.uploadAsset(target, asset, await download(asset)); record('copied', `asset ${release.tag_name}/${asset.name}`);
          }
          catch (error) { record('failed', `asset ${release.tag_name}/${asset.name}: ${error.message}`); }
        }
      }
      record('checked', `release ${release.tag_name}`);
    } catch (error) { record('failed', `release ${release.tag_name}: ${error.message}`); }
  }
}
async function downloadAsset(asset, directory) {
  if (asset.sourceName && asset.sourceName !== 'github') {
    const downloaded = await downloadUrl(asset.browser_download_url, { temporary: directory });
    if (!downloaded.file || downloaded.missing) throw new Error(`Missing source asset ${asset.name}`);
    if ((asset.size !== undefined && fs.statSync(downloaded.file).size !== asset.size) || (asset.digest && !await digestMatches(downloaded.file, asset.digest))) throw new Error(`Size/digest mismatch downloading ${asset.name}`);
    return downloaded.file;
  }
  if (!Number.isInteger(asset.id) || !Number.isSafeInteger(asset.size) || asset.size < 0) throw new Error('Invalid GitHub asset identity/size');
  const file = path.join(directory, `${asset.id}-${safeSegment(asset.name)}`);
  if (fs.existsSync(file) && fs.statSync(file).size === asset.size && (!asset.digest || await digestMatches(file, asset.digest))) return file;
  const part = `${file}.part`;
  let downloaded;
  try { downloaded = await downloadUrl(asset.browser_download_url,{temporary:directory}); } catch(error) {
    if(!/HTTP (?:401|403|404)/.test(error.message))throw error;
  }
  if(downloaded?.file && !downloaded.missing) {
    fs.copyFileSync(downloaded.file,part);
    if(path.resolve(downloaded.file).startsWith(path.resolve(directory)+path.sep))fs.rmSync(downloaded.file);
  } else {
    const response=await githubRequest(`${source}/releases/assets/${asset.id}`,{headers:{Accept:'application/octet-stream'}});
    await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(part));
  }
  if (fs.statSync(part).size !== asset.size || (asset.digest && !await digestMatches(part, asset.digest))) throw new Error(`Size/digest mismatch downloading ${asset.name}`);
  fs.renameSync(part, file); return file;
}
async function digestMatches(file, digest) {
  if (!/^sha256:[a-f0-9]{64}$/i.test(digest)) throw new Error(`Unsupported asset digest ${digest}`);
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return `sha256:${hash.digest('hex')}`.toLowerCase() === digest.toLowerCase();
}
export function syncGit(mirror, run = command, exists = fs.existsSync, tools) {
  const sourceName = mirror.sourceName || 'github', sourceUrl = forges[sourceName].git;
  tools ||= path.join(repositoryArchive(root,repository,sourceName==='github'?organization:destinationNamespaces[sourceName],{github:'github.com',gitlab:'gitlab.com',codeberg:'codeberg.org',sourceforge:'sourceforge.net'}[sourceName]),'git');
  const defaultBranch = mirror.defaultBranch || process.env.WEKAN_MIRROR_DEFAULT_BRANCH || 'main';
  const gitdir = path.join(tools, `wekan-${sourceName}-mirror.git`);
  fs.mkdirSync(tools, { recursive: true });
  if (!exists(gitdir)) run('git', ['clone', '--mirror', sourceUrl, gitdir]);
  else run('git', ['-C', gitdir, 'fetch', 'origin']);
  if(!run('git',['-C',gitdir,'for-each-ref','--format=%(refname)','refs/heads','refs/tags']).trim()) return false;
  try {
    run('git', ['-C', gitdir, 'push', mirror.url, 'refs/heads/*:refs/heads/*', 'refs/tags/*:refs/tags/*']);
  } catch (original) {
    // Older mirror.sh runs merged GitHub into destination main. Such a main
    // is no longer an ancestor of GitHub main; preserve those merge commits.
    const checkout = path.join(tools, `wekan-${mirror.name}`);
    try {
      if (!exists(checkout)) run('git', ['clone', '--branch', defaultBranch, mirror.url, checkout]);
      if (run('git', ['-C', checkout, 'status', '--porcelain']).trim()) throw new Error('Mirror checkout has local changes; preserved');
      if (run('git', ['-C', checkout, 'symbolic-ref', '--short', 'HEAD']).trim() !== defaultBranch) throw new Error('Mirror checkout is not on main; preserved');
      for (const key of ['user.name', 'user.email']) {
        const identity = run('git', ['-C', root, 'config', key]).trim();
        if (!identity) throw new Error(`Configure ${key} in the WeKan checkout for mirror merge commits`);
        run('git', ['-C', checkout, 'config', key, identity]);
      }
      for (const url of [mirror.url, sourceUrl]) {
        run('git', ['-C', checkout, 'fetch', url, defaultBranch]);
        try { run('git', ['-C', checkout, 'merge', '--no-edit', 'FETCH_HEAD']); }
        catch (error) {
          try { run('git', ['-C', checkout, 'merge', '--abort']); } catch { /* Original error is reported. */ }
          throw error;
        }
      }
      run('git', ['-C', checkout, 'push', mirror.url, `HEAD:refs/heads/${defaultBranch}`]);
      const other = run('git', ['-C', gitdir, 'for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/tags']).trim().split(/\r?\n/).filter(ref => ref && ref !== `refs/heads/${defaultBranch}`);
      if (other.some(ref => !/^refs\/(heads|tags)\//.test(ref))) throw new Error('Unexpected Git ref in branch/tag inventory');
      if (other.length) run('git', ['-C', gitdir, 'push', mirror.url, ...other.map(ref => `${ref}:${ref}`)]);
    } catch (error) { throw new Error(`${original.message}; merge-preserving retry: ${error.message}`); }
  }
}
export async function sourceForgeReleases(snapshot, apply, download, record, run = command, directory = path.join(root, '.tools/tmp/mirror-active')) {
  const user = process.env.WEKAN_SOURCEFORGE_USER || 'wekan';
  if (!/^[a-zA-Z0-9_-]+$/.test(user)) throw new Error('Invalid SourceForge SSH username');
  const remote = `${user}@frs.sourceforge.net`;
  for (const release of snapshot.releases) {
    const parent = `/home/frs/project/${destinationNamespaces.sourceforge}/GitHub-releases${repository === 'wekan' ? '' : `/${repository}`}`;
    const dir = `${parent}/${safeSegment(release.tag_name)}`;
    try {
      if (release.draft) { record('unsupported', `SourceForge draft release ${release.tag_name}: kept private at GitHub`); continue; }
      const listed = run('sftp', ['-oBatchMode=yes', '-oConnectTimeout=30', '-b', '-', remote], `-ls -1 "${dir}"
`);
      const names = new Set(listed.split(/\r?\n/).map(s => s.trim().split('/').pop()));
      const files = [...(release.assets || []), ...(release.sourceFiles || [])].map(a => ({ asset: a, name: safeSegment(a.name) }));
      if (!apply) {
        for (const name of [...files.map(f => f.name), 'README.md', 'mirror.json']) if (!names.has(name)) record('planned', `SourceForge ${release.tag_name}/${name}`);
        record('checked', `SourceForge release files ${release.tag_name}`); continue;
      }
      const notes = path.join(directory, `${safeSegment(release.tag_name)}.md`);
      const manifest = path.join(directory, `${safeSegment(release.tag_name)}.json`);
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(notes, `# ${release.name || release.tag_name}\n\n${body(release)}\n`);
      fs.writeFileSync(manifest, JSON.stringify({ source: release.html_url, tag: release.tag_name, published_at: release.published_at, assets: files.map(f => ({ original_name: f.asset.name, filename: f.name, size: f.asset.size, digest: f.asset.digest, source: f.asset.browser_download_url })) }, null, 2) + '\n');
      const additions = [...files.filter(f => !names.has(f.name)), ...[{ name: 'README.md', file: notes }, { name: 'mirror.json', file: manifest }].filter(f => !names.has(f.name))];
      for (const f of additions) {
        try {
          const file = f.file || await download(f.asset);
          // Upload to a temporary name, then rename: interrupted uploads are
          // retried rather than mistaken for completed assets on the next run.
          const local = file.replace(/\\/g, '/');
          if (/["\r\n]/.test(local)) throw new Error('SFTP cannot safely encode this checkout path');
          run('sftp', ['-oBatchMode=yes', '-oConnectTimeout=30', '-b', '-', remote], `-mkdir "/home/frs/project/${destinationNamespaces.sourceforge}/GitHub-releases"\n-mkdir "${parent}"\n-mkdir "${dir}"\nput "${local}" "${dir}/${f.name}.part"\nrename "${dir}/${f.name}.part" "${dir}/${f.name}"\n`);
          record('copied', `SourceForge ${release.tag_name}/${f.name}`);
        } catch (error) { record('failed', `SourceForge ${release.tag_name}/${f.name}: ${error.message}`); }
      }
      record('checked', `SourceForge release files ${release.tag_name}`);
    } catch (error) { record('failed', `SourceForge release ${release.tag_name}: ${error.message}`); }
  }
}
export async function main(args = process.argv.slice(2)) {
  if (args.includes('--list-targets')) {
    if (args.length !== 1) throw new Error('--list-targets must be used alone');
    const settings = loadSettings(root, activeMirrors(fs.readFileSync(path.join(root, 'releases/mirror.sh'), 'utf8')).map(m => m.name));
    for (const name of settings.mirrors) console.log(`${name}\t${forges[name].push}`);
    return;
  }
  if (args.includes('--help')) {
    console.log('node tools/mirror-active-forges.mjs [--apply] [--code] [--source github|gitlab|codeberg|sourceforge] [--target github|gitlab|codeberg|sourceforge]\nDefault: read-only preview. --apply archives source files and copies missing issues/PR conversations, labels, milestones, releases and assets. --code also synchronizes selected-source branches/tags. --archive-only --apply updates local files only. Uses .tools/mirror/settings.txt, falling back to the active registry in releases/mirror.sh. See releases/mirror.md.'); return;
  }
  let target, snapshotFile, exportFile, selectedSource;
  const incremental = args.includes('--incremental');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target') { target = args[++i]; if (!target) throw new Error('--target needs a mirror name'); }
    else if (args[i] === '--source') { selectedSource = args[++i]; if (!Object.hasOwn(forges, selectedSource)) throw new Error('--source needs a known forge name'); }
    else if (args[i] === '--snapshot') { snapshotFile = args[++i]; if (!snapshotFile) throw new Error('--snapshot needs a filename'); }
    else if (args[i] === '--export-source') { exportFile = args[++i]; if (!exportFile) throw new Error('--export-source needs a filename'); }
    else if (!['--apply', '--code', '--archive-only', '--skip-archive', '--incremental', '--cache-only'].includes(args[i])) throw new Error(`Unknown argument ${args[i]}`);
  }
  const settings = loadSettings(root, activeMirrors(fs.readFileSync(path.join(root, 'releases/mirror.sh'), 'utf8')).map(m => m.name));
  selectedSource ||= settings.source;
  if (exportFile) {
    if (snapshotFile || args.includes('--apply')) throw new Error('--export-source is read-only and cannot be combined with --apply or --snapshot');
    if (incremental) {
      if (selectedSource !== 'github') throw Error('Incremental export currently requires GitHub source');
      const manifest = await collectGithub({ root, api: endpoint => cliApi('github', endpoint), exportFile: path.resolve(exportFile), downloadAsset, cacheOnly: args.includes('--cache-only') });
      console.log(`GitHub disk snapshot: ${manifest.issueFiles.length} issues/PRs, ${manifest.releaseFiles.length} releases → ${exportFile}`);
      return;
    }
    const snapshot = await selectedSnapshot(selectedSource);
    fs.mkdirSync(path.dirname(path.resolve(exportFile)), { recursive: true });
    fs.writeFileSync(exportFile, JSON.stringify(snapshot));
    console.log(`${forges[selectedSource].name} snapshot: ${snapshot.issues.length} issues/PRs, ${snapshot.releases.length} releases → ${exportFile}`);
    return;
  }
  const apply = args.includes('--apply');
  const mirrors = settings.mirrors.filter(name => name !== selectedSource && (!target || name === target)).map(name => ({ name, url: forges[name].push, sourceName: selectedSource }));
  if (!mirrors.length && !args.includes('--archive-only')) throw new Error(`No active destination mirrors${target ? `: ${target}` : ''}`);
  const id = new Date().toISOString().replace(/[:.]/g, '-');
  const logdir = path.join(root, '.tools/log', `mirror-${id}`);
  const temporary = path.join(root, '.tools/tmp/mirror-active');
  fs.mkdirSync(logdir, { recursive: true }); fs.mkdirSync(temporary, { recursive: true });
  process.env.TMPDIR = temporary;
  if (process.platform === 'win32') { process.env.TMP = temporary; process.env.TEMP = temporary; }
  const report = { started: new Date().toISOString(), apply, source: forges[selectedSource].url, archive: [], mirrors: {}, limitations: ['PRs become linked issues; issue comments, review summaries and inline review comments are copied. Review states, authors and timestamps appear as provenance; accounts, votes and reactions are not recreated.', 'Public linked files and webpage HTML are archived per comment with offline HTML/CSV indexes. GitLab and Codeberg comments receive uploaded attachments. Unsupported attachment APIs and inaccessible links are reported; original URLs and local files remain available.', 'Actions workflow files are mirrored with Git; execution logs, secrets and cross-forge executable CI configuration are not copied.', 'SourceForge release notes and binaries use File Release System directories, not native GitLab/Gitea release objects. SourceForge milestones remain in source issue provenance.', 'GitHub Discussions, projects and wiki are excluded. Draft releases are archived locally but not published to destinations. Existing destination text is preserved; only missing items/comments/assets are copied.'] };
  const log = line => { console.log(line); fs.appendFileSync(path.join(logdir, 'status.txt'), `${line}\n`); };
  let lastSave = 0;
  const save = (force = true) => {
    if (!force && Date.now() - lastSave < 500) return;
    fs.writeFileSync(path.join(logdir, 'report.json'), JSON.stringify(report, null, 2) + '\n'); lastSave = Date.now();
  };
  log(`${apply ? 'APPLY' : 'PREVIEW'}: ${forges[selectedSource].name} → ${mirrors.map(m => m.name).join(', ')}\nReport: ${logdir}`);
  let snapshot, snapshotData;
  try {
    snapshotData = snapshotFile ? JSON.parse(fs.readFileSync(snapshotFile, 'utf8')) : await selectedSnapshot(selectedSource);
    if (snapshotData.diskSnapshot === 1 && path.resolve(snapshotData.base) !== repositoryArchive(root, repository, organization, 'github.com')) throw Error('Disk snapshot archive does not match selected repository');
    snapshot = snapshotData.diskSnapshot === 1 ? diskSnapshot(snapshotData) : snapshotData;
    if (!(Array.isArray(snapshot.issues) || snapshot.issues instanceof DiskItems) || !(Array.isArray(snapshot.releases) || snapshot.releases instanceof DiskItems) || !Array.isArray(snapshot.labels) || !Array.isArray(snapshot.milestones) || !snapshot.capturedAt) throw new Error('Invalid GitHub snapshot');
    if ((snapshot.organization || 'wekan') !== organization) throw new Error('Snapshot does not match selected organization');
    if ((snapshot.repository || 'wekan') !== repository) throw new Error('Snapshot does not match selected repository');
    if ((snapshot.sourceName || 'github') !== selectedSource) throw new Error('Snapshot does not match selected source');
    fs.writeFileSync(path.join(logdir, 'source.json'), JSON.stringify(snapshotData));
  }
  catch (error) { report.sourceError = error.message; save(); throw error; }
  const archiveRecord = (status, detail) => { report.archive.push({ status, detail }); log(`[archive] ${status}: ${detail}`); save(false); };
  if (!args.includes('--skip-archive')) {
    try { await archiveSnapshot(snapshot, { root, apply, record: archiveRecord, downloadAsset, reconcileOnly: snapshotData.archiveComplete === true }); }
    catch (error) { archiveRecord('failed', error.message); }
  }
  log(`[archive] Summary: ${report.archive.filter(e => e.status === 'copied').length} added/updated; ${report.archive.filter(e => e.status === 'retired').length} renamed old; ${report.archive.filter(e => e.status === 'failed').length} failed.`);
  if (args.includes('--archive-only')) {
    report.finished = new Date().toISOString(); save();
    if (report.archive.some(e => e.status === 'failed')) process.exitCode = 1;
    return;
  }
  let archive = { assets: new Map(), sources: new Map() };
  try { archive = archivedAssets(root, snapshot.releases, selectedSource, repository); } catch (error) { archiveRecord('failed', error.message); }
  const decorateRelease = release => {
    release.sourceFiles = (archive.sources.get(release.tag_name) || []).map(({ local, ...file }) => {
      const id = `archive:${release.tag_name}:${file.name}`;
      archive.assets.set(id, local); return { ...file, id };
    });
    return release;
  };
  if (snapshot.releases instanceof DiskItems) snapshot.releases.decorate = decorateRelease;
  else for (const release of snapshot.releases) decorateRelease(release);
  const download = asset => archive.assets.get(asset.id) || downloadAsset(asset, temporary);
  for (const mirror of mirrors) {
    const entries = report.mirrors[mirror.name] = [];
    const record = (status, detail) => { entries.push({ status, detail }); log(`[${mirror.name}] ${status}: ${detail}`); save(false); };
    if (args.includes('--code')) {
      try {
        if (apply) {
          const populated=syncGit(mirror);
          if(populated===false) record('checked','Empty source Git repository: no branches or tags to push');
          else record('copied', 'Git branches and tags (preserving destination main merges; no forced updates or deletions)');
        } else record('planned', 'Git branches and tags');
      } catch (error) { record('failed', `Git: ${error.message}`); }
    }
    const adapter = mirror.name === 'sourceforge' ? new SourceForgeAdapter() : new ForgeAdapter(mirror.name);
    try { await syncIssues(adapter, snapshot, apply, record); }
    catch (error) { record('failed', `issue inventory/setup: ${error.message}`); }
    try {
      if (mirror.name === 'sourceforge') await sourceForgeReleases(snapshot, apply, download, record);
      else await syncReleases(adapter, snapshot, apply, download, record);
    } catch (error) { record('failed', `release inventory/setup: ${error.message}`); }
  }
  for (const [name, entries] of Object.entries(report.mirrors)) {
    log(`[${name}] Summary: ${entries.filter(e => e.status === 'copied').length} copied; ${entries.filter(e => e.status === 'planned').length} planned; ${entries.filter(e => ['failed', 'conflict'].includes(e.status)).length} failed/conflicts.`);
  }
  for (const limitation of report.limitations) log(`Scope: ${limitation}`);
  report.finished = new Date().toISOString(); save();
  if (report.archive.some(e => e.status === 'failed') || Object.values(report.mirrors).flat().some(e => ['failed', 'conflict'].includes(e.status))) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
