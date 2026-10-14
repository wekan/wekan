// The GitHub organization import: every repository of an organization (or a
// user), each as its own board, opened in Board View / Version Control
// (docs/Features/Board/Version-Control-View.md, "GitHub organization").
// What is imported and how is decided in models/lib/githubOrgImport.js,
// githubActionsRules.js and githubWiki.js; this runs the job.
//
// It runs AS the person who started it, through the same `importBoard`
// method as any import - its checks, its sanitizing, its attachment download
// through the SSRF guard - and every later write checks that person's rights
// on the board it made. Every GitHub request goes through the SSRF guard
// (server/lib/listSyncFetch.js) with sync's pagination checks and rate-limit
// handling. The token stays in this process's memory only.
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import Attachments from '/models/attachments';
import GithubImportJobs from '/models/githubImportJobs';
import { fetchGithubApi, fetchGithubApiPages, fetchGithubIssues } from '/server/lib/listSyncFetch';
import { fetchImportedAttachment } from '/models/lib/importAttachmentDownload';
import { readGithubWiki, writeWikiCards } from '/server/lib/githubWiki';
import { assertImportEnabled } from '/models/lib/importExportSecurity';

const { cleanOrgImport, selectRepos, releaseCards, RELEASES_LIST_TITLE } = require('/models/lib/githubOrgImport');
const { workflowToRules } = require('/models/lib/githubActionsRules');
const { defaultBoardViewModifier } = require('/models/lib/boardViewSettings');
const { labelColor } = require('/models/lib/listSyncIssueDetails');

const VCS_VIEW = 'board-view-version-control';
const MAX_RELEASE_FILES = 200;
const tokens = new Map(); // jobId -> token, never persisted
const running = new Set();

const asUser = (userId, fn) => DDP._CurrentMethodInvocation.withValue({ userId, isSimulation: false, connection: null }, fn);
const errorText = e => String((e && (e.reason || e.message)) || e).slice(0, 500);

async function listRepos(owner, token) {
  try {
    return await fetchGithubApiPages(`/orgs/${encodeURIComponent(owner)}/repos?type=all&per_page=100`, token);
  } catch (error) {
    // Not an organization: a user's repositories.
    if (error && error.status === 404) return fetchGithubApiPages(`/users/${encodeURIComponent(owner)}/repos?type=owner&per_page=100`, token);
    throw error;
  }
}

async function listFor(board, title) {
  const found = await Lists.findOneAsync({ boardId: board._id, title, archived: false });
  if (found) return found._id;
  const lists = await Lists.find({ boardId: board._id }, { fields: { sort: 1 } }).fetchAsync();
  return Lists.insertAsync({ title, boardId: board._id, archived: false, createdAt: new Date(),
    sort: lists.reduce((m, l) => Math.max(m, Number(l.sort) || 0), -1) + 1 });
}

async function importReleases({ board, owner, repo, token, userId, withFiles }) {
  const releases = releaseCards(await fetchGithubApiPages(`/repos/${owner}/${repo}/releases?per_page=100`, token));
  if (!releases.length) return { releases: 0, files: 0 };
  const listId = await listFor(board, RELEASES_LIST_TITLE);
  const swimlane = await board.getDefaultSwimlineAsync();
  let files = 0;
  for (let i = 0; i < releases.length; i += 1) {
    const r = releases[i];
    // eslint-disable-next-line no-await-in-loop
    const cardId = await Cards.insertAsync({ title: r.title, description: r.description, boardId: board._id, listId,
      swimlaneId: swimlane._id, userId, sort: i, cardNumber: await board.getNextCardNumber(),
      ...(r.receivedAt ? { receivedAt: new Date(r.receivedAt) } : {}) });
    if (!withFiles) continue;
    for (const asset of r.assets) {
      if (files >= MAX_RELEASE_FILES) break;
      try {
        // eslint-disable-next-line no-await-in-loop
        const downloaded = await fetchImportedAttachment(asset.url);
        if (downloaded.blocked) continue;
        // eslint-disable-next-line no-await-in-loop
        await Attachments.writeAsync(downloaded.buffer, { fileName: asset.name, type: downloaded.type || 'application/octet-stream',
          userId, meta: { boardId: board._id, cardId, source: 'import' } }, true);
        files += 1;
      } catch (e) { /* one file never stops the import */ }
    }
  }
  return { releases: releases.length, files };
}

// Label names of imported rules as this board's label ids, made when missing.
async function labelIdFor(board, name) {
  let fresh = await Boards.findOneAsync(board._id);
  let label = (fresh.labels || []).find(l => l.name === name);
  if (!label) {
    await fresh.addLabel(name, labelColor(name));
    fresh = await Boards.findOneAsync(board._id);
    label = (fresh.labels || []).find(l => l.name === name);
  }
  return label && label._id;
}

