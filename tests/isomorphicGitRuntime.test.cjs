'use strict';

// The installed isomorphic-git, read the way server/lib/githubWiki.js reads a
// cloned wiki: git.log with a depth, git.readTree recursing into subtrees, and
// git.readBlob - on a repository made here with isomorphic-git itself, with
// two commits that change one page and add another. The clone needs GitHub;
// everything after it is what this pins. isomorphic-git went 1.42.4 -> 1.44.3.
// Run: node tests/isomorphicGitRuntime.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const git = require('isomorphic-git');

const ROOT = path.join(__dirname, '..');

(async () => {
  const src = fs.readFileSync(path.join(ROOT, 'server/lib/githubWiki.js'), 'utf8');
  for (const call of ['git.clone(', 'git.log(', 'git.readTree(', 'git.readBlob(']) {
    assert.ok(src.includes(call), `githubWiki.js no longer calls ${call}; update this test`);
  }
  assert.ok(/noCheckout: true/.test(src), 'the clone writes no working tree');

  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-isogit-'));
  const author = { name: 'Ann Example', email: 'ann@example.test' };
  try {
    await git.init({ fs, dir, defaultBranch: 'master' });
    fs.writeFileSync(path.join(dir, 'Home.md'), 'First home\n');
    await git.add({ fs, dir, filepath: 'Home.md' });
    await git.commit({ fs, dir, author: { ...author, timestamp: 1700000000, timezoneOffset: 0 }, message: 'Create Home\n' });
    fs.mkdirSync(path.join(dir, 'guides'));
    fs.writeFileSync(path.join(dir, 'Home.md'), 'Second home\n');
    fs.writeFileSync(path.join(dir, 'guides', 'Setup.md'), 'Setup page\n');
    await git.add({ fs, dir, filepath: 'Home.md' });
    await git.add({ fs, dir, filepath: 'guides/Setup.md' });
    await git.commit({ fs, dir, author: { ...author, timestamp: 1700000100, timezoneOffset: 0 }, message: 'Add Setup\n' });

    const commits = (await git.log({ fs, dir, depth: 200 })).reverse();
    assert.deepStrictEqual(commits.map(c => c.commit.message.trim()), ['Create Home', 'Add Setup']);
    assert.strictEqual(commits[0].commit.author.name, 'Ann Example');
    assert.strictEqual(commits[1].commit.author.timestamp, 1700000100);

    const files = async (oid, prefix = '') => {
      const { tree } = await git.readTree({ fs, dir, oid });
      const out = [];
      for (const node of tree) {
        const name = prefix ? `${prefix}/${node.path}` : node.path;
        if (node.type === 'tree') out.push(...await files(node.oid, name));
        else if (node.type === 'blob') out.push({ path: name, oid: node.oid });
      }
      return out;
    };
    const last = await files(commits[1].commit.tree);
    assert.deepStrictEqual(last.map(f => f.path).sort(), ['Home.md', 'guides/Setup.md']);
    const text = async f => Buffer.from((await git.readBlob({ fs, dir, oid: f.oid })).blob).toString('utf8');
    assert.strictEqual(await text(last.find(f => f.path === 'Home.md')), 'Second home\n');
    const first = await files(commits[0].commit.tree);
    assert.strictEqual(await text(first.find(f => f.path === 'Home.md')), 'First home\n');
    console.log('  ok - a wiki history reads back page by page, revision by revision');

    // Negative: an object that is not there is an error, not empty text.
    await assert.rejects(git.readBlob({ fs, dir, oid: '0'.repeat(40) }));
    console.log('  ok - a missing object is an error (negative)');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log('\n2 passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
