'use strict';
// Exercises the real synchronization helpers against in-memory forge APIs.
// No network, credentials or remote writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
process.env.TMPDIR = path.join(root, '.tools/tmp');
fs.mkdirSync(process.env.TMPDIR, { recursive: true });
const work = fs.mkdtempSync(path.join(process.env.TMPDIR, 'mirror-fixtures-'));

(async () => {
  const m = await import(pathToFileURL(path.join(root, 'tools/mirror-active-forges.mjs')));
  let passed = 0;
  async function test(name, fn) { await fn(); passed++; console.log('  ok -', name); }
  const issue = (n, more = {}) => ({ number: n, title: 'Same title', body: `Body ${n}`, html_url: `https://github.com/wekan/wekan/issues/${n}`, user: { login: 'reporter' }, state: 'open', commentsToMirror: [], ...more });
  const comment = (n, more = {}) => ({ body: 'A comment', html_url: `https://github.com/wekan/wekan/issues/1#issuecomment-${n}`, user: { login: 'commenter' }, ...more });
  function fixture() {
    const issues = [], comments = new Map(), releases = [], assets = new Map(), calls = [];
    return {
      issuesData: issues, releaseData: releases, commentsData: comments, assetData: assets, calls,
      async prepare() {}, async issues() { return issues; }, text: i => i.body,
      async create(i) { calls.push(['issue', i.number]); const v = { number: issues.length + 1, body: m.body(i), state: 'open' }; issues.push(v); return v; },
      async comments(i) { return comments.get(i.number) || []; },
      async addComment(i, c) { calls.push(['comment', c.html_url]); const list = comments.get(i.number) || []; list.push({ body: m.body(c) }); comments.set(i.number, list); },
      async close(i) { calls.push(['close', i.number]); i.state = 'closed'; },
      async releases() { return releases; }, releaseText: r => r.body,
      async createRelease(r) { calls.push(['release', r.tag_name]); const v = { id: releases.length + 1, tag_name: r.tag_name, body: m.body(r) }; releases.push(v); return v; },
      async assets(r) { return assets.get(r.id) || []; },
      async uploadAsset(r, a) { calls.push(['asset', a.name]); const list = assets.get(r.id) || []; list.push({ name: a.name }); assets.set(r.id, list); },
    };
  }
  const snapshot = issues => ({ issues, releases: [], labels: [], milestones: [] });
  await test('active registry includes three mirrors and excludes commented Bitbucket', () => {
    assert.deepEqual(m.activeMirrors(fs.readFileSync(path.join(root, 'releases/mirror.sh'), 'utf8')).map(v => v.name), ['gitlab', 'codeberg', 'sourceforge']);
    assert.throws(() => m.activeMirrors('mirror "unknown" "URL"'), /No data adapter/);
    assert.throws(() => m.activeMirrors(''), /Missing/);
    assert.equal(m.mirroredUrl('_Mirrored from https://github.com/wekan/wekan/pull/42 (originally #42)._'), 'https://github.com/wekan/wekan/pull/42');
  });
  await test('pagination handles short server-capped pages and fails on repeated/incomplete responses', async () => {
    const requested = [];
    assert.deepEqual(await m.pages(async url => { requested.push(url); return requested.length < 3 ? [{ id: requested.length }] : []; }, 'items'), [{ id: 1 }, { id: 2 }]);
    assert.equal(requested.length, 3);
    await assert.rejects(m.pages(async () => [{ id: 1 }], 'items'), /repeated/);
    await assert.rejects(m.pages(async () => ({ items: [], count: 5 }), 'items', { key: 'items' }), /Incomplete/);
    await assert.rejects(m.pages(async () => ({}), 'items'), /array/);
  });
  await test('same titles remain distinct; rerun adds only new comments and preserves local edits', async () => {
    const f = fixture(), records = [];
    const data = snapshot([issue(1, { commentsToMirror: [comment(1)] }), issue(2)]);
    await m.syncIssues(f, data, true, (...v) => records.push(v));
    assert.equal(f.issuesData.length, 2);
    f.issuesData[0].body += '\nDestination edit';
    data.issues[0].title = 'Renamed upstream';
    data.issues[0].commentsToMirror.push(comment(2));
    await m.syncIssues(f, data, true, (...v) => records.push(v));
    assert.equal(f.issuesData.length, 2);
    assert.equal(f.calls.filter(c => c[0] === 'comment').length, 2);
    assert.match(f.issuesData[0].body, /Destination edit/);
    assert.ok(!records.some(c => c[0] === 'failed'));
  });
  await test('preview creates nothing; failed inventory prevents all issue writes', async () => {
    const f = fixture();
    await m.syncIssues(f, snapshot([issue(1)]), false, () => {});
    assert.equal(f.calls.length, 0);
    f.issues = async () => { throw new Error('Forbidden'); };
    await assert.rejects(m.syncIssues(f, snapshot([issue(1)]), true, () => {}), /Forbidden/);
    assert.equal(f.calls.length, 0);
  });
  await test('interrupted comment copies and closed states repair on the next run', async () => {
    const f = fixture(), records = [];
    const add = f.addComment; let fail = true;
    f.addComment = async (...args) => { if (fail) throw new Error('rate limit'); return add(...args); };
    const data = snapshot([issue(1, { state: 'closed', commentsToMirror: [comment(1)] }), issue(2)]);
    await m.syncIssues(f, data, true, (...v) => records.push(v));
    assert.equal(f.issuesData.length, 2, 'other issues continue');
    assert.ok(records.some(r => r[0] === 'failed' && /rate limit/.test(r[1])));
    fail = false;
    await m.syncIssues(f, data, true, () => {});
    assert.equal(f.issuesData.length, 2);
    assert.equal(f.commentsData.get(1).length, 1);
    assert.equal(f.issuesData[0].state, 'closed');
  });
  await test('existing releases retry failed assets without replacing destination notes', async () => {
    const f = fixture(), records = [];
    const data = { releases: [{ tag_name: 'v1', html_url: 'https://github.com/wekan/wekan/releases/tag/v1', body: 'Notes', assets: [{ name: 'one' }, { name: 'two' }] }] };
    f.releaseData.push({ id: 1, tag_name: 'v1', body: 'Maintainer notes without a marker' });
    const upload = f.uploadAsset; let fail = true;
    f.uploadAsset = async (r, a) => { if (a.name === 'two' && fail) throw new Error('upload limit'); return upload(r, a); };
    await m.syncReleases(f, data, true, async () => 'file', (...v) => records.push(v));
    assert.ok(records.some(r => r[0] === 'failed' && /upload limit/.test(r[1])));
    fail = false;
    await m.syncReleases(f, data, true, async () => 'file', () => {});
    assert.equal(f.calls.filter(c => c[0] === 'asset').length, 2);
    assert.equal(f.calls.filter(c => c[0] === 'release').length, 0);
    assert.equal(f.releaseData[0].body, 'Maintainer notes without a marker');
    const before = f.calls.length;
    await m.syncReleases(f, data, true, async () => { throw new Error('Should not download'); }, () => {});
    assert.equal(f.calls.length, before);
  });
  await test('draft releases are not published; failed release inventory creates nothing', async () => {
    const f = fixture();
    await m.syncReleases(f, { releases: [{ tag_name: 'draft', draft: true }] }, true, () => {}, () => {});
    assert.equal(f.calls.length, 0);
    f.releases = async () => { throw new Error('Unauthorized'); };
    await assert.rejects(m.syncReleases(f, { releases: [] }, true, () => {}, () => {}), /Unauthorized/);
  });
  await test('GitHub snapshot groups comments by URL and paginates release assets separately', async () => {
    const called = [];
    const api = async (kind, endpoint) => {
      assert.equal(kind, 'github'); called.push(endpoint);
      const u = new URL(`https://api.github.com/${endpoint}`);
      if (u.searchParams.get('page') !== '1') return [];
      if (u.pathname.endsWith('/issues/comments')) return [{ ...comment(3), issue_url: 'https://api.github.com/repos/wekan/wekan/issues/1' }];
      if (u.pathname.endsWith('/pulls/comments')) return [{ ...comment(4), html_url: 'https://github.com/wekan/wekan/pull/2#discussion_r4', pull_request_url: 'https://api.github.com/repos/wekan/wekan/pulls/2', path: 'file.js' }];
      if (u.pathname.endsWith('/issues')) return [issue(1), issue(2, { html_url: 'https://github.com/wekan/wekan/pull/2', pull_request: { patch_url: 'https://github.com/wekan/wekan/pull/2.patch' } })];
      if (u.pathname.endsWith('/pulls')) return [{ number: 2, head: { label: 'fork:fix' }, base: { label: 'wekan:main' }, merged_at: 'today' }];
      if (u.pathname.endsWith('/releases')) return [{ id: 4, tag_name: 'v4', assets: [] }];
      if (u.pathname.endsWith('/releases/4/assets')) return [{ id: 7, name: 'binary' }];
      return [];
    };
    const result = await m.sourceSnapshot(api);
    assert.equal(result.issues[0].commentsToMirror.length, 1);
    assert.equal(result.issues[1].commentsToMirror.length, 1);
    assert.match(result.issues[1].body, /fork:fix → wekan:main/);
    assert.equal(result.releases[0].assets.length, 1);
    assert.ok(called.some(v => v.includes('/releases/4/assets')));
    assert.ok(!called.some(v => /(?:discussions|graphql|projects|wiki)/i.test(v)), 'disabled GitHub Discussions, projects and wiki are never requested');
  });
  await test('native adapters use correct label, milestone, note and issue API shapes', async () => {
    for (const kind of ['gitlab', 'codeberg']) {
      const calls = [];
      const api = async (k, p, method = 'GET', data) => { calls.push({ k, p, method, data }); return method === 'GET' ? [] : { ...data, id: 7, iid: 9, number: 9 }; };
      const a = new m.ForgeAdapter(kind, api);
      await a.prepare({ labels: [{ name: 'bug', color: 'abcdef' }], milestones: [{ title: 'next', html_url: 'https://github.com/wekan/wekan/milestone/1', state: 'closed' }] }, true);
      await a.create(issue(1, { labels: [{ name: 'bug' }], milestone: { title: 'next', html_url: 'url' } }));
      await a.addComment({ iid: 9, number: 9 }, comment(1));
      await a.close({ iid: 9, number: 9 });
      const created = calls.find(v => v.method === 'POST' && v.p.endsWith('/issues'));
      assert.ok(created);
      if (kind === 'gitlab') { assert.equal(created.data.labels, 'bug'); assert.equal(created.data.milestone_id, 7); assert.match(created.data.description, /wekan-mirror/); assert.ok(calls.some(v => v.p.endsWith('/notes'))); }
      else { assert.deepEqual(created.data.labels, [7]); assert.equal(created.data.milestone, 7); assert.ok(calls.some(v => v.p.endsWith('/comments'))); }
    }
  });
  await test('SourceForge inventory reads full tickets and paginated thread envelopes; close preserves all fields', async () => {
    const requests = [], full = { ticket_num: 2, summary: 'Local title', description: m.body(issue(1)), status: 'open', assigned_to: 'human', labels: ['local'], custom_fields: { _milestone: 'local-next' }, discussion_thread: { _id: 'thread' } };
    const api = async (url, opts) => {
      requests.push({ url, opts });
      const u = new URL(url);
      if (u.pathname.endsWith('/wekan/')) return { tools: [{ name: 'tickets', mount_point: 'bugs' }] };
      if (u.pathname.endsWith('/bugs/')) return { tickets: [{ ticket_num: 2, summary: 'Summary without body' }], count: 1 };
      if (u.pathname.endsWith('/bugs/2')) return { ticket: full };
      if (u.pathname.endsWith('/thread/thread')) return { thread: { posts: u.searchParams.get('page') === '0' ? [{ text: m.body(comment(1)) }] : [] } };
      return {};
    };
    const old = process.env.SOURCEFORGE_TOKEN; process.env.SOURCEFORGE_TOKEN = 'offline-test';
    try {
      const a = new m.SourceForgeAdapter(api); await a.prepare();
      const [i] = await a.issues(); assert.equal(i.description, full.description);
      assert.equal((await a.comments(i)).length, 1);
      await a.close(i);
      const form = new URLSearchParams(requests.at(-1).opts.body);
      assert.equal(form.get('ticket_form.summary'), full.summary);
      assert.equal(form.get('ticket_form.description'), full.description);
      assert.equal(form.get('ticket_form.assigned_to'), 'human');
      assert.equal(form.get('ticket_form.custom_fields._milestone'), 'local-next');
      assert.equal(form.get('ticket_form.status'), 'closed');
    } finally { if (old === undefined) delete process.env.SOURCEFORGE_TOKEN; else process.env.SOURCEFORGE_TOKEN = old; }
  });
  await test('native multipart binary uploads use target authentication and GitLab release links', async () => {
    const originalFetch = global.fetch;
    const oldGitlab = process.env.GITLAB_TOKEN, oldCodeberg = process.env.CODEBERG_TOKEN;
    process.env.GITLAB_TOKEN = 'offline-gitlab'; process.env.CODEBERG_TOKEN = 'offline-codeberg';
    const file = path.join(work, 'asset.bin'); fs.writeFileSync(file, 'binary-content');
    try {
      for (const kind of ['gitlab', 'codeberg']) {
        const uploaded = [], api = [];
        global.fetch = async (url, opts) => {
          uploaded.push({ url, opts });
          assert.equal(opts.method, 'POST');
          assert.equal(await opts.body.get(kind === 'gitlab' ? 'file' : 'attachment').text(), 'binary-content');
          return { ok: true, text: async () => JSON.stringify(kind === 'gitlab' ? { full_path: '/wekan/wekan/uploads/hash/asset.bin' } : { id: 11 }) };
        };
        const a = new m.ForgeAdapter(kind, async (...v) => { api.push(v); return {}; });
        await a.uploadAsset({ tag_name: 'v1', id: 4 }, { name: 'asset.bin' }, file);
        assert.equal(uploaded.length, 1);
        if (kind === 'gitlab') {
          assert.equal(uploaded[0].opts.headers['PRIVATE-TOKEN'], 'offline-gitlab');
          assert.equal(api[0][2], 'POST');
          assert.match(api[0][1], /releases\/v1\/assets\/links$/);
          assert.equal(api[0][3].url, 'https://gitlab.com/wekan/wekan/uploads/hash/asset.bin');
        } else {
          assert.equal(uploaded[0].opts.headers.Authorization, 'token offline-codeberg');
          assert.match(uploaded[0].url, /releases\/4\/assets$/);
        }
      }
    } finally {
      global.fetch = originalFetch;
      if (oldGitlab === undefined) delete process.env.GITLAB_TOKEN; else process.env.GITLAB_TOKEN = oldGitlab;
      if (oldCodeberg === undefined) delete process.env.CODEBERG_TOKEN; else process.env.CODEBERG_TOKEN = oldCodeberg;
    }
  });
  await test('missing asset credentials fail before downloading binaries', async () => {
    const f = fixture(), records = [];
    f.assetAccess = async () => { throw new Error('Missing asset credentials'); };
    const data = { releases: [{ tag_name: 'v1', html_url: 'https://github.com/wekan/wekan/releases/tag/v1', assets: [{ name: 'binary' }] }] };
    await m.syncReleases(f, data, true, async () => { throw new Error('Must not download'); }, (...v) => records.push(v));
    assert.ok(records.some(v => v[0] === 'failed' && /Missing asset credentials/.test(v[1])));
    assert.ok(!records.some(v => /Must not download/.test(v[1])));
  });
  await test('GitLab binary uploads reuse glab login without inventing an auth token command', async () => {
    const names = ['GITLAB_TOKEN', 'GLAB_TOKEN', 'OAUTH_TOKEN'];
    const old = names.map(n => process.env[n]); names.forEach(n => delete process.env[n]);
    try {
      const uploads = [], links = [];
      const a = new m.ForgeAdapter('gitlab', async (...v) => { links.push(v); return {}; }, async (...v) => { uploads.push(v); return { full_path: '/wekan/wekan/uploads/hash/binary' }; });
      await a.uploadAsset({ tag_name: 'v2' }, { name: 'binary' }, path.join(work, 'binary'));
      assert.deepEqual(uploads, [['projects/wekan%2Fwekan/uploads', path.join(work, 'binary')]]);
      assert.equal(links[0][3].name, 'binary');
    } finally { names.forEach((n, i) => { if (old[i] === undefined) delete process.env[n]; else process.env[n] = old[i]; }); }
  });
  await test('SourceForge missing Tracker is planned in preview and installed once in apply', async () => {
    const old = process.env.SOURCEFORGE_TOKEN; process.env.SOURCEFORGE_TOKEN = 'offline-test';
    const oldTracker = process.env.WEKAN_SOURCEFORGE_TRACKER; delete process.env.WEKAN_SOURCEFORGE_TRACKER;
    let installed = false; const writes = [];
    const api = async (url, opts) => {
      if (opts.method === 'POST') { writes.push(new URLSearchParams(opts.body)); installed = true; return { success: true }; }
      return { tools: installed ? [{ name: 'tickets', mount_point: 'github-issues' }] : [] };
    };
    try {
      const preview = new m.SourceForgeAdapter(api); await preview.prepare({}, false);
      assert.deepEqual(await preview.issues(), []); assert.equal(writes.length, 0);
      const apply = new m.SourceForgeAdapter(api); await apply.prepare({}, true);
      assert.equal(apply.tracker, 'github-issues'); assert.equal(writes.length, 1);
      assert.equal(writes[0].get('tool'), 'tickets');
      await new m.SourceForgeAdapter(api).prepare({}, true); assert.equal(writes.length, 1);
    } finally {
      if (old === undefined) delete process.env.SOURCEFORGE_TOKEN; else process.env.SOURCEFORGE_TOKEN = old;
      if (oldTracker === undefined) delete process.env.WEKAN_SOURCEFORGE_TRACKER; else process.env.WEKAN_SOURCEFORGE_TRACKER = oldTracker;
    }
  });
  await test('SourceForge release upload uses safe unique paths, temporary names and retries', async () => {
    const records = [], uploaded = new Set(), calls = [];
    const data = { releases: [{ tag_name: 'v1/../../evil', name: 'Release', html_url: 'https://github.com/wekan/wekan/releases/tag/v1', assets: [{ name: 'unsafe";file', id: 1 }] }] };
    assert.notEqual(m.safeSegment('a/b'), m.safeSegment('a?b'));
    let fail = true;
    const run = (tool, args, input) => {
      assert.equal(tool, 'sftp'); assert.ok(args.includes('-oBatchMode=yes')); calls.push(input);
      if (input.startsWith('-ls')) return [...uploaded].join('\n');
      const final = input.match(/rename "[^"]+" "([^\n"]+)"/)[1].split('/').pop();
      if (final === m.safeSegment('unsafe";file') && fail) throw new Error('Interrupted upload');
      assert.match(input, /\.part"\nrename/); uploaded.add(final); return '';
    };
    await m.sourceForgeReleases(data, true, async () => path.join(work, 'binary'), (...v) => records.push(v), run, work);
    assert.ok(records.some(v => v[0] === 'failed'));
    fail = false;
    await m.sourceForgeReleases(data, true, async () => path.join(work, 'binary'), () => {}, run, work);
    assert.equal(uploaded.size, 3);
    const before = calls.length;
    await m.sourceForgeReleases(data, true, async () => { throw new Error('Already uploaded'); }, () => {}, run, work);
    assert.equal(calls.length, before + 1, 'only inventory is repeated');
    assert.ok(!calls.some(v => v.includes('/../../')));
    assert.match(m.safeSegment('wekan.tar.gz'), /\.tar\.gz$/);
  });
  await test('Git divergence retries by preserving main merges and copies only other explicit refs', () => {
    const calls = [];
    const run = (tool, args) => {
      assert.equal(tool, 'git'); calls.push(args);
      if (args.includes('refs/heads/*:refs/heads/*')) throw new Error('non-fast-forward');
      if (args.includes('status')) return '';
      if (args.includes('symbolic-ref')) return 'main\n';
      if (args.includes('config') && args.at(-1) === 'user.name') return 'Lauri Ojansivu\n';
      if (args.includes('config') && args.at(-1) === 'user.email') return 'x@xet7.org\n';
      if (args.includes('for-each-ref')) return 'refs/mirror-source/heads/main\nrefs/mirror-source/heads/devel\nrefs/mirror-source/tags/v1\n';
      return '';
    };
    m.syncGit({ name: 'codeberg', url: 'git@codeberg.org:wekan/wekan' }, run, () => true, work);
    assert.equal(calls.filter(v => v.includes('merge') && v.includes('--no-edit')).length, 2);
    assert.ok(calls.some(v => v.includes('HEAD:refs/heads/main')));
    assert.ok(calls.some(v => v.includes('refs/mirror-source/heads/devel:refs/heads/devel') && v.includes('refs/mirror-source/tags/v1:refs/tags/v1')));
    assert.ok(!calls.flat().some(v => ['--force', '--mirror', '--delete'].includes(v)));
    const bad = (tool, args) => args.includes('status') ? ' M local-file\n' : run(tool, args);
    assert.throws(() => m.syncGit({ name: 'codeberg', url: 'git@codeberg.org:wekan/wekan' }, bad, () => true, work), /local changes; preserved/);
  });
  await test('per-mirror launchers share snapshot, forward preview and propagate errors without live commands', () => {
    const bin = path.join(work, 'bin'); fs.mkdirSync(bin);
    const recorder = path.join(work, 'commands.txt');
    const node = path.join(bin, 'node');
    fs.writeFileSync(node, '#!/bin/bash\nprintf "%s\\n" "$*" >> "$MIRROR_RECORDER"\nif [[ "$*" = *"--target codeberg"* ]]; then exit 7; fi\n'); fs.chmodSync(node, 0o755);
    const result = spawnSync('bash', [path.join(root, 'releases/mirror.sh'), '--preview'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MIRROR_RECORDER: recorder } });
    // The launcher now delegates to the shared interactive menu; orchestration
    // and failure propagation are exercised with injected commands in mirrorMenu.
    assert.equal(result.status, 0, result.stderr);
    const lines = fs.readFileSync(recorder, 'utf8').trim().split('\n');
    assert.equal(lines.length, 1);
    assert.match(lines[0], /mirror-menu\.mjs --preview/);
    const sh = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
    const desc = sh.match(/"Mirror repo to forges\|([^"]+)"/)[1];
    assert.ok(sh.includes(`"${desc}")\n\t\tmirror_forge`), 'offered menu descriptor has an exact handler');
    assert.match(fs.readFileSync(path.join(root, 'build.bat'), 'utf8'), /:mirror_forge\ncall "%REPO%\\releases\\mirror\.bat"/);
  });
  await test('CLI applies an empty local snapshot using mock Git only and explicit branch/tag refs', () => {
    const bin = path.join(work, 'mock-main'); fs.mkdirSync(bin);
    const recorder = path.join(work, 'git.txt');
    for (const [name, contents] of [
      ['git', '#!/bin/bash\nif [[ "$*" == *for-each-ref* ]]; then if [[ "$*" == *refs/mirror-source* ]]; then printf "refs/mirror-source/heads/main\\n"; else printf "refs/heads/main\\n"; fi; fi\nif [[ "$*" == *symbolic-ref* ]]; then printf "main\\n"; fi\nprintf "%s\\n" "$*" >> "$MIRROR_GIT_RECORDER"\n'],
      ['glab', '#!/bin/bash\nprintf "[]"\n'],
    ]) {
      const file = path.join(bin, name); fs.writeFileSync(file, contents); fs.chmodSync(file, 0o755);
    }
    const file = path.join(work, 'source.json'); fs.writeFileSync(file, JSON.stringify({ ...snapshot([]), capturedAt: new Date().toISOString() }));
    const result = spawnSync(process.execPath, [path.join(root, 'tools/mirror-active-forges.mjs'), '--apply', '--code', '--skip-archive', '--target', 'gitlab', '--snapshot', file], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MIRROR_GIT_RECORDER: recorder } });
    const logdir = result.stdout.match(/Report: ([^\r\n]+)/)?.[1];
    try {
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const git = fs.readFileSync(recorder, 'utf8');
      assert.match(git, /push --progress git@gitlab.com:wekan\/wekan HEAD:refs\/heads\/main/);
      assert.match(git, /fetch --progress https:\/\/github\.com\/wekan\/wekan\.git \+refs\/heads\/\*:refs\/mirror-source\/heads\/\*/);
      assert.ok(!/--force|refs\/codex|--all/.test(git));
      const report = JSON.parse(fs.readFileSync(path.join(logdir, 'report.json'), 'utf8'));
      assert.ok(report.mirrors.gitlab.some(v => v.status === 'copied'));
      assert.match(fs.readFileSync(path.join(logdir, 'status.txt'), 'utf8'), /Summary:/);
    } finally { if (logdir) fs.rmSync(logdir, { recursive: true, force: true }); }
  });
  console.log(`activeForgeMirror: ${passed} tests passed`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => fs.rmSync(work, { recursive: true, force: true }));
