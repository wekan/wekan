#!/usr/bin/env node
'use strict';

// tools/forge-mirror.js
// -----------------------------------------------------------------------------
// Sync the things `git push --mirror` cannot carry when mirroring a repository
// between forges (GitHub -> GitLab / Codeberg / Forgejo / Gitea):
//
//   * issues          (open, optionally closed)
//   * pull requests   (best-effort: recreated as issues, see note below)
//   * CI workflows    (GitHub Actions YAML -> target-specific syntax)
//
// Only items that do NOT already exist at the target (matched by title) are
// created, so it is safe to re-run. Code history itself is mirrored by
// rebuild-wekan.sh / rebuild-wekan.bat with `git push --mirror`.
//
// It drives the *authenticated* forge CLIs (gh, glab, tea) instead of raw REST
// APIs, so authentication is whatever those tools already use:
//   gh   auth login          (GitHub, source)
//   glab auth login          (GitLab, target)
//   tea  login add           (Codeberg / Forgejo / Gitea, target)
//
// DRY RUN by default: it prints what it WOULD create. Pass --apply to actually
// create issues/PRs at the target. CI conversion always writes files (they are
// local and reversible), and prints a report.
//
// Usage:
//   node tools/forge-mirror.js \
//     --source-tool gh   --source-repo owner/name \
//     --target-tool tea  --target-repo owner/name --target-kind codeberg \
//     [--target-host git.example.com] \
//     [--issues] [--prs] [--actions] [--include-closed] [--apply]
//
// If no --issues/--prs/--actions flag is given, all three are done.
// -----------------------------------------------------------------------------

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---- argument parsing -------------------------------------------------------
const argv = process.argv.slice(2);
const opts = {
  sourceTool: 'gh',
  sourceRepo: '',
  sourceHost: '',
  targetTool: '',
  targetRepo: '',
  targetHost: '',
  targetKind: '', // gitlab | codeberg | forgejo | gitea
  issues: false,
  prs: false,
  actions: false,
  includeClosed: false,
  apply: false,
};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => argv[++i];
  switch (a) {
    case '--source-tool': opts.sourceTool = next(); break;
    case '--source-repo': opts.sourceRepo = next(); break;
    case '--source-host': opts.sourceHost = next(); break;
    case '--target-tool': opts.targetTool = next(); break;
    case '--target-repo': opts.targetRepo = next(); break;
    case '--target-host': opts.targetHost = next(); break;
    case '--target-kind': opts.targetKind = next(); break;
    case '--issues': opts.issues = true; break;
    case '--prs': opts.prs = true; break;
    case '--actions': opts.actions = true; break;
    case '--include-closed': opts.includeClosed = true; break;
    case '--apply': opts.apply = true; break;
    case '--help': case '-h': printHelpAndExit(); break;
    default: console.error(`Unknown argument: ${a}`); process.exit(2);
  }
}
// Default: do everything if no specific phase requested.
if (!opts.issues && !opts.prs && !opts.actions) {
  opts.issues = opts.prs = opts.actions = true;
}

function printHelpAndExit() {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n')
    .filter(l => l.startsWith('//')).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}

// ---- small helpers ----------------------------------------------------------
function have(cmd) {
  const probe = process.platform === 'win32' ? 'where' : 'command';
  const args = process.platform === 'win32' ? [cmd] : ['-v', cmd];
  const r = spawnSync(probe, args, { stdio: 'ignore', shell: process.platform === 'win32' });
  return r.status === 0;
}

function run(cmd, args, { allowFail = false } = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0 && !allowFail) {
    throw new Error(`Command failed (${r.status}): ${cmd} ${args.join(' ')}\n${r.stderr || ''}`);
  }
  return { ok: r.status === 0, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}

function tryJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

const DRY = !opts.apply;
const tag = DRY ? '[dry-run] would' : '[apply]';

