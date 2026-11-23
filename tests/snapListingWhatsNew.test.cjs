// "What's new in WeKan v<version>" on the Snap Store pages of wekan,
// wekan-ondra and wekan-gantt-gpl.
//
// The store has no API for a revision's own changelog (the dashboard's "Add
// changelog" is a web form only), so the release's In short paragraph goes on
// the listing through `snapcraft upload-metadata`. Pins: the text
// (releases/snap-listing.mjs), what is sent (releases/snap-listing-update.sh,
// run here with fake curl, mksquashfs and snapcraft), and the workflow step.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bytes = s => Buffer.byteLength(s, 'utf8');
const load = () => import(path.join(ROOT, 'releases/snap-listing.mjs'));

const BIG = `# Status

# Upcoming WeKan ® release

**In short:** Not released yet.

# v13.30 2026-11-24 WeKan ® release

**In short:** The **wekan-ondra** and **wekan-gantt-gpl** snaps are published on
every architecture.

This release adds the following new features:

# v13.29 2026-11-23 WeKan ® release

**In short:** Older.
`;

test('What\'s new is the release\'s In short, on one line, with a link pinned to the tag', async () => {
  const m = await load();
  const { heading, inShort } = m.releaseSummary(BIG, '13.30');
  assert.equal(heading, 'v13.30 2026-11-24 WeKan ® release');
  const head = m.whatsNew('13.30', heading, inShort);
  assert.equal(head, "**What's new in WeKan v13.30:** The **wekan-ondra** and **wekan-gantt-gpl** snaps are published on every architecture. "
    + '[All changes](https://github.com/wekan/wekan/blob/v13.30/CHANGELOG-big.md#v1330-2026-11-24-wekan--release)');
});

