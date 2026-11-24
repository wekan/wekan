'use strict';
// releases/sec/download_artifacthub_security.py against a stand-in Artifact
// Hub (ARTIFACTHUB_URL): the package and its WHOLE security report saved as
// Artifact Hub answers it, one file per image, and SUMMARY.md with the counts
// per image and every vulnerability, the most severe first. The GitHub
// download runs it for the wekan organization only, and --no-artifacthub
// skips it. Negative: a name or version that could be a path or a query never
// becomes one, a report Artifact Hub does not have is recorded with its
// reason, and an unknown package fails without writing a report.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const script = path.join(root, 'releases', 'sec', 'download_artifacthub_security.py');
const ghScript = path.join(root, 'releases', 'sec', 'download_github_security.py');
const wrapper = path.join(root, 'releases', 'sec', 'download-artifacthub-security.sh');
const python = (() => {
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    const p = path.join(dir, 'python3');
    if (dir && fs.existsSync(p)) return p;
  }
  return null;
})();

const ID = '3e365084-da75-4847-ba76-7fd8c3bb59ce';
const PACKAGE = {
  package_id: ID, name: 'wekan', version: '13.30.0',
  security_report_summary: { critical: 1, high: 1, medium: 0, low: 1, unknown: 0 },
  security_report_created_at: 1795556782,
  containers_images: [{ image: 'ghcr.io/wekan/wekan:v13.30' }, { image: 'ghcr.io/wekan/ferretdb:latest' }],
};
const REPORT = {
  'ghcr.io/wekan/wekan:v13.30': { Results: [
    { Target: 'ghcr.io/wekan/wekan:v13.30 (debian 13.8)', Class: 'os-pkgs', Vulnerabilities: [
      { VulnerabilityID: 'CVE-2026-1', PkgName: 'libc6', InstalledVersion: '2.41-12', Severity: 'LOW', Status: 'affected', Title: 'Low | one', PrimaryURL: 'https://avd.aquasec.com/nvd/cve-2026-1' }] },
    { Target: 'build/mongo-tools', Class: 'lang-pkgs', Vulnerabilities: [
      { VulnerabilityID: 'CVE-2026-2', PkgName: 'golang.org/x/net', InstalledVersion: 'v0.61.0', FixedVersion: '0.62.0', Severity: 'CRITICAL', Status: 'fixed', Title: 'Critical', PrimaryURL: 'javascript:alert(1)' }] }] },
  'ghcr.io/wekan/ferretdb:latest': { Results: [
    { Target: 'ferretdb', Class: 'lang-pkgs', Vulnerabilities: [
      { VulnerabilityID: 'CVE-2026-3', PkgName: 'stdlib', InstalledVersion: 'v1.27.3', FixedVersion: '1.27.4', Severity: 'HIGH', Status: 'fixed', Title: 'High' }] }] },
};

function serve(handler) {
  return new Promise(resolve => {
    const asked = [];
    const server = http.createServer((req, res) => {
      asked.push(req.url);
      const [status, body] = handler(req.url);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(typeof body === 'string' ? body : JSON.stringify(body));
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, asked, url: `http://127.0.0.1:${server.address().port}` }));
  });
}

const hub = url => {
  if (url === '/api/v1/packages/helm/wekan/wekan' || url === '/api/v1/packages/helm/wekan/wekan/13.30.0') return [200, PACKAGE];
  if (url === `/api/v1/packages/${ID}/13.30.0/security-report`) return [200, REPORT];
  if (url === '/api/v1/packages/helm/acme/noreport') return [200, { ...PACKAGE, package_id: '00000000-0000-0000-0000-000000000000' }];
  if (url === '/api/v1/packages/helm/acme/badid') return [200, { package_id: '../../x', version: '1' }];
  return [404, { message: 'not found' }];
};

function run(file, args, env) {
  return new Promise(resolve => {
    const child = spawn(python, ['-I', file, ...args], { env: { ...process.env, ...env } });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('close', status => resolve({ status, stdout, stderr }));
  });
}

