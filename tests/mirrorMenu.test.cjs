'use strict';
// Exercise the actual menu with queued answers and injected forge commands.
// No network, credentials or remote writes are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const temporary = path.join(root, '.tools/tmp');
fs.mkdirSync(temporary, { recursive: true });
process.env.TMPDIR = temporary;
const work = fs.mkdtempSync(path.join(temporary, 'mirror-menu-tests-'));
(async () => {
  const m = await import(pathToFileURL(path.join(root, 'tools/mirror-menu.mjs')));
  const s = await import(pathToFileURL(path.join(root, 'tools/mirror-settings.mjs')));
  const engine = await import(pathToFileURL(path.join(root, 'tools/mirror-active-forges.mjs')));
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed++; console.log('  ok -', name); };
  await test('default settings persist; malformed, duplicate and self-mirroring settings fail', () => {
    const defaults = s.loadSettings(work);
    assert.deepEqual(defaults, { source: 'github', mirrors: ['gitlab', 'codeberg', 'sourceforge'] });
    s.saveSettings(work, defaults); assert.deepEqual(s.loadSettings(work), defaults);
    for (const text of ['source=github\nmirrors=gitlab', 'version=1\nsource=github\nsource=gitlab\nmirrors=', 'version=1\nsource=github\nmirrors=github', 'version=1\nsource=unknown\nmirrors=', 'version=1\nsource=github\nmirrors=gitlab,gitlab']) assert.throws(() => s.parseSettings(text));
    assert.deepEqual(m.changeSource(defaults, 'gitlab'), { source: 'gitlab', mirrors: ['codeberg', 'sourceforge', 'github'] });
  });
  await test('six-action menu changes and reloads settings, dispatches checks and sync, exits safely', async () => {
    const answers = ['bad', '2', '2', '3', '1,2', '4', '5', '1', '6'];
    const calls = [], output = [];
    await m.menu({ directory: work, ask: async () => answers.shift() ?? null, log: v => output.push(v), online: async v => calls.push(['online', v]), missing: async v => calls.push(['missing', v]), synchronize: async v => calls.push(['sync', v]) });
    assert.deepEqual(s.loadSettings(work), { source: 'gitlab', mirrors: ['github', 'codeberg'] });
    assert.deepEqual(calls.map(c => c[0]), ['online', 'missing', 'sync']);
    assert.ok(calls.every(c => c[1].source === 'gitlab'));
    assert.match(output.join('\n'), /5\. Check where data/);
    await m.menu({ directory: work, ask: async () => null, synchronize: async () => assert.fail('EOF must never sync'), log: () => {} });
  });
  await test('shared snapshot and per-target dispatch continue after failures; preview never applies', async () => {
    const settings = { source: 'gitlab', mirrors: ['github', 'codeberg', 'sourceforge'] };
    const calls = [];
    assert.equal(await m.sync(settings, { directory: work, preview: true, log: () => {}, run: (tool, args) => { calls.push([tool, args]); if (args.some(a => a.endsWith('mirror-codeberg.sh'))) throw new Error('fixture failure'); return ''; } }), false);
    assert.equal(calls.length, 5);
    assert.ok(calls.every(c => !c[1].includes('--apply')));
    assert.ok(calls[0][1].includes('--export-source'));
    assert.ok(calls[4][1][0].endsWith('mirror-sourceforge.sh'));
    const snapshots = calls.filter(c => c[1].includes('--snapshot')).map(c => c[1][c[1].indexOf('--snapshot') + 1]);
    assert.equal(new Set(snapshots).size, 1);
    await assert.rejects(m.sync({ source: 'github', mirrors: [] }, { directory: work }), /No active/);
    let invoked = 0;
    await assert.rejects(m.sync(settings, { directory: work, run: () => { invoked++; throw new Error('source offline'); } }), /source offline/);
    assert.equal(invoked, 1, 'failed source inventory stops before destination operations');
    const archiveFailure = [];
    assert.equal(await m.sync(settings, { directory: work, log: () => {}, run: (tool, args) => { archiveFailure.push(args); if (args.includes('--archive-only')) throw new Error('disk failure'); return ''; } }), false);
    assert.equal(archiveFailure.length, 5, 'archive failures are reported while every destination still runs');
  });
  await test('progress precedes asynchronous work and failures do not report success', async () => {
    const output = [];
    const ok = await m.sync({ source: 'github', mirrors: ['gitlab'] }, {
      directory: work, log: line => output.push(line),
      run: async (_, args) => {
        if (args.includes('--export-source')) assert.match(output.at(-1), /Reading source/);
        if (args.includes('--archive-only')) assert.match(output.at(-1), /Updating local archive/);
        if (args.some(a => a.endsWith('mirror-gitlab.sh'))) {
          assert.match(output.at(-1), /Syncing GitLab/);
          throw new Error('async fixture failure');
        }
        await Promise.resolve();
        return 'live fixture output';
      },
    });
    assert.equal(ok, false);
    assert.match(output.join('\n'), /async fixture failure/);
    assert.match(output.at(-1), /Finished with failures/);
    assert.ok(!output.includes('[mirror] Finished successfully'));
    const waiting = [];
    await m.sync({ source: 'github', mirrors: ['gitlab'] }, {
      directory: work, heartbeatMs: 5, log: line => waiting.push(line),
      run: async () => { await new Promise(resolve => setTimeout(resolve, 20)); return ''; },
    });
    assert.ok(waiting.some(line => /Still running this stage/.test(line)));
    const finishedLength = waiting.length;
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(waiting.length, finishedLength, 'heartbeat timers stop after commands finish');
    assert.equal(await m.streamCommand(process.execPath, ['-e', 'process.exit(0)']), '');
    await assert.rejects(m.streamCommand(process.execPath, ['-e', 'process.exit(7)']), /failed \(7\)/);
  });
  await test('shell launcher tees output and errors into timestamped logs and keeps failure status', () => {
    if (process.platform === 'win32') return;
    const { spawnSync } = require('node:child_process');
    const launcherRoot = path.join(work, 'launcher');
    fs.mkdirSync(path.join(launcherRoot, 'releases'), { recursive: true });
    fs.mkdirSync(path.join(launcherRoot, 'tools'), { recursive: true });
    fs.copyFileSync(path.join(root, 'releases/mirror.sh'), path.join(launcherRoot, 'releases/mirror.sh'));
    fs.writeFileSync(path.join(launcherRoot, 'tools/mirror-menu.mjs'), "console.log('stdout fixture'); console.error('stderr fixture'); process.exit(7);\n");
    const result = spawnSync('bash', [path.join(launcherRoot, 'releases/mirror.sh')], {
      encoding: 'utf8', env: { ...process.env, PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH}` },
    });
    assert.equal(result.status, 7);
    assert.match(result.stdout, /stdout fixture/);
    assert.match(result.stdout, /stderr fixture/);
    const logRoot = path.join(launcherRoot, '.tools/log/mirror');
    const directories = fs.readdirSync(logRoot);
    assert.equal(directories.length, 1);
    assert.match(directories[0], /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}_\d{2}$/);
    assert.equal(fs.readFileSync(path.join(logRoot, directories[0], 'mirror-log.txt'), 'utf8'), result.stdout);
  });
  await test('Windows dispatch quotes paths and uses each native batch wrapper', async () => {
    const calls = [];
    await m.sync({ source: 'gitlab', mirrors: ['github'] }, { platform: 'win32', directory: work, run: (tool, args) => { calls.push([tool, args]); return ''; }, log: () => {} });
    assert.equal(calls[2][0], 'cmd.exe');
    assert.match(calls[2][1][3], /call "[^\"]+mirror-github\.bat"/);
    assert.match(calls[2][1][3], /"--source" "gitlab"/);
  });
  await test('online checks continue after API failures using only HTTPS Git reads and API GETs', async () => {
    const calls = [], output = [];
    assert.equal(await m.checkOnline({ source: 'github', mirrors: ['gitlab', 'sourceforge'] }, { run: (tool, args) => { calls.push(args); return ''; }, api: async (kind, endpoint, method) => { assert.equal(method, undefined); if (kind === 'gitlab') throw new Error('authentication failed'); }, http: async () => ({}), log: line => output.push(line) }), false);
    assert.equal(calls.length, 3);
    assert.ok(calls.every(c => c[0] === 'ls-remote' && c[2].startsWith('https:')));
    assert.match(output.join('\n'), /authentication failed/);
    assert.match(output[2], /accessible/);
  });
  await test('missing Git compares ancestry and tag identities, never pushes', () => {
    const output = [], commands = [];
    m.checkGitMissing({ source: 'github', mirrors: ['gitlab'] }, { directory: work, log: line => output.push(line), run: (tool, args) => {
      commands.push(args); assert.ok(!args.includes('push'));
      if (args.includes('for-each-ref')) return 'refs/check/source/heads/main\nrefs/check/source/heads/new\nrefs/check/source/tags/v1\n';
      if (args.includes('--verify') && args.at(-1).endsWith('/new')) throw new Error('missing ref');
      if (args.includes('rev-list')) return '0\n';
      if (args.includes('rev-parse') && !args.includes('--verify')) return args.at(-1).includes('/source/') ? 'a\n' : 'b\n';
      return '';
    } });
    assert.match(output.join('\n'), /missing heads\/new/);
    assert.match(output.join('\n'), /different tag v1/);
    assert.ok(!output.some(line => /main:/.test(line)), 'destination merge contains all source main commits');
    assert.ok(commands.some(c => c.includes('--not')));
  });
  await test('GitLab and Codeberg source snapshots retain native metadata and canonical provenance', async () => {
    for (const kind of ['gitlab', 'codeberg']) {
      const native = `https://${kind === 'gitlab' ? 'gitlab.com' : 'codeberg.org'}/wekan/wekan/${kind === 'gitlab' ? '-/issues' : 'issues'}/7`;
      const text = `${engine.marker('https://github.com/wekan/wekan/issues/123')}\nBody`;
      const seen = [];
      const snap = await engine.selectedSnapshot(kind, async (_, endpoint, method) => {
        assert.equal(method, undefined); seen.push(endpoint);
        if (new URL(endpoint, 'https://fixture/').searchParams.get('page') !== '1') return [];
        if (/\/labels\?/.test(endpoint)) return [{ id: 2, name: 'bug', color: '#ff0000' }];
        if (/\/milestones\?/.test(endpoint)) return [{ id: 3, title: 'Next', web_url: 'https://gitlab.com/wekan/wekan/-/milestones/3' }];
        if (/\/issues\?/.test(endpoint)) return [{ iid: 7, number: 7, web_url: native, html_url: native, body: text, description: text, labels: ['bug'], author: { username: 'human' }, milestone: { title: 'Next' } }];
        if (/\/issues\/7\/(notes|comments)\?/.test(endpoint)) return [{ id: 9, body: 'Comment', author: { username: 'writer' }, html_url: `${native}#comment-9` }];
        return [];
      });
      assert.equal(snap.sourceName, kind); assert.equal(snap.issues.length, 1);
      assert.equal(snap.issues[0].html_url, 'https://github.com/wekan/wekan/issues/123');
      assert.equal(snap.issues[0].source_url, native); assert.equal(snap.issues[0].user.login, 'human');
      assert.equal(snap.issues[0].commentsToMirror.length, 1); assert.equal(snap.labels[0].color, 'ff0000');
      assert.ok(seen.some(e => /pulls|merge_requests/.test(e)));
    }
  });
  await test('switching source does not recreate an original native destination issue', async () => {
    let created = false;
    const url = 'https://github.com/wekan/wekan/issues/123';
    const adapter = { async prepare() {}, async issues() { return [{ html_url: url, body: 'original' }]; }, text: i => i.body, async create() { created = true; }, async comments() { return []; } };
    await engine.syncIssues(adapter, { issues: [{ html_url: url, body: 'mirrored', state: 'open' }] }, true, () => {});
    assert.equal(created, false);
    assert.equal(engine.mirroredUrl(engine.marker('https://sourceforge.net/projects/wekan/files/v1/')), 'https://sourceforge.net/projects/wekan/files/v1/');
  });
  await test('GitHub destination uses label names, milestone numbers and injected native asset uploads', async () => {
    const calls = [], uploads = [];
    const adapter = new engine.ForgeAdapter('github', async (kind, endpoint, method, data) => { calls.push({ kind, endpoint, method, data }); return { number: 8 }; }, undefined, async (...args) => uploads.push(args));
    adapter.labels.set('bug', { id: 50, name: 'bug' }); adapter.milestones.set('Next', { id: 70, number: 3 });
    await adapter.create({ html_url: 'https://gitlab.com/wekan/wekan/-/issues/7', title: 'Bug', labels: [{ name: 'bug' }], milestone: { title: 'Next' } });
    assert.deepEqual(calls[0].data.labels, ['bug']); assert.equal(calls[0].data.milestone, 3);
    await adapter.uploadAsset({ id: 8 }, { name: 'release.zip' }, '/fixture/file');
    assert.equal(uploads.length, 1); assert.equal(uploads[0][2], '/fixture/file');
    await adapter.createRelease({ tag_name: 'sourceforge-legacy', sourceMetadata: { syntheticRelease: true }, assets: [] });
    assert.equal(calls.at(-1).data.make_latest, 'false');
  });
  await test('SourceForge source inventories all leaf directories; malformed inventory fails', async () => {
    const adapter = { tracker: 'bugs', async prepare() {}, async issues() { return [{ ticket_num: 4, summary: 'Native ticket', description: 'Body' }]; }, isClosed: () => false, async comments() { return []; } };
    const snapshot = await engine.sourceForgeSnapshot(adapter, { directory: work, run: (_, args, input) => input.includes('/v1"') ? '-rw-r--r-- 1 user group 3 Sep 13 12:00 file.zip\n' : 'drwxr-xr-x 1 user group 0 Sep 13 12:00 v1\n' });
    assert.equal(snapshot.issues[0].number, 4); assert.equal(snapshot.releases.length, 1);
    assert.equal(snapshot.releases[0].assets[0].size, 3); assert.equal(snapshot.releases[0].sourceMetadata.syntheticRelease, true);
    await assert.rejects(engine.sourceForgeSnapshot(adapter, { directory: work, run: () => 'unrecognized listing' }), /Unrecognized/);
  });
  console.log(`mirrorMenu: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => fs.rmSync(work, { recursive: true, force: true }));