test('negative: a version without a section, or a section without In short, is an error, not an empty What\'s new', async () => {
  const m = await load();
  assert.throws(() => m.releaseSummary(BIG, '13.31'), /no "# v13\.31/);
  assert.throws(() => m.releaseSummary(BIG.replace('**In short:** Older.', 'No summary.'), '13.29'), /no \*\*In short:\*\*/);
  assert.equal(m.releaseSummary(BIG, '13.29').inShort, 'Older.', 'Upcoming is never taken for a release');
});

test('a listing with room keeps its whole text after What\'s new', async () => {
  const m = await load();
  const base = read('releases/snap-listing/wekan-ondra.md');
  const d = m.composeDescription({ snapName: 'wekan-ondra', base, version: '13.30', heading: 'v13.30 2026-11-24 WeKan ® release', inShort: 'New.' });
  assert.ok(d.startsWith("**What's new in WeKan v13.30:** New. [All changes]("));
  assert.ok(d.endsWith(base.trimEnd()));
  assert.doesNotMatch(d, /More: /);
});

test('the wekan listing, 4047 bytes on its own, is cut at whole lines with a link to the whole text, and fits', async () => {
  const m = await load();
  const base = read('releases/snap-listing/wekan.md');
  assert.ok(bytes(base) > 4000, 'the case this was written for');
  const d = m.composeDescription({ snapName: 'wekan', base, version: '13.30', heading: 'v13.30 2026-11-24 WeKan ® release', inShort: 'x'.repeat(450) });
  assert.ok(bytes(d) <= m.DESCRIPTION_LIMIT, `${bytes(d)} bytes`);
  assert.ok(d.endsWith('\n\nMore: https://github.com/wekan/wekan/blob/main/releases/snap-listing/wekan.md'));
  const kept = d.slice(d.indexOf('\n\n') + 2, d.lastIndexOf('\n\nMore: '));
  assert.ok(base.startsWith(kept), 'what is kept is the start of the text, unchanged');
  assert.ok(base.slice(kept.length).startsWith('\n'), 'cut at a line end, never inside a line');
});

test('negative: What\'s new is never cut, and one too long alone is refused', async () => {
  const m = await load();
  const base = read('releases/snap-listing/wekan.md');
  const inShort = 'y'.repeat(3000);
  const d = m.composeDescription({ snapName: 'wekan', base, version: '13.30', heading: 'h', inShort });
  assert.ok(d.includes(inShort));
  assert.throws(() => m.composeDescription({ snapName: 'wekan', base, version: '13.30', heading: 'h', inShort: 'z'.repeat(4100) }), /shorten its \*\*In short:\*\*/);
});

test('the limit is counted in bytes: curly quotes cannot push a page over it', async () => {
  const m = await load();
  const base = '’'.repeat(1500);
  const d = m.composeDescription({ snapName: 'wekan-ondra', base: `${base}\n${base}`, version: '13.30', heading: 'h', inShort: 'New.' });
  assert.ok(bytes(d) <= 4096, `${bytes(d)} bytes`);
});

test('each snap has its listing text in the repository', () => {
  for (const name of ['wekan', 'wekan-ondra', 'wekan-gantt-gpl']) {
    const text = read(`releases/snap-listing/${name}.md`);
    assert.match(text, /kanban/i, name);
    assert.ok(bytes(text) <= 4096, `${name} on its own fits the store`);
  }
});

function runUpdate(name, { snapcraftFails = false, icon = true } = {}) {
  const dir = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'snaplisting-'));
  try {
    const bin = path.join(dir, 'bin');
    fs.mkdirSync(bin);
    const listing = { snap: { title: 'WeKan', summary: 'Open-Source kanban', license: 'MIT',
      media: icon ? [{ type: 'icon', url: 'https://dashboard.snapcraft.io/site_media/appmedia/icon.png' }, { type: 'screenshot', url: 'https://x/s.png' }] : [] } };
    fs.writeFileSync(path.join(dir, 'listing.json'), JSON.stringify(listing));
    fs.writeFileSync(path.join(bin, 'curl'), `#!/bin/bash
out=""; url=""
while [ $# -gt 0 ]; do case "$1" in -o) out=$2; shift ;; -H|--retry|--max-time) shift ;; -*) ;; *) url=$1 ;; esac; shift; done
echo "$url" >> "${dir}/curl.log"
case "$url" in
  https://api.snapcraft.io/v2/snaps/info/*) cat "${dir}/listing.json" ;;
  *icon.png) printf 'PNGDATA' > "$out" ;;
  *) exit 22 ;;
esac
`);
    fs.writeFileSync(path.join(bin, 'mksquashfs'), '#!/bin/bash\ntar -cf "$2" -C "$1" .\n');
    fs.writeFileSync(path.join(bin, 'snapcraft'), `#!/bin/bash
echo "$@" > "${dir}/snapcraft.args"
mkdir -p "${dir}/sent"; tar -xf "\${@: -1}" -C "${dir}/sent"
${snapcraftFails ? 'echo "403 Forbidden" >&2; exit 1' : 'exit 0'}
`);
    for (const f of ['curl', 'mksquashfs', 'snapcraft']) fs.chmodSync(path.join(bin, f), 0o755);
    fs.writeFileSync(path.join(dir, 'big.md'), BIG);
    const r = spawnSync('bash', [path.join(ROOT, 'releases/snap-listing-update.sh'), name, '13.30', path.join(dir, 'big.md')], {
      encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_STEP_SUMMARY: '' },
    });
    const sent = path.join(dir, 'sent', 'meta');
    return {
      status: r.status, out: r.stdout + r.stderr,
      args: fs.existsSync(path.join(dir, 'snapcraft.args')) ? fs.readFileSync(path.join(dir, 'snapcraft.args'), 'utf8').trim() : '',
      snapYaml: fs.existsSync(path.join(sent, 'snap.yaml')) ? yaml.load(fs.readFileSync(path.join(sent, 'snap.yaml'), 'utf8')) : null,
      icon: fs.existsSync(path.join(sent, 'gui', 'icon.png')) ? fs.readFileSync(path.join(sent, 'gui', 'icon.png'), 'utf8') : null,
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('the update sends the new description with the store\'s own title, summary, license and icon', () => {
  const r = runUpdate('wekan-gantt-gpl');
  assert.equal(r.status, 0, r.out);
  assert.match(r.args, /^upload-metadata --force \S+\/wekan-gantt-gpl_13\.30_listing\.snap$/);
  assert.equal(r.snapYaml.name, 'wekan-gantt-gpl');
  assert.equal(r.snapYaml.title, 'WeKan');
  assert.equal(r.snapYaml.summary, 'Open-Source kanban');
  assert.equal(r.snapYaml.license, 'MIT');
  assert.match(r.snapYaml.description, /^\*\*What's new in WeKan v13\.30:\*\* The \*\*wekan-ondra\*\*/);
  assert.ok(r.snapYaml.description.endsWith(read('releases/snap-listing/wekan-gantt-gpl.md').trimEnd()));
  assert.equal(r.icon, 'PNGDATA', 'the listing\'s icon is sent back, so upload-metadata does not replace or remove it');
});

test('negative: a store refusal is red and names SNAP_AUTH, and bad arguments are refused', () => {
  const r = runUpdate('wekan-ondra', { snapcraftFails: true });
  assert.notEqual(r.status, 0);
  assert.match(r.out, /did not take the wekan-ondra listing for v13\.30/);
  assert.match(r.out, /package_update/);
  for (const args of [['wekan-other', '13.30', 'x'], ['wekan', '13.30;rm', 'x'], ['wekan', 'latest', 'x']]) {
    const bad = spawnSync('bash', [path.join(ROOT, 'releases/snap-listing-update.sh'), ...args], { encoding: 'utf8' });
    assert.equal(bad.status, 2, args.join(' '));
  }
});

test('Push Snap to Store updates the page for the newest release only, after releasing, without failing the push', () => {
  const steps = yaml.load(read('.github/workflows/snap-store.yml')).jobs.push.steps;
  const at = steps.findIndex(s => /^Show what is new in /.test(s.name || ''));
  assert.ok(at > steps.findIndex(s => /^Release the newest /.test(s.name || '')), 'after the snaps are released');
  const step = steps[at];
  assert.equal(step['continue-on-error'], true);
  assert.equal(step.env.SNAPCRAFT_STORE_CREDENTIALS, '${{ secrets.SNAP_AUTH }}', 'the existing secret, no new one');
  assert.match(step.run, /if \[ "\$TAG" != "\$newest" \]; then[\s\S]*?exit 0/);
  assert.match(step.run, /contents\/CHANGELOG-big\.md\?ref=\$TAG/, 'the changelog of the released tag, not of main');
  assert.match(step.run, /bash releases\/snap-listing-update\.sh "\$SNAP" "\$\{TAG#v\}" changelog-big\.md/);
});
