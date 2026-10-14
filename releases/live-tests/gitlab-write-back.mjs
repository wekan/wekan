#!/usr/bin/env node
// Live test (#2698): List Sync's write-back against gitlab.com, with the same
// GitLab login releases/mirror.sh uses (glab). Human-run, from build.sh /
// build.bat → Tests → Live tests, or directly:
//
//   node releases/live-tests/gitlab-write-back.mjs
//
// It plans with WeKan's own write-back planner (models/lib/listSyncWriteBack.js)
// and sends the requests WeKan sends, the way server/lib/listSyncFetch.js
// gitlabWrite sends them, to ONE scratch issue in a private project of the
// signed-in account:
//
//   WEKAN_LIVE_GITLAB_PROJECT   the project (default <your username>/wekan-live-test,
//                               created private when it does not exist)
//   WEKAN_LIVE_GITLAB_URL       the GitLab (default https://gitlab.com)
//   GITLAB_TOKEN                a token instead of glab's (scope: api)
//
// The issue is deleted at the end (closed, when the account may not delete).
// Exit 0: passed, 1: failed, 2: skipped (no GitLab login here).
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const { planGitlabWriteBack, gitlabRequest, gitlabCardDescription } = require(path.join(ROOT, 'models/lib/listSyncWriteBack.js'));

const BASE = (process.env.WEKAN_LIVE_GITLAB_URL || 'https://gitlab.com').replace(/\/+$/, '');
const HOST = new URL(BASE).hostname;

