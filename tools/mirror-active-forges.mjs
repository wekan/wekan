#!/usr/bin/env node
// Human-run synchronization. No third-party runtime dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync, spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = 'repos/wekan/wekan';
const encode = encodeURIComponent;
export const marker = url => `<!-- wekan-mirror:${url} -->`;
export const provenance = item => `Mirrored from ${item.html_url}.\nOriginal author: ${item.user?.login || item.author?.login || 'unknown'}; created: ${item.created_at || 'unknown'}.${item.milestone ? `\nMilestone: [${item.milestone.title}](${item.milestone.html_url}).` : ''}${item.assignees?.length ? `\nGitHub assignees: ${item.assignees.map(a => `[${a.login}](${a.html_url})`).join(', ')}.` : ''}`;
export const body = item => `${marker(item.html_url)}\n\n${item.body || ''}\n\n---\n${provenance(item)}`;
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
  const marked = String(text || '').match(/<!-- wekan-mirror:(https:\/\/github\.com\/wekan\/wekan\/[^\s>]+) -->/);
  if (marked) return marked[1];
  // Recognize the previous engine's footer; never deduplicate by title.
  return String(text || '').match(/Mirrored from (https:\/\/github\.com\/wekan\/wekan\/(?:issues|pull)\/\d+)/i)?.[1];
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
export function command(tool, args, input) {
  const p = spawnSync(tool, args, { cwd: root, input, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, shell: false, windowsHide: true });
  if (p.error || p.status !== 0) throw new Error(`${tool} failed: ${p.error?.message || p.stderr?.trim() || `exit ${p.status}`}`);
  return p.stdout;
}
function jsonCommand(tool, args, input) {
  const result = command(tool, args, input);
  return result.trim() ? JSON.parse(result) : {};
}
export function cliApi(kind, endpoint, method = 'GET', data) {
  if (kind === 'github') return jsonCommand('gh', ['api', '--method', method, ...(data ? ['--input', '-'] : []), endpoint], data && JSON.stringify(data));
  if (kind === 'gitlab') return jsonCommand('glab', ['api', '--hostname', 'gitlab.com', '--method', method, ...(data ? ['--input', '-'] : []), endpoint], data && JSON.stringify(data));
  return jsonCommand('tea', ['api', '--repo', 'https://codeberg.org/wekan/wekan', ...(process.env.WEKAN_CODEBERG_LOGIN ? ['--login', process.env.WEKAN_CODEBERG_LOGIN] : []), '--method', method, ...(data ? ['--data', '@-'] : []), endpoint], data && JSON.stringify(data));
}
export async function httpJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} at ${new URL(url).origin}${new URL(url).pathname}`);
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}
export async function sourceSnapshot(api = cliApi) {
  const get = endpoint => api('github', endpoint);
  const issues = await pages(get, `${source}/issues?state=all&sort=created&direction=asc`);
  const comments = await pages(get, `${source}/issues/comments?sort=created&direction=asc`);
  const pulls = await pages(get, `${source}/pulls?state=all&sort=created&direction=asc`);
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
      issue.body = `${issue.body || ''}\n\nPull request: ${pr.head?.label || '?'} → ${pr.base?.label || '?'}.\nMerged: ${Boolean(pr.merged_at)}.\nPatch: ${issue.pull_request.patch_url || `${issue.html_url}.patch`}`;
    }
    issue.commentsToMirror = (grouped.get(issue.number) || []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  }
  const releases = await pages(get, `${source}/releases`);
  for (const release of releases) release.assets = await pages(get, `${source}/releases/${release.id}/assets`);
  return { issues, releases, labels: await pages(get, `${source}/labels`), milestones: await pages(get, `${source}/milestones?state=all`), capturedAt: new Date().toISOString() };
}
const commentBody = c => `${c.path ? `Review comment at ${c.path}${c.line ? `:${c.line}` : ''}:\n\n` : ''}${body(c)}`;

export class ForgeAdapter {
  constructor(kind, api = cliApi, uploadMultipart = (endpoint, file) => jsonCommand('glab', ['api', '--hostname', 'gitlab.com', '--method', 'POST', '--form', `file=@${file}`, endpoint])) {
    this.kind = kind; this.api = api;
    this.uploadMultipart = uploadMultipart;
    this.base = kind === 'gitlab' ? 'projects/wekan%2Fwekan' : 'repos/wekan/wekan';
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
        if (apply && milestone.state === 'closed' && existing.state !== 'closed') await this.request(`milestones/${existing.id}`, this.kind === 'gitlab' ? 'PUT' : 'PATCH', this.kind === 'gitlab' ? { state_event: 'close' } : { state: 'closed' });
        continue;
      }
      const data = { title: milestone.title, description: `${milestone.description || ''}\n\n${marker(milestone.html_url)}\n${milestone.html_url}`, ...(milestone.due_on ? (this.kind === 'gitlab' ? { due_date: milestone.due_on.slice(0, 10) } : { due_on: milestone.due_on }) : {}) };
      const created = apply ? await this.request('milestones', 'POST', data) : { ...data, id: -1 };
      this.milestones.set(milestone.title, created);
      record(apply ? 'copied' : 'planned', `milestone ${milestone.title}`);
      if (apply && milestone.state === 'closed') await this.request(`milestones/${created.id}`, this.kind === 'gitlab' ? 'PUT' : 'PATCH', this.kind === 'gitlab' ? { state_event: 'close' } : { state: 'closed' });
    }
  }
  async issues() { return this.list('issues?state=all'); }
  id(issue) { return this.kind === 'gitlab' ? issue.iid : issue.number; }
  text(issue) { return this.kind === 'gitlab' ? issue.description : issue.body; }
  async create(issue) {
    const labels = (issue.labels || []).map(l => this.labels.get(l.name)).filter(Boolean);
    const milestone = issue.milestone && this.milestones.get(issue.milestone.title);
    const data = { title: `${issue.pull_request ? '[PR] ' : ''}${issue.title}`, ...(this.kind === 'gitlab' ? { description: body(issue), labels: labels.map(l => l.name).join(','), ...(milestone ? { milestone_id: milestone.id } : {}) } : { body: body(issue), labels: labels.map(l => l.id), ...(milestone ? { milestone: milestone.id } : {}) }) };
    return this.request('issues', 'POST', data);
  }
  async comments(issue) { return this.list(`issues/${this.id(issue)}/${this.kind === 'gitlab' ? 'notes' : 'comments'}`); }
  async addComment(issue, comment) { return this.request(`issues/${this.id(issue)}/${this.kind === 'gitlab' ? 'notes' : 'comments'}`, 'POST', { body: commentBody(comment) }); }
  async close(issue) { return this.request(`issues/${this.id(issue)}`, this.kind === 'gitlab' ? 'PUT' : 'PATCH', this.kind === 'gitlab' ? { state_event: 'close' } : { state: 'closed' }); }
  async releases() { return this.list('releases'); }
  releaseText(r) { return this.kind === 'gitlab' ? r.description : r.body; }
  async createRelease(release) {
    const text = `${body(release)}\n\nOriginal release assets:\n${(release.assets || []).map(a => `- [${a.name}](${a.browser_download_url})`).join('\n')}`;
    return this.request('releases', 'POST', this.kind === 'gitlab' ? { name: release.name || release.tag_name, tag_name: release.tag_name, description: text, released_at: release.published_at || release.created_at } : { name: release.name || release.tag_name, tag_name: release.tag_name, body: text, draft: Boolean(release.draft), prerelease: Boolean(release.prerelease), target_commitish: release.target_commitish });
  }
  async assets(release) {
    return this.kind === 'gitlab' ? this.list(`releases/${encode(release.tag_name)}/assets/links`) : this.list(`releases/${release.id}/assets`);
  }
  async assetAccess() {
    if (this.uploadToken === undefined) this.uploadToken = this.kind === 'gitlab' ? (process.env.GITLAB_TOKEN || process.env.GLAB_TOKEN || process.env.OAUTH_TOKEN || '') : (process.env.CODEBERG_TOKEN || process.env.GITEA_TOKEN || '');
    const token = this.uploadToken;
    if (!token && this.kind !== 'gitlab') throw new Error('Set CODEBERG_TOKEN or GITEA_TOKEN to copy Codeberg release binaries (tea login still handles metadata)');
    return token;
  }
  async uploadAsset(release, asset, file) {
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
      const url = uploaded.full_path ? `https://gitlab.com${uploaded.full_path}` : `https://gitlab.com/wekan/wekan${uploaded.url}`;
      await this.request(`releases/${encode(release.tag_name)}/assets/links`, 'POST', { name: asset.name, url, link_type: 'package' });
    }
  }
}