// ---- source: list issues / PRs via gh --------------------------------------
function ghList(kind /* 'issue' | 'pr' */) {
  const state = opts.includeClosed ? 'all' : 'open';
  const fields = kind === 'pr'
    ? 'number,title,body,state,labels,url,headRefName'
    : 'number,title,body,state,labels,url';
  const r = run('gh', [kind, 'list', '--repo', opts.sourceRepo, '--state', state,
    '--limit', '1000', '--json', fields], { allowFail: true });
  if (!r.ok) {
    console.error(`  ! gh ${kind} list failed (is gh authenticated for ${opts.sourceRepo}?): ${r.stderr}`);
    return [];
  }
  return tryJson(r.stdout) || [];
}

// ---- target: existing issue titles (for de-duplication) --------------------
function targetExistingTitles() {
  const titles = new Set();
  if (opts.targetTool === 'glab') {
    // glab prints JSON with -F json on recent versions.
    const r = run('glab', ['issue', 'list', '-R', opts.targetRepo, '--all', '-F', 'json'],
      { allowFail: true });
    const data = r.ok ? tryJson(r.stdout) : null;
    if (Array.isArray(data)) data.forEach(it => it && it.title && titles.add(it.title.trim()));
    else console.error('  ! could not read existing GitLab issues for de-dup (will rely on title match only)');
  } else if (opts.targetTool === 'tea') {
    const r = run('tea', ['issues', 'ls', '--repo', opts.targetRepo, '--state', 'all',
      '--output', 'tsv', '--fields', 'index,title'], { allowFail: true });
    if (r.ok) {
      r.stdout.split('\n').forEach(line => {
        const cols = line.split('\t');
        if (cols.length >= 2) titles.add(cols.slice(1).join('\t').trim());
      });
    } else {
      console.error('  ! could not read existing Gitea/Forgejo issues for de-dup (will rely on title match only)');
    }
  }
  return titles;
}

// ---- target: create one issue ----------------------------------------------
function createIssue(title, body) {
  if (DRY) { console.log(`    ${tag} create issue: ${title}`); return true; }
  let r;
  if (opts.targetTool === 'glab') {
    r = run('glab', ['issue', 'create', '-R', opts.targetRepo, '--title', title,
      '--description', body, '--yes'], { allowFail: true });
  } else if (opts.targetTool === 'tea') {
    r = run('tea', ['issues', 'create', '--repo', opts.targetRepo, '--title', title,
      '--body', body], { allowFail: true });
  } else {
    console.error(`    ! no create-issue support for target tool ${opts.targetTool}`);
    return false;
  }
  if (!r.ok) { console.error(`    ! failed to create issue "${title}": ${r.stderr}`); return false; }
  console.log(`    + created issue: ${title}`);
  return true;
}

function footer(item) {
  return `\n\n---\n_Mirrored from ${item.url} (originally #${item.number})._`;
}

