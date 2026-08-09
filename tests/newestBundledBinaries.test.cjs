'use strict';

// Every bundled binary is fetched as the NEWEST one, everywhere it is fetched.
//
// WeKan ships binaries other projects publish - FerretDB, the MongoDB Database
// Tools, Node.js - and fetches each from a release URL. There are many such
// URLs, across workflows, release scripts and compose files, and they must all
// agree: one that names a fixed version stops receiving security fixes silently,
// and nothing about the build fails when it does.
//
// That is not hypothetical. A Quay scan of the v10.77 image reported Go
// advisories - `stdlib 1.25.9` wanting 1.25.11, `golang.org/x/sys v0.38.0`
// wanting 0.44.0 - in the FerretDB binary baked into the bundle. The source was
// already fixed and v1.48.0 was already published carrying `go1.25.11` and
// `x/sys v0.46.0`; the image had simply captured an older `latest` at build
// time. Had any of these URLs been pinned instead, the rebuild would not have
// fixed it either.
//
// Run: node tests/newestBundledBinaries.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// The repositories WeKan takes binaries from. Node.js is deliberately absent:
// its version is RESOLVED per architecture by releases/resolve-node-source.sh,
// which is asked about the MAJOR and answers with that CPU's newest build from
// whichever of the three sources has one - a different mechanism with the same
// effect, and it has its own tests.
const UPSTREAM = ['wekan/FerretDB', 'wekan/mongo-tools-patches'];

// Files that fetch things. Searched for rather than listed.
function sourceFiles() {
  const out = [];
  const skip = new Set(['node_modules', '.git', '.tools', '.meteor', 'public']);
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const rel = dir === '.' ? e.name : `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (/\.(sh|ya?ml)$|^Dockerfile/.test(e.name)) out.push(rel);
    }
  };
  walk('.');
  return out;
}

// Every release URL for the upstreams above, with the file it came from.
function releaseUrls() {
  const found = [];
  sourceFiles().forEach(file => {
    const src = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    src.split('\n').forEach((line, i) => {
      UPSTREAM.forEach(repo => {
        const re = new RegExp(`${repo}/releases/([^"'\\s)]*)`, 'g');
        let m;
        while ((m = re.exec(line)) !== null) {
          found.push({ file, line: i + 1, repo, rest: m[1], text: line.trim() });
        }
      });
    });
  });
  return found;
}

test('there ARE such URLs, so this test is checking something', () => {
  const urls = releaseUrls();
  assert.ok(urls.length >= 5, `expected several release URLs, found ${urls.length}`);
});

test('every FerretDB and mongo-tools URL asks for the newest build', () => {
  releaseUrls().forEach(u => {
    // Three acceptable shapes:
    //   latest/download/<asset>   - the newest release's asset
    //   ${VAR}/...                - an override whose DEFAULT is latest, checked
    //                               separately below
    //   prose in a comment        - a link to the releases page, not a fetch
    // `latest/download/<asset>` is a fetch; a bare `latest` is the API
    // endpoint that ASKS which version latest is - which release-all.yml does
    // to record it in the provenance table. Both are the newest, neither pins.
    const isLatest = u.rest === 'latest' || u.rest.startsWith('latest/');
    const isOverridable = /^\$\{?\$?\{?[A-Z_]/.test(u.rest) || /\$\{?\$?\{?[A-Z_]+\}?/.test(u.rest);
    const isProse = u.text.trim().startsWith('#') || /^\)?[,.]?$/.test(u.rest);

    assert.ok(isLatest || isOverridable || isProse,
      `${u.file}:${u.line} fetches a FIXED version - it will stop getting ` +
      `security fixes and nothing will fail:\n    ${u.text.slice(0, 110)}`);
  });
});

test('the overridable one defaults to latest', () => {
  // docker-compose lets an operator pin a FerretDB for their own reasons
  // (FERRETDB_RELEASE=download/v1.24.2). The DEFAULT must still be newest, or
  // every operator who does not set it is silently frozen.
  const composes = sourceFiles().filter(f => /^docker-compose.*\.ya?ml$/.test(f));
  assert.ok(composes.length >= 1, 'the compose files are found');

  composes.forEach(file => {
    const src = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    if (!/FERRETDB_RELEASE/.test(src)) return;
    assert.ok(/FERRETDB_RELEASE:\s*\$\{FERRETDB_RELEASE:-latest\/download\}/.test(src),
      `${file}: FERRETDB_RELEASE must default to latest/download`);
  });
});

test('negative: no URL names a version number directly', () => {
  // The shape that would silently freeze a component: .../releases/download/v1.2.3/...
  releaseUrls().forEach(u => {
    if (u.text.trim().startsWith('#')) return;   // a comment may show an example
    assert.ok(!/^download\/v[0-9]/.test(u.rest),
      `${u.file}:${u.line} pins a version:\n    ${u.text.slice(0, 110)}`);
  });
});

test('Node.js is resolved per architecture, not fetched from a fixed URL', () => {
  // A different mechanism with the same effect: resolve-node-source.sh is asked
  // about the MAJOR and answers with that CPU's newest build from whichever of
  // nodejs.org, unofficial-builds or node-patches has one.
  const resolver = 'releases/resolve-node-source.sh';
  assert.ok(fs.existsSync(path.join(repoRoot, resolver)), `${resolver} exists`);
  const src = fs.readFileSync(path.join(repoRoot, resolver), 'utf8');
  assert.ok(/nodejs\.org/.test(src) && /unofficial-builds/.test(src) && /node-patches/.test(src),
    'it still knows all three sources');
});

test('the provenance table is what makes a `latest` build reproducible after the fact', () => {
  // `latest` means rebuilding an old release would embed a different FerretDB
  // than it shipped with. That is a deliberate trade - security fixes arrive
  // without a commit - and what makes it safe is that every release RECORDS the
  // versions and SHA256s it actually shipped.
  const rec = 'releases/record-provenance.sh';
  assert.ok(fs.existsSync(path.join(repoRoot, rec)),
    `${rec} must exist: it is what answers "which FerretDB did v10.77 ship?"`);
  const changelog = fs.readFileSync(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
  assert.ok(/\| Platform \| Binary \| From \| Version \| SHA256 \|/.test(changelog),
    'and the CHANGELOG carries the table it produces');
});

console.log(`\n${passed} tests passed`);