export class SourceForgeAdapter {
  constructor(request = httpJson) { this.http = request; this.base = 'https://sourceforge.net/rest/p/wekan'; }
  async request(endpoint, method = 'GET', data) {
    const token = process.env.SOURCEFORGE_TOKEN;
    if (method !== 'GET' && !token) throw new Error('Set SOURCEFORGE_TOKEN to a SourceForge OAuth bearer token to copy tracker data');
    return this.http(`${this.base}/${endpoint}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, ...(data ? { body: new URLSearchParams(data).toString() } : {}) });
  }
  async prepare(snapshot, apply, record = () => {}) {
    if (apply && !process.env.SOURCEFORGE_TOKEN) throw new Error('Set SOURCEFORGE_TOKEN to copy SourceForge tracker data');
    let project = await this.request('');
    const trackers = (project.tools || []).filter(t => t.name === 'tickets');
    const wanted = process.env.WEKAN_SOURCEFORGE_TRACKER;
    let tracker = wanted ? trackers.find(t => t.mount_point === wanted) : trackers.length === 1 ? trackers[0] : null;
    if (!trackers.length) {
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
  async addComment(issue, comment) { return this.request(`${this.tracker}/_discuss/thread/${encode(issue.threadId)}/new`, 'POST', { text: commentBody(comment) }); }
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

export async function syncIssues(adapter, snapshot, apply, record) {
  await adapter.prepare(snapshot, apply, record);
  const targets = await adapter.issues(); // A failed inventory must never mean empty.
  const existing = new Map();
  for (const target of targets) {
    const url = mirroredUrl(adapter.text(target));
    if (url && existing.has(url)) throw new Error(`Duplicate existing mirror identity ${url}; resolve before synchronization`);
    if (url) existing.set(url, target);
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
      if (issue.commentsToMirror?.length) {
        const comments = await adapter.comments(target);
        const urls = new Set(comments.map(c => mirroredUrl(c.body || c.text)).filter(Boolean));
        for (const comment of issue.commentsToMirror) {
          if (urls.has(comment.html_url)) continue;
          record('planned', `comment ${comment.html_url}`);
          if (apply) { await adapter.addComment(target, comment); urls.add(comment.html_url); record('copied', `comment ${comment.html_url}`); }
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
  if (!Number.isInteger(asset.id) || !Number.isSafeInteger(asset.size) || asset.size < 0) throw new Error('Invalid GitHub asset identity/size');
  const file = path.join(directory, `${asset.id}-${safeSegment(asset.name)}`);
  if (fs.existsSync(file) && fs.statSync(file).size === asset.size && (!asset.digest || await digestMatches(file, asset.digest))) return file;
  const part = `${file}.part`;
  const child = spawn('gh', ['api', `${source}/releases/assets/${asset.id}`, '--header', 'Accept: application/octet-stream'], { cwd: root, shell: false, windowsHide: true });
  let stderr = '';
  child.stderr.on('data', c => { stderr = (stderr + c).slice(-2000); });
  const exited = new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(`gh asset download failed: ${stderr || code}`))); });
  await Promise.all([pipeline(child.stdout, fs.createWriteStream(part)), exited]);
  if (fs.statSync(part).size !== asset.size || (asset.digest && !await digestMatches(part, asset.digest))) throw new Error(`Size/digest mismatch downloading ${asset.name}`);
  fs.renameSync(part, file); return file;
}
async function digestMatches(file, digest) {
  if (!/^sha256:[a-f0-9]{64}$/i.test(digest)) throw new Error(`Unsupported asset digest ${digest}`);
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return `sha256:${hash.digest('hex')}`.toLowerCase() === digest.toLowerCase();
}
export async function sourceForgeReleases(snapshot, apply, download, record, run = command, directory = path.join(root, '.tools/tmp/mirror-active')) {
  const user = process.env.WEKAN_SOURCEFORGE_USER || 'wekan';
  if (!/^[a-zA-Z0-9_-]+$/.test(user)) throw new Error('Invalid SourceForge SSH username');
  const remote = `${user}@frs.sourceforge.net`;
  for (const release of snapshot.releases) {
    const dir = `/home/frs/project/wekan/GitHub-releases/${safeSegment(release.tag_name)}`;
    try {
      if (release.draft) { record('unsupported', `SourceForge draft release ${release.tag_name}: kept private at GitHub`); continue; }
      if (!apply) { record('planned', `SourceForge release files ${release.tag_name}`); continue; }
      const listed = run('sftp', ['-oBatchMode=yes', '-oConnectTimeout=30', '-b', '-', remote], `-ls -1 "${dir}"
`);
      const names = new Set(listed.split(/\r?\n/).map(s => s.trim().split('/').pop()));
      const files = (release.assets || []).map(a => ({ asset: a, name: safeSegment(a.name) }));
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
          run('sftp', ['-oBatchMode=yes', '-oConnectTimeout=30', '-b', '-', remote], `-mkdir "/home/frs/project/wekan/GitHub-releases"\n-mkdir "${dir}"\nput "${local}" "${dir}/${f.name}.part"\nrename "${dir}/${f.name}.part" "${dir}/${f.name}"\n`);
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
    for (const mirror of activeMirrors(fs.readFileSync(path.join(root, 'releases/mirror.sh'), 'utf8'))) console.log(`${mirror.name}\t${mirror.url}`);
    return;
  }
  if (args.includes('--help')) {
    console.log('node tools/mirror-active-forges.mjs [--apply] [--code] [--target gitlab|codeberg|sourceforge]\nDefault: read-only preview. --apply copies missing issues/PR conversations, labels, milestones, releases and assets. --code also synchronizes GitHub branches/tags. Uses active calls in releases/mirror.sh. See docs/DeveloperDocs/Forge-Mirroring.md.'); return;
  }
  let target, snapshotFile, exportFile;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target') { target = args[++i]; if (!target) throw new Error('--target needs a mirror name'); }
    else if (args[i] === '--snapshot') { snapshotFile = args[++i]; if (!snapshotFile) throw new Error('--snapshot needs a filename'); }
    else if (args[i] === '--export-source') { exportFile = args[++i]; if (!exportFile) throw new Error('--export-source needs a filename'); }
    else if (!['--apply', '--code'].includes(args[i])) throw new Error(`Unknown argument ${args[i]}`);
  }
  if (exportFile) {
    if (snapshotFile || args.includes('--apply')) throw new Error('--export-source is read-only and cannot be combined with --apply or --snapshot');
    const snapshot = await sourceSnapshot();
    fs.mkdirSync(path.dirname(path.resolve(exportFile)), { recursive: true });
    fs.writeFileSync(exportFile, JSON.stringify(snapshot));
    console.log(`GitHub snapshot: ${snapshot.issues.length} issues/PRs, ${snapshot.releases.length} releases → ${exportFile}`);
    return;
  }
  const apply = args.includes('--apply');
  const mirrors = activeMirrors(fs.readFileSync(path.join(root, 'releases/mirror.sh'), 'utf8')).filter(m => !target || m.name === target);
  if (!mirrors.length) throw new Error(`Not an active mirror: ${target}`);
  const id = new Date().toISOString().replace(/[:.]/g, '-');
  const logdir = path.join(root, '.tools/log', `mirror-${id}`);
  const temporary = path.join(root, '.tools/tmp/mirror-active');
  fs.mkdirSync(logdir, { recursive: true }); fs.mkdirSync(temporary, { recursive: true });
  process.env.TMPDIR = temporary;
  if (process.platform === 'win32') { process.env.TMP = temporary; process.env.TEMP = temporary; }
  const report = { started: new Date().toISOString(), apply, source: 'https://github.com/wekan/wekan', mirrors: {}, limitations: ['PRs become linked issues; discussion and inline review comments are copied. Review approval summaries, reactions and votes are not copied. GitHub authors/timestamps are recorded as provenance.', 'Issue attachments and inline images retain original URLs; they are not downloaded.', 'Actions workflow files are mirrored with Git; execution logs, secrets and cross-forge executable CI configuration are not copied.', 'SourceForge release notes and binaries use File Release System directories, not native GitLab/Gitea release objects. SourceForge milestones remain in source issue provenance.', 'Projects and wiki are excluded. Draft releases are not published to destinations. Existing destination text is preserved; only missing items/comments/assets are copied.'] };
  const log = line => { console.log(line); fs.appendFileSync(path.join(logdir, 'status.txt'), `${line}\n`); };
  let lastSave = 0;
  const save = (force = true) => {
    if (!force && Date.now() - lastSave < 500) return;
    fs.writeFileSync(path.join(logdir, 'report.json'), JSON.stringify(report, null, 2) + '\n'); lastSave = Date.now();
  };
  log(`${apply ? 'APPLY' : 'PREVIEW'}: GitHub → ${mirrors.map(m => m.name).join(', ')}\nReport: ${logdir}`);
  let snapshot;
  try {
    snapshot = snapshotFile ? JSON.parse(fs.readFileSync(snapshotFile, 'utf8')) : await sourceSnapshot();
    if (!Array.isArray(snapshot.issues) || !Array.isArray(snapshot.releases) || !Array.isArray(snapshot.labels) || !Array.isArray(snapshot.milestones) || !snapshot.capturedAt) throw new Error('Invalid GitHub snapshot');
    fs.writeFileSync(path.join(logdir, 'github.json'), JSON.stringify(snapshot));
  }
  catch (error) { report.sourceError = error.message; save(); throw error; }
  const download = asset => downloadAsset(asset, temporary);
  for (const mirror of mirrors) {
    const entries = report.mirrors[mirror.name] = [];
    const record = (status, detail) => { entries.push({ status, detail }); log(`[${mirror.name}] ${status}: ${detail}`); save(false); };
    if (args.includes('--code')) {
      try {
        if (apply) {
          const gitdir = path.join(root, '.tools/wekan-github-mirror.git');
          if (!fs.existsSync(gitdir)) command('git', ['clone', '--mirror', 'https://github.com/wekan/wekan.git', gitdir]);
          else command('git', ['-C', gitdir, 'fetch', 'origin']);
          command('git', ['-C', gitdir, 'push', mirror.url, 'refs/heads/*:refs/heads/*', 'refs/tags/*:refs/tags/*']);
          record('copied', 'Git branches and tags (no forced updates or deletions)');
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
  if (Object.values(report.mirrors).flat().some(e => ['failed', 'conflict'].includes(e.status))) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