// ---- phase: issues ----------------------------------------------------------
function syncIssues() {
  console.log('\n== Issues ==');
  if (opts.sourceTool !== 'gh') {
    console.log(`  (automated issue sync implemented for GitHub source only; ` +
      `for ${opts.sourceTool} use 'forge' or git-bug bridges manually)`);
    return;
  }
  const src = ghList('issue').filter(it => !it.url || !/\/pull\//.test(it.url));
  const existing = targetExistingTitles();
  console.log(`  source issues: ${src.length}; target already has ${existing.size} titles`);
  let created = 0, skipped = 0;
  for (const it of src) {
    if (existing.has(it.title.trim())) { skipped++; continue; }
    if (createIssue(it.title, (it.body || '') + footer(it))) created++;
  }
  console.log(`  ${DRY ? 'would create' : 'created'}: ${created}, already present: ${skipped}`);
}

// ---- phase: PRs (best-effort: recreated as issues) -------------------------
function syncPrs() {
  console.log('\n== Pull requests ==');
  console.log('  NOTE: a PR is branch + review state, which cannot be faithfully recreated on');
  console.log('        another forge. Open PRs are recreated as ISSUES tagged [PR] with a link,');
  console.log('        so the discussion is not lost. Re-open the actual PR from the mirrored');
  console.log('        branch on the target when ready.');
  if (opts.sourceTool !== 'gh') { console.log('  (GitHub source only)'); return; }
  const src = ghList('pr');
  const existing = targetExistingTitles();
  let created = 0, skipped = 0;
  for (const pr of src) {
    const title = `[PR] ${pr.title}`;
    if (existing.has(title.trim())) { skipped++; continue; }
    const body = `${pr.body || ''}\n\nSource branch: \`${pr.headRefName || '?'}\`${footer(pr)}`;
    if (createIssue(title, body)) created++;
  }
  console.log(`  ${DRY ? 'would create' : 'created'}: ${created}, already present: ${skipped}`);
}

// ---- phase: CI workflow conversion -----------------------------------------
const GH_WF_DIR = path.join('.github', 'workflows');

function listWorkflows() {
  if (!fs.existsSync(GH_WF_DIR)) return [];
  return fs.readdirSync(GH_WF_DIR).filter(f => /\.ya?ml$/.test(f));
}

function convertActions() {
  console.log('\n== CI workflows ==');
  const files = listWorkflows();
  if (!files.length) { console.log(`  no workflows in ${GH_WF_DIR}`); return; }

  const kind = opts.targetKind ||
    ({ glab: 'gitlab', tea: 'forgejo' }[opts.targetTool]) || '';

  if (kind === 'gitlab') return convertActionsGitlab(files);
  return convertActionsForgejo(files); // codeberg / forgejo / gitea
}

// Forgejo/Gitea/Codeberg read .github/workflows directly ("familiarity, not
// compatibility"). We copy them into .forgejo/workflows/ and annotate the known
// incompatibilities inline so they are easy to find and fix.
function convertActionsForgejo(files) {
  const outDir = path.join('.forgejo', 'workflows');
  fs.mkdirSync(outDir, { recursive: true });
  let totalFlags = 0;
  for (const f of files) {
    const srcText = fs.readFileSync(path.join(GH_WF_DIR, f), 'utf8');
    const { text, flags } = annotateForgejo(srcText);
    fs.writeFileSync(path.join(outDir, f), text);
    totalFlags += flags.length;
    console.log(`  ${f}: ${flags.length ? flags.length + ' item(s) to review' : 'OK'}`);
    flags.forEach(fl => console.log(`      - ${fl}`));
  }
  console.log(`  -> wrote ${files.length} file(s) to ${outDir} with ${totalFlags} inline FORGEJO-COMPAT note(s).`);
  console.log('     Forgejo also reads .github/workflows directly; the annotated copy is for review.');
}

function annotateForgejo(text) {
  const flags = [];
  const out = text.split('\n').map(line => {
    const notes = [];
    if (/\bhashFiles\s*\(/.test(line)) {
      notes.push('hashFiles() is unsupported on Forgejo/Gitea (returns "") -> breaks cache keys; use a static key or go-hashfiles');
    }
    if (/^\s*permissions\s*:/.test(line)) notes.push('`permissions:` is ignored by Forgejo/Gitea');
    if (/^\s*continue-on-error\s*:/.test(line)) notes.push('`continue-on-error:` is ignored by Forgejo/Gitea');
    if (/^\s*runs-on\s*:.*[\[{].*(\$\{\{|,)/.test(line)) {
      notes.push('complex `runs-on:` expressions are unsupported; use a single label (runs-on: docker)');
    }
    if (notes.length) { flags.push(...notes); return `${line}  # FORGEJO-COMPAT: ${notes.join(' | ')}`; }
    return line;
  }).join('\n');
  const header =
    '# Converted from .github/workflows by tools/forge-mirror.js for Forgejo/Gitea/Codeberg.\n' +
    '# Forgejo Actions aims for FAMILIARITY, not full GitHub compatibility. Review every\n' +
    '# "# FORGEJO-COMPAT:" note below. Actions resolve via the mirror list at\n' +
    '# https://data.forgejo.org (or use a full URL in `uses:`). Runner images are minimal\n' +
    '# (Debian + Node) compared to GitHub\'s ubuntu image, so install extra tools yourself.\n\n';
  return { text: header + out, flags };
}

// GitLab CI is a genuinely different model; we cannot faithfully auto-translate
// marketplace `uses:` actions. Emit a scaffold + a guide pointing at GitLab's
// official converter skill.
function convertActionsGitlab(files) {
  const guide = 'CONVERT-TO-GITLAB.md';
  const jobs = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(GH_WF_DIR, f), 'utf8');
    (text.match(/^[ \t]{2,4}([A-Za-z0-9_-]+):\s*$/gm) || []).forEach(m => {
      const name = m.trim().replace(/:$/, '');
      if (!['steps', 'with', 'env', 'jobs', 'strategy', 'matrix'].includes(name)) jobs.push(`${f}:${name}`);
    });
  }
  const skeleton =
    '# Generated scaffold by tools/forge-mirror.js. GitLab CI is NOT GitHub-Actions\n' +
    '# compatible: marketplace `uses:` actions have no equivalent and become `script:`\n' +
    '# or `image:`. Use GitLab\'s official converter skill for a real translation:\n' +
    '#   https://about.gitlab.com/github-actions-to-gitlab-ci/\n' +
    '#   git clone https://gitlab.com/gitlab-org/ci-cd/github-actions-to-gitlab-ci\n\n' +
    'stages:\n  - build\n  - test\n\n' +
    jobs.map(j => `# TODO: translate ${j}`).join('\n') + '\n';
  if (!fs.existsSync('.gitlab-ci.yml')) {
    fs.writeFileSync('.gitlab-ci.yml', skeleton);
    console.log('  wrote .gitlab-ci.yml scaffold (TODOs per GitHub job)');
  } else {
    console.log('  .gitlab-ci.yml already exists; left untouched');
  }
  fs.writeFileSync(guide,
    '# Converting GitHub Actions to GitLab CI\n\n' +
    'GitLab CI uses a different model than GitHub Actions. The reliable path is\n' +
    "GitLab's official converter skill (runs inside Claude Code / Cursor / any MCP tool):\n\n" +
    '- https://about.gitlab.com/github-actions-to-gitlab-ci/\n' +
    '- https://gitlab.com/gitlab-org/ci-cd/github-actions-to-gitlab-ci\n' +
    '- Docs: https://docs.gitlab.com/ci/migration/github_actions/\n\n' +
    'Detected GitHub jobs to translate:\n\n' +
    jobs.map(j => `- ${j}`).join('\n') + '\n');
  console.log(`  wrote ${guide} with conversion guidance and the job list`);
}

// ---- main -------------------------------------------------------------------
function main() {
  if (!opts.sourceRepo || !opts.targetRepo || !opts.targetTool) {
    console.error('Missing required args. See --help.');
    process.exit(2);
  }
  console.log(`Mirror extras: ${opts.sourceTool}:${opts.sourceRepo} -> ${opts.targetTool}:${opts.targetRepo}` +
    `${opts.targetHost ? ' @ ' + opts.targetHost : ''}  (${DRY ? 'DRY RUN' : 'APPLY'})`);

  // CLI presence checks (only warn; phases skip gracefully).
  if ((opts.issues || opts.prs) && !have(opts.sourceTool)) {
    console.error(`! source CLI '${opts.sourceTool}' not found; install it (menu: Install forge CLI tools)`);
  }
  if ((opts.issues || opts.prs) && !have(opts.targetTool)) {
    console.error(`! target CLI '${opts.targetTool}' not found; install it (menu: Install forge CLI tools)`);
  }

  if (opts.issues) syncIssues();
  if (opts.prs) syncPrs();
  if (opts.actions) convertActions();

  console.log(`\nDone.${DRY ? ' (dry run — re-run with --apply to create issues/PRs)' : ''}`);
}

main();
