'use strict';

// Dependabot alerts #183-#187 (Go): the benchmark module of embedded engines
// (docs/Databases/FerretDB/1/SpeedTest/embedded, pure Go) pulled in
//   github.com/klauspost/compress <= 1.18.6   GHSA-259r-337f-4rfw  (s2 integer overflow, out-of-bounds write)
//   golang.org/x/net < 0.55.0                 GHSA-5cv4-jp36-h3mw  (HTML parser denial of service)
//   golang.org/x/net < 0.36.0 / < 0.38.0      GHSA-qxp5-gwg8-xv66, GHSA-vvgc-356p-c3xw (IPv6 zone ID proxy bypass, XSS)
//   github.com/golang/glog < 1.2.4            GHSA-6wxm-mpqj-6jpf  (insecure temporary file)
// through its key-value stores. govulncheck then listed more in the same modules,
// so the floors are the versions that report none: x/net 0.62.0, x/text 0.43.0 (which
// x/net 0.62.0 requires) and OpenTelemetry 1.42.0.
//
// The floors hold for EVERY go.mod in the repository, not only the one that was
// reported, so the same old version cannot return in another Go module.
//
// Run: node tests/goModuleFloors.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const FLOORS = {
  'github.com/klauspost/compress': '1.18.7',
  'golang.org/x/net': '0.62.0',
  'golang.org/x/text': '0.43.0',
  'github.com/golang/glog': '1.2.4',
  'go.opentelemetry.io/otel': '1.42.0',
};

function versionParts(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

// -1, 0 or 1; null for a version that is not a release number (a pseudo-version of a
// fork, say), which a floor cannot judge.
function compare(a, b) {
  const x = versionParts(a);
  const y = versionParts(b);
  if (!x || !y) return null;
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}

// The modules a go.mod requires, with their versions: single-line and block form.
function requires(text) {
  const out = [];
  let inBlock = false;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\/\/.*$/, '').trim();
    if (/^require\s*\($/.test(line)) { inBlock = true; continue; }
    if (inBlock && line === ')') { inBlock = false; continue; }
    const m = inBlock ? /^(\S+)\s+(\S+)$/.exec(line) : /^require\s+(\S+)\s+(\S+)$/.exec(line);
    if (m) out.push({ module: m[1], version: m[2] });
  }
  return out;
}

function violations(text) {
  return requires(text)
    .filter(r => FLOORS[r.module] && compare(r.version, FLOORS[r.module]) === -1)
    .map(r => `${r.module} ${r.version} is below ${FLOORS[r.module]}`);
}

function goModFiles(dir = '', out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    // node_modules, the ignored tool and build directories (dot or _build) are not ours.
    if (/^(node_modules|\.|_build)/.test(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) goModFiles(rel, out);
    else if (entry.name === 'go.mod') out.push(rel);
  }
  return out;
}

const files = goModFiles();
assert.ok(files.includes(path.join('docs', 'Databases', 'FerretDB', '1', 'SpeedTest', 'embedded', 'go.mod')), 'the reported module is found');

// 1. Every go.mod of the repository is at or above every floor.
for (const file of files) {
  assert.deepEqual(violations(fs.readFileSync(path.join(ROOT, file), 'utf8')), [], file);
}

// 2. The reported module requires the patched modules, not merely does not name old ones.
const reported = requires(fs.readFileSync(path.join(ROOT, 'docs/Databases/FerretDB/1/SpeedTest/embedded/go.mod'), 'utf8'));
for (const module of ['github.com/klauspost/compress', 'golang.org/x/net', 'github.com/golang/glog']) {
  const r = reported.find(x => x.module === module);
  assert.ok(r, `${module} is required`);
  assert.notEqual(compare(r.version, FLOORS[module]), -1, `${module} ${r.version}`);
}

// 3. Negative: the check does reject what the alerts named, in both forms of go.mod.
assert.deepEqual(violations('module m\n\nrequire (\n\tgithub.com/klauspost/compress v1.18.6 // indirect\n\tgolang.org/x/net v0.54.0\n)\n'), [
  'github.com/klauspost/compress v1.18.6 is below 1.18.7',
  'golang.org/x/net v0.54.0 is below 0.62.0',
]);
assert.deepEqual(violations('module m\nrequire github.com/golang/glog v1.0.0\n'), ['github.com/golang/glog v1.0.0 is below 1.2.4']);
assert.deepEqual(violations('module m\nrequire (\n\tgithub.com/klauspost/compress v1.18.7\n\tgolang.org/x/net v0.62.0\n\tgolang.org/x/text v0.43.0\n)\n'), []);
// A v0.0.0 pseudo-version (an old commit of a module) is below every floor; a
// version that is not a number at all cannot be judged.
assert.equal(compare('v0.0.0-20230626212559-97b1e661b5df', '0.62.0'), -1);
assert.equal(compare('latest', '0.62.0'), null);
assert.equal(compare('v1.18.7', '1.18.7'), 0);
assert.equal(compare('v1.18.10', '1.18.7'), 1, 'numeric, not lexical: 10 > 7');

console.log(`goModuleFloors: ${files.length} go.mod file(s) at or above every floor, and the check rejects the versions the alerts named`);
