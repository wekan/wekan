'use strict';

// The WeKan checkout is at a different place on each operating system
// (CLAUDE.md, AGENTS.md): ~/repos/wekan on Linux, ~/Documents/repos/wekan on
// macOS, Downloads\repos\wekan on Windows. The release scripts hard-coded
// Linux's ~/repos/wekan, so on a Mac they cd'd into nothing - or into a stale
// copy. They find the checkout from their own location now, which is right on
// every system. Downloads and release zips are in .tools/tmp, not ~/Downloads
// or the Finnish Linux ~/Lataukset (tests/toolsDirOnly.test.cjs).
// Run: node tests/repoLocationPerOs.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

function scripts() {
  const out = fs.readdirSync(root).filter(f => f.endsWith('.sh'));
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (/\.sh$/.test(e.name) || (dir === 'releases' && !path.extname(e.name))) out.push(rel);
    }
  };
  walk('releases');
  return out.filter(rel => fs.statSync(path.join(root, rel)).isFile());
}
// Code lines only: a comment may name where the checkout is on each system.
const code = src => src.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
// The VirtualBox appliance is a Linux VM with its own fixed /home/wekan layout.
const LINUX_VM = /^releases\/virtualbox\//;

test('CLAUDE.md and AGENTS.md name the checkout on each system', () => {
  for (const doc of ['CLAUDE.md', 'AGENTS.md']) {
    const s = read(doc);
    assert.match(s, /\| Linux \| `~\/repos\/wekan` \|/, doc);
    assert.match(s, /\| macOS \| `~\/Documents\/repos\/wekan` \|/, doc);
    assert.match(s, /\| Windows \| `Downloads\\repos\\wekan`/, doc);
  }
});

test('no script hard-codes one system\'s checkout path', () => {
  const offenders = scripts().filter(rel => !LINUX_VM.test(rel))
    .filter(rel => /(~|\$HOME|\$\{HOME\}|\/home\/[a-z]+|\/Users\/[a-z]+)\/(Documents\/)?repos(\/wekan)?\b/.test(code(read(rel))));
  assert.deepStrictEqual(offenders, []);
});

test('a script that needs the checkout finds it from its own location', () => {
  for (const rel of ['releases/release.sh', 'releases/release-bundle.sh', 'releases/release-snap.sh',
    'releases/release-sandstorm.sh', 'releases/node-update.sh', 'releases/up.sh', 'releases/rel.sh']) {
    assert.match(read(rel), /REPO_DIR="\$\(cd "\$\(dirname "\$\{BASH_SOURCE\[0\]\}"\)\/\.\." && pwd\)"/, rel);
  }
});

test('downloads go to .tools/tmp, not a folder in the home directory', () => {
  const offenders = scripts().filter(rel => /DOWNLOAD_DIR="\$\{DOWNLOAD_DIR:-[^}]*\$HOME/.test(read(rel)));
  assert.deepStrictEqual(offenders, []);
  assert.match(read('releases/version.sh'), /DOWNLOAD_DIR="\$\{DOWNLOAD_DIR:-\$WEKAN_DOWNLOADS\}"/);
});

test('negative: the pattern catches each system\'s hard-coded path', () => {
  const re = /(~|\$HOME|\$\{HOME\}|\/home\/[a-z]+|\/Users\/[a-z]+)\/(Documents\/)?repos(\/wekan)?\b/;
  for (const s of ['cd ~/repos/wekan', 'cd ~/repos', '$HOME/repos/wekan/build.sh', '/home/wekan/repos/wekan', '/Users/x/Documents/repos/wekan']) {
    assert.match(s, re, s);
  }
  for (const s of ['cd "$REPO_DIR"', 'https://github.com/wekan/repos', 'api/compat/github/repos/w']) assert.doesNotMatch(s, re, s);
});

console.log(`\n${passed} tests passed`);
