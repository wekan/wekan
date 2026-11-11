'use strict';
// releases/sec/download_github_security.py against a stand-in `gh`: every
// repository of the organization into .../<org>/<repo>/<datetime>/<kind>/, the
// pages of a paginated answer read as one list, an alert a file, the secret a
// secret scanning alert carries redacted unless asked for, a kind GitHub does
// not answer recorded with its reason, and archived repositories and forks
// skipped. Negative: a name that is not a GitHub name never becomes a path,
// and without gh, or signed out, nothing is written.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const script = path.join(root, 'releases', 'sec', 'download_github_security.py');
const wrapper = path.join(root, 'releases', 'sec', 'download-github-security.sh');
const python = (() => {
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    const p = path.join(dir, 'python3');
    if (dir && fs.existsSync(p)) return p;
  }
  return null;
})();

// The stand-in gh: `gh auth status` answers by FAKE_GH_AUTH, `gh api ... PATH`
// with the fixture for PATH; a page split in two shows --paginate's output.
const FAKE_GH = `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === 'auth') { process.exit(process.env.FAKE_GH_AUTH === 'out' ? 1 : 0); }
const p = args[args.length - 1];
const out = s => process.stdout.write(s);
if (p.startsWith('/orgs/acme/repos')) {
  out(JSON.stringify([{ name: 'app', archived: false, fork: false }, { name: 'old', archived: true, fork: false }]));
  out(JSON.stringify([{ name: 'tools', archived: false, fork: false }, { name: 'forked', archived: false, fork: true }]));
} else if (p.startsWith('/repos/acme/app/dependabot/alerts')) {
  out(JSON.stringify([{ number: 1, state: 'open', html_url: 'https://github.com/acme/app/security/dependabot/1',
    security_advisory: { severity: 'high', summary: 'Prototype pollution' },
    dependency: { package: { name: 'lodash' }, manifest_path: 'package-lock.json' } }]));
  out(JSON.stringify([{ number: 2, state: 'fixed', security_advisory: { severity: 'low', summary: 'Old' }, dependency: {} }]));
} else if (p.startsWith('/repos/acme/app/code-scanning/alerts/7/instances')) {
  out(JSON.stringify([{ ref: 'refs/heads/main', location: { path: 'a.js', start_line: 3 } }]));
} else if (p.startsWith('/repos/acme/app/code-scanning/alerts')) {
  out(JSON.stringify([{ number: 7, state: 'open', html_url: 'https://github.com/acme/app/security/code-scanning/7',
    rule: { id: 'js/sql-injection', description: 'SQL injection', security_severity_level: 'critical' },
    most_recent_instance: { location: { path: 'a.js', start_line: 3 } } }]));
} else if (p.startsWith('/repos/acme/app/secret-scanning/alerts')) {
  out(JSON.stringify([{ number: 3, state: 'open', secret_type: 'github_pat', secret_type_display_name: 'GitHub Token',
    secret: 'ghp_SHOULDNOTBEWRITTEN0123456789' }]));
} else if (p.startsWith('/repos/acme/app/security-advisories')) {
  out(JSON.stringify([{ ghsa_id: 'GHSA-aaaa-bbbb-cccc', state: 'triage', severity: 'medium', summary: 'A report' }]));
} else if (p.startsWith('/repos/acme/tools/')) {
  process.stderr.write('gh: Not Found (HTTP 404)\\n'); process.exit(1);
} else {
  process.stderr.write('unexpected ' + p + '\\n'); process.exit(3);
}
`;

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'secdl-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'gh'), FAKE_GH, { mode: 0o755 });
  return { dir, bin, out: path.join(dir, 'out') };
}

function run(env, args, { bin }) {
  return spawnSync(python, ['-I', script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: [bin, path.dirname(python)].join(path.delimiter), ...env },
  });
}

