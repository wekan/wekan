'use strict';

// Every image WeKan pushes carries full build provenance, and no build site
// quietly stops doing it.
//
// BuildKit attaches MINIMAL provenance on its own, which is why quay.io shows an
// `unknown on unknown` row beside each real platform - the OCI marker for "not a
// runnable image", so `docker pull` never selects it. Minimal is a build id and
// a timestamp. `mode=max` records what actually answers a supply-chain question:
// which commit, which base image, which build arguments.
//
// The hazard is not getting it wrong once - it is that WeKan pushes images from
// FOUR places, and a fifth added later would silently fall back to the default.
// So this checks every buildx/build-push-action call site in the repository,
// found by searching rather than from a list.
//
// Run: node tests/dockerProvenance.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Where images are built. Searched for, not listed, so a new one is found.
function buildSites() {
  const files = [];
  const walk = dir => {
    fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true }).forEach(e => {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) return;
      if (!/\.(ya?ml|sh)$/.test(e.name)) return;
      const src = read(rel);
      if (/buildx build|build-push-action/.test(src)) files.push(rel);
    });
  };
  walk('.github/workflows');
  walk('releases');
  return files;
}

// One entry per `docker buildx build` invocation: the whole command, joined.
function buildxCommands(src) {
  const out = [];
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    // The COMMAND, not a comment that mentions it.
    if (!/buildx build/.test(lines[i])) continue;
    if (/^\s*#/.test(lines[i])) continue;
    let cmd = lines[i];
    let j = i;
    while (/\\\s*$/.test(lines[j]) && j + 1 < lines.length) {
      j += 1;
      cmd += ' ' + lines[j].trim();
    }
    out.push(cmd);
  }
  return out;
}

test('every pushing buildx build asks for full provenance', () => {
  buildSites().forEach(file => {
    buildxCommands(read(file)).forEach(cmd => {
      // Only a build that PUSHES can carry an attestation. The local --load
      // build is a check, and the docker exporter cannot carry one at all.
      if (!/--push/.test(cmd)) return;
      assert.ok(/--provenance=mode=max/.test(cmd),
        `${file}: a pushing buildx build without --provenance=mode=max:\n    ${cmd.slice(0, 120)}`);
    });
  });
});

test('negative: the local --load build does NOT ask for it', () => {
  // The docker exporter cannot carry attestations; asking would fail the build.
  const cmds = buildxCommands(read('releases/docker-build.sh'));
  const load = cmds.filter(c => /--load/.test(c));
  assert.ok(load.length >= 1, 'the check build is still there');
  load.forEach(c => assert.ok(!/--provenance/.test(c),
    'the --load build must not ask for provenance'));
});

test('every build-push-action sets provenance: mode=max', () => {
  buildSites().filter(f => f.endsWith('.yml') || f.endsWith('.yaml')).forEach(file => {
    const src = read(file);
    if (!/build-push-action/.test(src)) return;
    assert.ok(/provenance:\s*mode=max/.test(src),
      `${file}: build-push-action without provenance: mode=max`);
  });
});

test('THE TRAP: no comment sits among a continued command\'s arguments', () => {
  // A `#` after a line continuation comments out the REST OF THE JOINED LINE, so
  //     docker buildx build \
  //       # explain the next flag
  //       --provenance=mode=max \
  //       --platform ... \
  // becomes `docker buildx build` with EVERY argument swallowed. `bash -n`
  // accepts it - it is valid syntax, just a different command - and this was
  // written exactly that way once before the test existed.
  // Every build site, not only .sh: a YAML `run:` block is a shell script, and
  // that is exactly where this was written the wrong way the first time.
  buildSites().forEach(file => {
    const lines = read(file).split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      if (!/\\\s*$/.test(lines[i])) continue;
      // A continuation INSIDE a comment is not a command: a comment block that
      // quotes a multi-line shell example ends its lines with `\` too, and every
      // line of it starts with `#`. Only a continued COMMAND can be broken this
      // way.
      if (/^\s*#/.test(lines[i])) continue;
      assert.ok(!/^\s*#/.test(lines[i + 1]),
        `${file}:${i + 2}: a comment after a line continuation swallows the rest of the command`);
    }
  });
});

test('the arguments really do survive the joined command', () => {
  // The property the trap above destroys, asserted directly: the pushing build
  // still carries its platforms and its tags.
  const cmd = buildxCommands(read('releases/docker-build.sh')).find(c => /--push/.test(c));
  assert.ok(cmd, 'the pushing build is found');
  assert.ok(/--platform linux\/amd64,linux\/arm64/.test(cmd), 'it still names its platforms');
  assert.ok(/-t wekanteam\/wekan:/.test(cmd), 'and its tags');
  assert.ok(/--provenance=mode=max/.test(cmd));
});

test('SBOM stays off, deliberately', () => {
  // It is opt-in, and it is not free: an SBOM enumerates every OS package and
  // npm dependency, so the attestation grows from ~10 KiB to megabytes per
  // platform. Turning it on is a decision, not a default to drift into - this
  // fails if one appears without the comment being revisited.
  buildSites().forEach(file => {
    const src = read(file);
    assert.ok(!/--sbom=true|sbom:\s*true/.test(src),
      `${file}: SBOM was enabled - see tests/dockerProvenance.test.cjs about the size`);
  });
});

test('all four pushing sites are found, so none is missed', () => {
  const sites = buildSites();
  const pushing = sites.reduce((n, f) => {
    const src = read(f);
    const buildx = buildxCommands(src).filter(c => /--push/.test(c)).length;
    const action = /build-push-action/.test(src) ? 1 : 0;
    return n + buildx + action;
  }, 0);
  assert.strictEqual(pushing, 4,
    `expected 4 pushing build sites, found ${pushing} - if that is a real change, ` +
    'give the new one --provenance=mode=max and update this count');
});

console.log(`\n${passed} tests passed`);