const runDir = (out, ...parts) => {
  const base = path.join(out, '_artifacthub', ...parts);
  const stamps = fs.readdirSync(base);
  assert.equal(stamps.length, 1);
  assert.match(stamps[0], /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
  return path.join(base, stamps[0]);
};

test('the whole report, one file per image, and the summary', { skip: !python }, async () => {
  const { server, url } = await serve(hub);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahdl-'));
  try {
    const r = await run(script, ['--out', dir], { ARTIFACTHUB_URL: url });
    assert.equal(r.status, 0, r.stderr);
    const d = runDir(dir, 'helm', 'wekan', 'wekan');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(d, 'security-report.json'), 'utf8')), REPORT, 'the whole report, as answered');
    assert.equal(JSON.parse(fs.readFileSync(path.join(d, 'package.json'), 'utf8')).version, '13.30.0');
    assert.deepEqual(fs.readdirSync(path.join(d, 'images')).sort(), ['ghcr.io-wekan-ferretdb-latest.json', 'ghcr.io-wekan-wekan-v13.30.json']);
    const summary = fs.readFileSync(path.join(d, 'SUMMARY.md'), 'utf8');
    assert.match(summary, /\| 1 \| 1 \| 0 \| 1 \| 0 \|/);
    assert.match(summary, /\| ghcr\.io\/wekan\/wekan:v13\.30 \| build\/mongo-tools \| lang-pkgs \| 1 \| 0 \| 0 \| 0 \| 0 \|/);
    assert.match(summary, /## Vulnerabilities \(3\)/);
    const rows = summary.split('\n').filter(l => /^\| (CRITICAL|HIGH|LOW) /.test(l));
    assert.deepEqual(rows.map(l => l.split(' | ')[0]), ['| CRITICAL', '| HIGH', '| LOW'], 'the most severe first');
    assert.match(rows[0], /\| CVE-2026-2 \| golang\.org\/x\/net \| v0\.61\.0 \| 0\.62\.0 \| fixed \|/, 'a link that is not https is plain text');
    assert.match(rows[2], /\[CVE-2026-1\]\(https:\/\/avd\.aquasec\.com\/nvd\/cve-2026-1\)/);
    assert.match(rows[2], /Low \\\| one/, 'a table cell is escaped');
    // A version asked for by name.
    const v = path.join(dir, 'v');
    assert.equal((await run(script, ['helm/wekan/wekan', '--version', '13.30.0', '--out', v], { ARTIFACTHUB_URL: url })).status, 0);
    assert.ok(fs.existsSync(path.join(runDir(v, 'helm', 'wekan', 'wekan'), 'security-report.json')));
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('negative: a name or version that is not one, no report, an unknown package', { skip: !python }, async () => {
  const { server, url, asked } = await serve(hub);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahdl-'));
  try {
    for (const bad of [['../wekan/wekan'], ['helm/wekan'], ['helm/wekan/wekan/x'], ['helm/we kan/wekan'], ['helm/wekan/wekan', '--version', '../1'], ['helm/wekan/wekan', '--version', '1?x=1']]) {
      const r = await run(script, [...bad, '--out', dir], { ARTIFACTHUB_URL: url });
      assert.notEqual(r.status, 0, bad.join(' '));
      assert.ok(!fs.existsSync(path.join(dir, '_artifacthub')), `nothing written for ${bad.join(' ')}`);
    }
    assert.deepEqual(asked, [], 'nothing was asked for a refused name');
    // Artifact Hub has the package but no report: why, and no report file.
    const r = await run(script, ['helm/acme/noreport', '--out', dir], { ARTIFACTHUB_URL: url });
    assert.equal(r.status, 0, r.stderr);
    const d = runDir(dir, 'helm', 'acme', 'noreport');
    assert.match(fs.readFileSync(path.join(d, 'status.txt'), 'utf8'), /HTTP 404/);
    assert.ok(!fs.existsSync(path.join(d, 'security-report.json')));
    // An unknown package, and an answer whose id could be a path: an error.
    for (const name of ['helm/acme/missing', 'helm/acme/badid']) {
      const f = await run(script, [name, '--out', dir], { ARTIFACTHUB_URL: url });
      assert.equal(f.status, 1, name);
      assert.ok(!fs.existsSync(path.join(dir, '_artifacthub', 'helm', 'acme', name.split('/')[2])), name);
    }
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the GitHub download runs it for wekan, and --no-artifacthub skips it', { skip: !python }, async () => {
  const { server, url } = await serve(hub);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahdl-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  // A stand-in gh: signed in, an organization with one repository whose every
  // kind answers 404.
  fs.writeFileSync(path.join(bin, 'gh'), `#!${process.execPath}
const a = process.argv.slice(2);
if (a[0] === 'auth') process.exit(0);
const p = a[a.length - 1];
if (/^\\/orgs\\/[^/]+\\/repos/.test(p)) { process.stdout.write(JSON.stringify([{ name: 'app' }])); process.exit(0); }
process.stderr.write('gh: Not Found (HTTP 404)\\n'); process.exit(1);
`, { mode: 0o755 });
  const env = { ARTIFACTHUB_URL: url, PATH: [bin, path.dirname(python)].join(path.delimiter) };
  try {
    const on = path.join(dir, 'on');
    const r = await run(ghScript, ['wekan', '--out', on, '--builds', '0', '--no-advisories'], env);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(path.join(runDir(on, 'helm', 'wekan', 'wekan'), 'security-report.json')));
    // Same datetime as the GitHub download, so one run is one directory name.
    assert.equal(path.basename(runDir(on, 'helm', 'wekan', 'wekan')), fs.readdirSync(path.join(on, 'wekan', 'app'))[0]);
    const off = path.join(dir, 'off');
    assert.equal((await run(ghScript, ['wekan', '--out', off, '--builds', '0', '--no-advisories', '--no-artifacthub'], env)).status, 0);
    assert.ok(!fs.existsSync(path.join(off, '_artifacthub')));
    // Another organization gets none unless it names one.
    const other = path.join(dir, 'other');
    assert.equal((await run(ghScript, ['acme', '--out', other, '--builds', '0', '--no-advisories'], env)).status, 0);
    assert.ok(!fs.existsSync(path.join(other, '_artifacthub')));
    const named = path.join(dir, 'named');
    assert.equal((await run(ghScript, ['acme', '--out', named, '--builds', '0', '--no-advisories', '--artifacthub', 'helm/wekan/wekan'], env)).status, 0);
    assert.ok(fs.existsSync(path.join(named, '_artifacthub', 'helm', 'wekan', 'wekan')));
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the wrapper runs the script isolated, and the module is loaded by its path', () => {
  assert.match(fs.readFileSync(wrapper, 'utf8'), /exec python3 -I "\$here\/download_artifacthub_security\.py" "\$@"/);
  assert.ok(fs.statSync(wrapper).mode & 0o111, 'the wrapper is executable');
  const gh = fs.readFileSync(ghScript, 'utf8');
  assert.match(gh, /spec_from_file_location\(\s*"download_artifacthub_security",\s*os\.path\.join\(os\.path\.dirname\(os\.path\.abspath\(__file__\)\)/);
  assert.doesNotMatch(gh, /^import download_artifacthub_security|^from download_artifacthub_security/m, 'never imported by a name the current directory could answer');
  assert.match(fs.readFileSync(script, 'utf8'), /OUT_DIR = "_artifacthub"/);
});
