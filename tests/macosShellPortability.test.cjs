'use strict';

// The shell scripts at the repository root and under releases/ also run on
// macOS, started from zsh: /bin/bash there is 3.2, and the tools are BSD -
// no flock, a tar without --transform, a sed whose -i needs a suffix, no
// nproc, no `ip`, no stat -c, and before macOS 14 no sha256sum. Each was found
// failing on a macOS host (2026-10-27); this keeps them from coming back.
// Run: node tests/macosShellPortability.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

function shellScripts() {
  const out = fs.readdirSync(root).filter(f => f.endsWith('.sh'));
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(rel); continue; }
      if (entry.name.endsWith('.sh')) out.push(rel);
    }
  };
  walk('releases');
  return out.sort();
}
const scripts = shellScripts();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
// Code only: whole-line comments are prose and may name what they replaced.
const code = src => src.split('\n').map(l => (/^\s*#/.test(l) ? '' : l)).join('\n');
const runByBash = src => /^#!.*\bbash\b/.test(src.split('\n')[0]);
const offenders = (fn) => scripts.filter(rel => fn(code(read(rel)), read(rel)));

test('the scan sees the scripts', () => {
  assert.ok(scripts.length > 100, `only ${scripts.length} scripts`);
  assert.ok(scripts.includes('build.sh') && scripts.includes('releases/release-all.sh'));
});

test('bash scripts parse with bash 3.2, macOS /bin/bash', () => {
  const version = spawnSync('/bin/bash', ['-c', 'echo ${BASH_VERSINFO[0]}'], { encoding: 'utf8' });
  if (version.status !== 0 || version.stdout.trim() !== '3') {
    console.log('    (no bash 3 at /bin/bash here - the syntax pass runs on macOS)');
    return;
  }
  const failures = scripts.filter(rel => runByBash(read(rel)))
    .map(rel => [rel, spawnSync('/bin/bash', ['-n', path.join(root, rel)], { encoding: 'utf8' })])
    .filter(([, r]) => r.status !== 0).map(([rel, r]) => `${rel}: ${r.stderr.trim()}`);
  assert.deepStrictEqual(failures, []);
});

test('no bash 4 associative arrays, mapfile or readarray', () => {
  assert.deepStrictEqual(offenders((c, src) => runByBash(src)
    && /\b(declare|local|typeset) -A\b|\bmapfile\b|\breadarray\b/.test(c)), []);
});

test('flock only with a fallback, and no GNU tar --transform', () => {
  assert.deepStrictEqual(offenders(c => /(^|[\s;|&(])flock\b/m.test(c) && !/command -v flock/.test(c)), []);
  assert.deepStrictEqual(offenders(c => /\btar\b[^\n]*--transform/.test(c)), []);
});

test('sed -i always works on BSD sed: a suffix, or a Darwin wrapper', () => {
  // `sed -i -e` / `sed -i 's...'` is GNU only; -i.bak and -i '' are BSD. A
  // file may use the GNU form inside a wrapper that also has the BSD one.
  assert.deepStrictEqual(offenders(c => /\bsed -i(\s|$)(?!'')/m.test(c) && !/sed -i ''/.test(c)), []);
});

test('sha256sum, nproc and ip only with a macOS fallback', () => {
  assert.deepStrictEqual(offenders(c => /(^|[\s;|&($])sha256sum\b(?!\s*\(\))/m.test(c.replace(/\.sha256sum/g, ''))
    && !/command -v sha256sum|shasum -a 256/.test(c)), []);
  assert.deepStrictEqual(offenders(c => /\bnproc\b/.test(c) && !/sysctl -n hw\.ncpu|command -v nproc/.test(c)), []);
  assert.deepStrictEqual(offenders(c => /^\s*ip (address|addr|a)\b/m.test(c) && !/ifconfig/.test(c)), []);
});

test('/proc memory, load and command lines only with a macOS fallback', () => {
  // macOS and the BSDs have no /proc. db-conformance.sh read a run's command
  // line there, so on a Mac every live run looked dead and a second run
  // removed its containers. The Docker entrypoint only ever runs on Linux.
  const linuxOnly = new Set(['releases/ferretdb/wekan-entrypoint.sh']);
  assert.deepStrictEqual(offenders(c => /\/proc\/(meminfo|loadavg|\$[A-Za-z_{][^/]*\/cmdline)/.test(c)
    && !/sysctl -n|ps -o command=/.test(c)).filter(rel => !linuxOnly.has(rel)), []);
});

test('under set -e, a /proc read in $(...) has a fallback, or the script stops there', () => {
  // v12.66: start-wekan.sh read _memory_mb=$(awk ... /proc/meminfo) with no
  // `|| ...`. awk fails where there is no /proc, and under set -e an
  // assignment from a failed substitution ends the script without a word -
  // so the FreeBSD, OpenBSD and Mac app bundles never started WeKan.
  const setE = src => /^\s*set -[a-z]*e/m.test(src);
  const bare = c => c.split('\n').some(l => /=\$\(.*\/proc\//.test(l) && !/\|\|/.test(l));
  const scripts2 = [...scripts, ...['start-wekan.sh'].filter(f => !scripts.includes(f))];
  assert.deepStrictEqual(scripts2.filter(rel => setE(read(rel)) && bare(code(read(rel)))), []);
  // Negative: the v12.66 line is caught, the fixed one is not.
  assert.ok(bare("_memory_mb=$(awk '/^MemTotal:/{print int($2/1024)}' /proc/meminfo 2>/dev/null)"));
  assert.ok(!bare("_memory_mb=$(awk '/^MemTotal:/{print int($2/1024)}' /proc/meminfo 2>/dev/null || true)"));
});

test('start-wekan.sh finds the memory without /proc, under set -eu', () => {
  for (const rel of ['releases/ferretdb/start-wekan.sh', 'start-wekan.sh']) {
    const lines = read(rel).split('\n').filter(l => /_memory_mb=|\[ -n "\$_memory_mb" \]|\[ "\$_memory_mb" -gt 0 \]/.test(l)
      && !/^\s*#/.test(l) && !/_heap_mb|_go_mb|_m\b/.test(l));
    assert.ok(lines.length >= 3, `${rel}: the memory lines are found`);
    const body = lines.map(l => l.trim().replace('/proc/meminfo', '/nonexistent/meminfo')).join('\n');
    const r = spawnSync('bash', ['-c', `set -eu\n${body}\necho "mem=$_memory_mb"`], { encoding: 'utf8' });
    assert.strictEqual(r.status, 0, `${rel}: stopped without /proc: ${r.stderr}`);
    assert.match(r.stdout, /^mem=[1-9][0-9]*$/m, rel);
    // Negative: the v12.66 line, without its fallback, stops right there.
    const broken = body.replace(' || true)', ')');
    const b = spawnSync('bash', ['-c', `set -eu\n${broken}\necho "mem=$_memory_mb"`], { encoding: 'utf8' });
    assert.notStrictEqual(b.status, 0, `${rel}: the unguarded read is what stopped it`);
    assert.doesNotMatch(b.stdout, /mem=/);
  }
});

test('no GNU-only ln -T or stat -c', () => {
  assert.deepStrictEqual(offenders(c => /\bln -[a-zA-Z]*T\b|\bstat -c\b|\bstat --/.test(c)), []);
});

test('negative: each rule catches the shape it is for', () => {
  const cases = [
    ['declare -A X=()', /\b(declare|local|typeset) -A\b/],
    ['flock -n 9', /(^|[\s;|&(])flock\b/m],
    ['tar -czf a --transform "s,^,x/," .', /\btar\b[^\n]*--transform/],
    ["sed -i 's/a/b/' f", /\bsed -i(\s|$)(?!'')/m],
    ['ln -sfT a b', /\bln -[a-zA-Z]*T\b/],
    ['n=$(stat -c%s f)', /\bstat -c\b/],
  ];
  for (const [line, re] of cases) assert.match(line, re, line);
  assert.doesNotMatch("sed -i.bak 's/a/b/' f", /\bsed -i(\s|$)(?!'')/m);
  assert.doesNotMatch("sed -i '' 's/a/b/' f", /\bsed -i(\s|$)(?!'')/m);
});

console.log(`\n${passed} tests passed`);