async function importActions({ board, owner, repo, token }) {
  let files;
  try {
    files = await fetchGithubApi(`/repos/${owner}/${repo}/contents/.github/workflows`, token);
  } catch (error) {
    if (error && error.status === 404) return { rules: 0, disabled: 0, unmapped: [] };
    throw error;
  }
  let rules = 0;
  let disabled = 0;
  const unmapped = [];
  for (const file of (Array.isArray(files) ? files : []).filter(f => f && f.type === 'file' && /\.ya?ml$/i.test(f.name)).slice(0, 100)) {
    // eslint-disable-next-line no-await-in-loop
    const content = await fetchGithubApi(`/repos/${owner}/${repo}/contents/.github/workflows/${encodeURIComponent(file.name)}`, token);
    const yaml = content && content.encoding === 'base64' ? Buffer.from(content.content || '', 'base64').toString('utf8') : '';
    const mapped = workflowToRules(file.name, yaml);
    unmapped.push(...mapped.unmapped);
    for (const rule of mapped.rules) {
      const save = async (part, Collection, desc) => {
        const doc = { ...part, boardId: board._id, desc };
        if (doc.labelName !== undefined) {
          // eslint-disable-next-line no-await-in-loop
          doc.labelId = await labelIdFor(board, doc.labelName);
          delete doc.labelName;
        }
        return Collection.insertAsync(doc);
      };
      const triggerParts = [rule.trigger, ...rule.extraTriggers];
      const actionParts = rule.actions;
      const describe = p => `GitHub Actions: ${p.activityType || p.actionType}${p.cron ? ` ${p.cron}` : ''}${p.listName && p.listName !== '*' ? ` ${p.listName}` : ''}${p.labelName ? ` ${p.labelName}` : ''}${p.commentText ? ` "${String(p.commentText).slice(0, 60)}"` : ''}`;
      const triggerIds = [];
      for (const t of triggerParts.slice(0, 11)) triggerIds.push(await save(t, Triggers, describe(t))); // eslint-disable-line no-await-in-loop
      const actionIds = [];
      for (const a of actionParts.slice(0, 11)) actionIds.push(await save(a, Actions, describe(a))); // eslint-disable-line no-await-in-loop
      // eslint-disable-next-line no-await-in-loop
      await Rules.insertAsync({
        title: `${repo}: ${rule.title}`.slice(0, 200), boardId: board._id,
        triggerId: triggerIds[0], actionId: actionIds[0],
        ...(triggerIds.length > 1 ? { extraTriggerIds: triggerIds.slice(1) } : {}),
        ...(actionIds.length > 1 ? { extraActionIds: actionIds.slice(1) } : {}),
        ...(triggerParts[0].activityType === 'button' ? { buttonType: 'board', buttonLabel: rule.title.slice(0, 60) } : {}),
        enabled: rule.enabled, description: rule.description,
      });
      rules += 1;
      if (!rule.enabled) disabled += 1;
    }
  }
  return { rules, disabled, unmapped: unmapped.slice(0, 200) };
}

async function importRepo(job, repo, token) {
  const { owner, parts } = job.options;
  const userId = job.userId;
  const result = { repo: repo.name };
  const raw = await fetchGithubIssues({ projectKey: `${owner}/${repo.name}`, issueDetails: true }, { token });
  const boardId = await Meteor.callAsync('importBoard', raw, {}, 'github', null);
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !board.hasAdmin(userId)) throw new Meteor.Error('not-authorized');
  result.boardId = boardId;
  result.issues = raw.filter(i => i && !i.pull_request).length;
  await Boards.updateAsync(boardId, { $set: {
    title: `${owner}/${repo.name}`,
    ...(repo.description ? { description: repo.description } : {}),
    ...defaultBoardViewModifier(board, VCS_VIEW, 'private'),
    ...defaultBoardViewModifier(board, VCS_VIEW, 'public'),
  } });
  const fresh = await ReactiveCache.getBoard(boardId);
  if (parts.includes('releases')) Object.assign(result, await importReleases({ board: fresh, owner, repo: repo.name, token, userId, withFiles: parts.includes('releaseFiles') }));
  if (parts.includes('actions')) Object.assign(result, await importActions({ board: fresh, owner, repo: repo.name, token }));
  if (parts.includes('wiki') && repo.hasWiki) {
    const pages = await readGithubWiki({ owner, repo: repo.name, token });
    const swimlane = await fresh.getDefaultSwimlineAsync();
    result.wikiPages = pages ? await writeWikiCards({ board: fresh, swimlaneId: swimlane._id, pages, userId,
      repoWikiUrl: `https://github.com/${owner}/${repo.name}/wiki` }) : 0;
  }
  return result;
}