const runDir = (out, repo) => {
  const base = path.join(out, 'acme', repo);
  const stamps = fs.readdirSync(base);
  assert.equal(stamps.length, 1, repo);
  assert.match(stamps[0], /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
  return path.join(base, stamps[0]);
};

test('every repository, each kind in its directory, an alert a file, the summary', { skip: !python }, () => {
  const t = setup();
  try {
    const r = run({}, ['acme', '--out', t.out], t);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(fs.readdirSync(path.join(t.out, 'acme')).sort(), ['app', 'tools'], 'archived and forks skipped');
    const app = runDir(t.out, 'app');
    for (const kind of ['dependabot', 'code-scanning', 'secret-scanning', 'security-advisories']) {
      assert.ok(fs.existsSync(path.join(app, kind, 'alerts.json')), kind);
    }
    // Both pages of the paginated answer.
    assert.equal(JSON.parse(fs.readFileSync(path.join(app, 'dependabot', 'alerts.json'), 'utf8')).length, 2);
    assert.ok(fs.existsSync(path.join(app, 'dependabot', 'alert-1.json')));
    assert.ok(fs.existsSync(path.join(app, 'dependabot', 'alert-2.json')));
    assert.ok(fs.existsSync(path.join(app, 'code-scanning', 'alert-7.instances.json')), 'an open alert\'s instances');
    assert.ok(fs.existsSync(path.join(app, 'security-advisories', 'advisory-GHSA-aaaa-bbbb-cccc.json')));
    const summary = fs.readFileSync(path.join(app, 'SUMMARY.md'), 'utf8');
    assert.match(summary, /lodash: Prototype pollution/);
    assert.match(summary, /js\/sql-injection: SQL injection \| a\.js:3/);
    assert.doesNotMatch(summary, /Old/, 'a fixed alert is not listed as open');
    // A kind GitHub does not answer: its reason, and the run went on.
    const tools = runDir(t.out, 'tools');
    assert.match(fs.readFileSync(path.join(tools, 'dependabot', 'status.txt'), 'utf8'), /HTTP 404/);
  } finally {
    fs.rmSync(t.dir, { recursive: true, force: true });
  }
});

test('a secret is redacted unless asked for', { skip: !python }, () => {
  const t = setup();
  try {
    assert.equal(run({}, ['acme', '--repo', 'app', '--out', t.out], t).status, 0);
    const app = runDir(t.out, 'app');
    for (const f of ['alerts.json', 'alert-3.json']) {
      const text = fs.readFileSync(path.join(app, 'secret-scanning', f), 'utf8');
      assert.doesNotMatch(text, /ghp_SHOULDNOTBEWRITTEN/, f);
      assert.match(text, /REDACTED/, f);
    }
    // Nowhere else in the download either.
    const all = [];
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => (e.isDirectory() ? walk(path.join(d, e.name)) : all.push(fs.readFileSync(path.join(d, e.name), 'utf8'))));
    walk(app);
    assert.ok(all.every(s => !s.includes('ghp_SHOULDNOTBEWRITTEN')));
    const kept = path.join(t.dir, 'kept');
    assert.equal(run({}, ['acme', '--repo', 'app', '--out', kept, '--include-secret-values'], t).status, 0);
    assert.match(fs.readFileSync(path.join(runDir(kept, 'app'), 'secret-scanning', 'alert-3.json'), 'utf8'), /ghp_SHOULDNOTBEWRITTEN/);
  } finally {
    fs.rmSync(t.dir, { recursive: true, force: true });
  }
});

test('negative: a name that is not a GitHub name, no gh, or gh signed out, writes nothing', { skip: !python }, () => {
  const t = setup();
  try {
    for (const bad of [['../etc'], ['acme', '--repo', '../../x'], ['acme/x'], ['a b'], ['..']]) {
      const r = run({}, [...bad, '--out', t.out], t);
      assert.notEqual(r.status, 0, bad.join(' '));
      assert.ok(!fs.existsSync(t.out), `nothing written for ${bad.join(' ')}`);
    }
    const signedOut = run({ FAKE_GH_AUTH: 'out' }, ['acme', '--out', t.out], t);
    assert.equal(signedOut.status, 2);
    assert.match(signedOut.stderr, /gh auth login/);
    const noGh = spawnSync(python, ['-I', script, 'acme', '--out', t.out],
      { encoding: 'utf8', env: { ...process.env, PATH: path.join(t.dir, 'empty') } });
    assert.equal(noGh.status, 2);
    assert.match(noGh.stderr, /not installed/);
    assert.ok(!fs.existsSync(t.out));
  } finally {
    fs.rmSync(t.dir, { recursive: true, force: true });
  }
});

test('the wrapper runs the script isolated, and the downloads stay out of git', () => {
  const sh = fs.readFileSync(wrapper, 'utf8');
  assert.match(sh, /exec python3 -I "\$here\/download_github_security\.py" "\$@"/);
  assert.ok(fs.statSync(wrapper).mode & 0o111, 'the wrapper is executable');
  assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /^\/?\.tools\/?$/m);
  assert.match(fs.readFileSync(script, 'utf8'), /DEFAULT_OUT = os\.path\.join\(ROOT, "\.tools", "log", "sec"\)/);
});
