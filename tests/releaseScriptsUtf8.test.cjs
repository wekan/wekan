'use strict';

// The release scripts run on Windows runners too, where Python's default text
// encoding is cp1252, not UTF-8. risk-audit.py read its baseline with a bare
// read_text(), so the baseline's "http://127.0.0.1/…" (a comment in
// server/lib/localizeAvatar.js) came out as "http://127.0.0.1/â€¦", no longer
// matched the source, and all three Windows builds stopped: "Automated risk
// indicators found: server/lib/localizeAvatar.js: new URL origin
// http://127.0.0.1". Every text read and write in releases/ names UTF-8.
//
// And the NetBSD bundle: pkgsrc's python313 has no `python3`, so node-gyp
// could not build argon2 until build-bundle.sh handed it the versioned one.
// Run: node tests/releaseScriptsUtf8.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

function pythonFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...pythonFiles(rel));
    else if (e.name.endsWith('.py')) out.push(rel);
  }
  return out;
}

test('negative: no release script reads or writes text in the platform encoding', () => {
  const offenders = [];
  for (const file of pythonFiles('releases')) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    // read_text()/write_text() calls whole, also when they span lines.
    for (const m of text.matchAll(/\.(read_text|write_text)\(/g)) {
      let depth = 1;
      let j = m.index + m[0].length;
      while (j < text.length && depth) { if (text[j] === '(') depth += 1; else if (text[j] === ')') depth -= 1; j += 1; }
      const call = text.slice(m.index, j);
      if (!/encoding=/.test(call)) offenders.push(`${file}:${text.slice(0, m.index).split('\n').length}: ${call.split('\n')[0]}`);
    }
    text.split('\n').forEach((line, i) => {
      if (/^\s*#/.test(line)) return;
      // open() in text mode - no 'b' in the mode - must name its encoding.
      const open = line.match(/\bopen\(([^)]*)\)/);
      if (open && !/encoding=/.test(open[1]) && !/['"][rwax+]*b[rwax+]*['"]/.test(open[1]) && /['"][rwax+]+['"]|^[^,]+$/.test(open[1]) && !/tarfile\.open|zipfile|archive\.open|\.open\(member/.test(line)) {
        offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, []);
});

test('the risk audit reads and writes its baseline as UTF-8', () => {
  const src = fs.readFileSync(path.join(ROOT, 'releases/risk-audit.py'), 'utf8');
  assert.match(src, /json\.loads\(args\.policy\.read_text\(encoding='utf-8'\)\)/);
  assert.match(src, /args\.policy\.write_text\(json\.dumps\(policy, indent=2\) \+ '\\n', encoding='utf-8'\)/);
  // The case that broke: the baseline holds a non-ASCII URL.
  assert.match(fs.readFileSync(path.join(ROOT, 'releases/risk-baseline.json'), 'utf8'), /"http:\/\/127\.0\.0\.1\/…"/);
});

test('NetBSD: node-gyp gets pkgsrc\'s versioned Python when there is no python3', () => {
  const src = fs.readFileSync(path.join(ROOT, 'releases/bsd/build-bundle.sh'), 'utf8');
  assert.match(src, /for p in \/usr\/pkg\/bin\/python3\.\[0-9\]\* \/usr\/local\/bin\/python3\.\[0-9\]\*; do/);
  assert.match(src, /case "\$p" in \*-config\) continue ;; esac/, 'never python3.13-config');
  assert.match(src, /export PYTHON="\$p" npm_config_python="\$p"/);
  // ...before the npm install that builds the native modules.
  assert.ok(src.indexOf('export PYTHON="$p"') < src.indexOf('npm-retry.sh" npm install'));
  assert.match(fs.readFileSync(path.join(ROOT, '.github/workflows/bsd.yml'), 'utf8'), /pkgin -y install bash python313 gmake curl gcc14/);
});

console.log(`# ${passed} passed`);