async function runJob(jobId) {
  if (running.has(jobId)) return;
  running.add(jobId);
  try {
    let job = await GithubImportJobs.findOneAsync(jobId);
    const token = tokens.get(jobId) || '';
    await asUser(job.userId, async () => {
      if (!job.repos) {
        const repos = selectRepos(await listRepos(job.options.owner, token), job.options);
        await GithubImportJobs.updateAsync(jobId, { $set: { repos, total: repos.length, currentIndex: 0 } });
        job = await GithubImportJobs.findOneAsync(jobId);
      }
      for (let i = job.currentIndex || 0; i < job.repos.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const current = await GithubImportJobs.findOneAsync(jobId, { fields: { cancelRequested: 1 } });
        if (!current || current.cancelRequested) {
          await GithubImportJobs.updateAsync(jobId, { $set: { status: 'cancelled', finishedAt: new Date() } });
          return;
        }
        const repo = job.repos[i];
        let result;
        try {
          // eslint-disable-next-line no-await-in-loop
          result = { ...(await importRepo(job, repo, token)), success: true };
        } catch (error) {
          result = { repo: repo.name, success: false, error: errorText(error) };
          // A rate limit or a refused token stops the job; it can be started again.
          if (error && (error.rateLimited || error.status === 401)) {
            // eslint-disable-next-line no-await-in-loop
            await GithubImportJobs.updateAsync(jobId, { $set: { status: 'error', lastError: result.error, currentIndex: i },
              $push: { errorLog: `${repo.name}: ${result.error}` } });
            return;
          }
        }
        // eslint-disable-next-line no-await-in-loop
        await GithubImportJobs.updateAsync(jobId, { $set: { currentIndex: i + 1, updatedAt: new Date() },
          $push: { results: result, ...(result.success ? {} : { errorLog: `${repo.name}: ${result.error}` }),
            ...(result.boardId ? { createdBoardIds: result.boardId } : {}) } });
      }
      await GithubImportJobs.updateAsync(jobId, { $set: { status: 'done', finishedAt: new Date() } });
    });
  } catch (error) {
    await GithubImportJobs.updateAsync(jobId, { $set: { status: 'error', lastError: errorText(error) },
      $push: { errorLog: errorText(error) } });
  } finally {
    running.delete(jobId);
    tokens.delete(jobId);
  }
}

Meteor.methods({
  async githubOrgStartImport(input) {
    check(input, { owner: String, token: Match.Optional(String), parts: Match.Optional([String]),
      repos: Match.Optional([String]), includeForks: Match.Optional(Boolean), includeArchived: Match.Optional(Boolean) });
    if (!this.userId) throw new Meteor.Error('not-authorized');
    // Admin Panel / Features / Security: the switch that turns every import off.
    await assertImportEnabled();
    let options;
    try { options = cleanOrgImport(input); } catch (e) { throw new Meteor.Error(e.message); }
    if (await GithubImportJobs.findOneAsync({ userId: this.userId, status: 'running' })) throw new Meteor.Error('github-org-import-running');
    const jobId = await GithubImportJobs.insertAsync({ userId: this.userId, options, status: 'running', total: 0,
      currentIndex: 0, repos: null, results: [], errorLog: [], createdBoardIds: [], createdAt: new Date() });
    if (input.token) tokens.set(jobId, input.token);
    runJob(jobId).catch(() => {});
    return jobId;
  },
  // A paused job (a restart) or one stopped by a rate limit or a refused
  // token goes on from the repository it stopped at, with the token again.
  async githubOrgResumeImport(jobId, token) {
    check(jobId, String);
    check(token, Match.Optional(String));
    if (!this.userId) throw new Meteor.Error('not-authorized');
    await assertImportEnabled();
    const changed = await GithubImportJobs.updateAsync({ _id: jobId, userId: this.userId, status: { $in: ['paused', 'error'] } },
      { $set: { status: 'running', lastError: '' } });
    if (!changed) throw new Meteor.Error('not-found');
    if (token) tokens.set(jobId, token);
    runJob(jobId).catch(() => {});
  },
  async githubOrgCancelImport(jobId) {
    check(jobId, String);
    await GithubImportJobs.updateAsync({ _id: jobId, userId: this.userId }, { $set: { cancelRequested: true } });
  },
  async githubOrgClearImport(jobId) {
    check(jobId, String);
    await GithubImportJobs.removeAsync({ _id: jobId, userId: this.userId, status: { $ne: 'running' } });
  },
});

// A job that was running when the server stopped lost its token with it: it
// is paused, and its page offers to start it again.
Meteor.startup(async () => {
  try {
    await GithubImportJobs.updateAsync({ status: 'running' }, { $set: { status: 'paused' } }, { multi: true });
  } catch (e) { /* the collection is new; nothing to pause */ }
});