// glab keeps the token in its config, or reports it with --show-token.
function glabToken() {
  const run = args => {
    try { return execFileSync('glab', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (error) { return `${error.stdout || ''}${error.stderr || ''}`; }
  };
  const configured = run(['config', 'get', 'token', '--host', HOST]).trim();
  if (/^[A-Za-z0-9_-]{20,}$/.test(configured)) return configured;
  const status = run(['auth', 'status', '--hostname', HOST, '--show-token']);
  const match = status.match(/Token:\s*([A-Za-z0-9_-]{20,})/);
  return match ? match[1] : '';
}

export default async function run({ log = console.log } = {}) {
  const token = process.env.GITLAB_TOKEN || glabToken();
  if (!token) {
    log(`SKIP gitlab-write-back: no GitLab login for ${HOST} (glab auth login, or GITLAB_TOKEN)`);
    return 'skipped';
  }
  const api = async (method, endpoint, body) => {
    const response = await fetch(`${BASE}/api/v4/${endpoint}`, {
      method, redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { 'PRIVATE-TOKEN': token, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    if (!response.ok) {
      const error = new Error(`${method} ${endpoint}: HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return text ? JSON.parse(text) : null;
  };
  const check = (ok, what) => {
    if (!ok) throw new Error(`FAILED: ${what}`);
    log(`  ok - ${what}`);
  };

  const me = await api('GET', 'user');
  const projectPath = process.env.WEKAN_LIVE_GITLAB_PROJECT || `${me.username}/wekan-live-test`;
  let project;
  try {
    project = await api('GET', `projects/${encodeURIComponent(projectPath)}`);
  } catch (error) {
    if (error.status !== 404 || process.env.WEKAN_LIVE_GITLAB_PROJECT) throw error;
    project = await api('POST', 'projects', { name: 'wekan-live-test', path: 'wekan-live-test', visibility: 'private',
      description: 'Scratch project for WeKan\'s live List Sync tests (releases/live-tests). Safe to delete.' });
    log(`  created private project ${project.path_with_namespace}`);
  }
  const projectId = encodeURIComponent(project.path_with_namespace);
  // As server/lib/listSyncFetch.js gitlabWrite: PUT or POST below the project.
  const write = (operation) => {
    const [method, rest, body] = gitlabRequest(operation);
    return api(method, `projects/${projectId}/${rest}`, body);
  };

  log(`gitlab-write-back: ${BASE}/${project.path_with_namespace}`);
  const stamp = new Date().toISOString();
  let issue = await api('POST', `projects/${projectId}/issues`, { title: `WeKan write-back live test ${stamp}`, description: 'Original text' });
  try {
    const since = new Date(Date.now() - 1000).toISOString();
    // The card List Sync made of it: the parser's description, and the
    // baseline both sides agreed on.
    const synced = { title: issue.title, description: gitlabCardDescription(issue, issue.description) };
    const card = { _id: 'live-card', syncExternalId: String(issue.iid), ...synced, archived: false, syncLastSource: { ...synced } };

    // Edited in WeKan, with a new comment.
    card.title = `${issue.title} (edited in WeKan)`;
    card.description = gitlabCardDescription(issue, 'Edited in WeKan');
    const comment = { _id: 'live-comment', cardId: card._id, text: `Comment from WeKan ${stamp}`, createdAt: new Date().toISOString() };
    let { operations } = planGitlabWriteBack({ issues: [issue], cards: [card], comments: [comment], since });
    check(operations.map(o => o.kind).join(',') === 'text,comment', 'an edit and a comment are planned');
    let note;
    for (const operation of operations) {
      const answer = await write(operation);
      if (operation.kind === 'comment') note = answer;
    }
    issue = await api('GET', `projects/${projectId}/issues/${issue.iid}`);
    check(issue.title === card.title, 'GitLab has the title edited in WeKan');
    check(issue.description === 'Edited in WeKan', 'GitLab has the description, without the footer Sync adds');
    const notes = await api('GET', `projects/${projectId}/issues/${issue.iid}/notes?per_page=100`);
    check(note && notes.some(n => n.id === note.id && n.body === comment.text), 'the comment is a note on the issue');

    // Nothing more to write once both agree (the executor records the new baseline).
    card.syncLastSource = { title: issue.title, description: gitlabCardDescription(issue, issue.description) };
    ({ operations } = planGitlabWriteBack({ issues: [issue], cards: [card], comments: [{ ...comment, syncCommentId: String(note.id) }], since }));
    check(operations.length === 0, 'a second run writes nothing');

    // Archived in WeKan: closed. Restored: reopened.
    ({ operations } = planGitlabWriteBack({ issues: [issue], cards: [{ ...card, archived: true, archivedAt: new Date().toISOString() }], since }));
    check(operations.length === 1 && operations[0].kind === 'close', 'archiving plans a close');
    await write(operations[0]);
    issue = await api('GET', `projects/${projectId}/issues/${issue.iid}`);
    check(issue.state === 'closed', 'GitLab closed the issue');
    ({ operations } = planGitlabWriteBack({ issues: [issue], cards: [{ ...card, archived: false, syncClosedByWeKan: true }], since }));
    check(operations.length === 1 && operations[0].kind === 'reopen', 'restoring plans a reopen');
    await write(operations[0]);
    issue = await api('GET', `projects/${projectId}/issues/${issue.iid}`);
    check(issue.state === 'opened', 'GitLab reopened the issue');

    // Negative: both sides changed - nothing is written.
    await api('PUT', `projects/${projectId}/issues/${issue.iid}`, { title: `${issue.title} (edited in GitLab)` });
    const remote = await api('GET', `projects/${projectId}/issues/${issue.iid}`);
    ({ operations } = planGitlabWriteBack({ issues: [remote], cards: [{ ...card, title: 'Edited in WeKan too' }], since }));
    check(operations.length === 0, 'a conflict is not written over');
  } finally {
    try {
      await api('DELETE', `projects/${projectId}/issues/${issue.iid}`);
      log('  cleaned up: the scratch issue is deleted');
    } catch (error) {
      await api('PUT', `projects/${projectId}/issues/${issue.iid}`, { state_event: 'close' }).catch(() => {});
      log(`  cleaned up: the scratch issue is closed (${error.message})`);
    }
  }
  log('PASS gitlab-write-back');
  return 'passed';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  run().then(result => process.exit(result === 'skipped' ? 2 : 0), error => { console.error(error.message || error); process.exit(1); });
}
