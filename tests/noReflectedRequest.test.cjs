'use strict';

// CodeQL js/reflected-xss (alert #583): a test's HTTP server answered with
// `served ${req.url} ...`, sending the request back as the body. Harmless in a
// test, and exactly the shape of reflected XSS anywhere else, so the shape is
// kept out of the whole tree: no res.end/res.write/res.send writes a request's
// url, query, params, headers or body straight into the response.
// Run: node tests/noReflectedRequest.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
// A write call whose argument mentions the request's own data directly.
const REFLECTS = /\bres\.(end|write|send)\(\s*[^;]*\breq\.(url|originalUrl|query|params|headers|body)\b/;

function findings(files) {
  const out = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return;
      if (REFLECTS.test(line)) out.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  return out;
}

const tracked = execFileSync('git', ['ls-files', '--', '*.js', '*.cjs', '*.mjs'], { cwd: ROOT }).toString()
  .split('\n').filter(f => f && !f.startsWith('_build/') && !f.includes('node_modules/')
    && f !== 'tests/noReflectedRequest.test.cjs' && fs.existsSync(path.join(ROOT, f)));
assert.deepEqual(findings(tracked), [], 'a response reflects the request');
console.log(`  ok - ${tracked.length} files: no response reflects the request`);

// The detector finds the alert's own shape, and leaves a fixed answer alone.
const tmp = path.join(ROOT, '.tools', 'tmp', `reflect-${process.pid}`);
fs.mkdirSync(tmp, { recursive: true });
try {
  const rel = name => path.relative(ROOT, path.join(tmp, name));
  fs.writeFileSync(path.join(tmp, 'bad.js'), 'http.createServer((req, res) => res.end(`served ${req.url}`));\n');
  fs.writeFileSync(path.join(tmp, 'good.js'), "const page = req.url === '/hello' ? '/hello' : 'other';\nres.end(`served ${page}`);\n");
  assert.equal(findings([rel('bad.js')]).length, 1, 'the #583 shape is caught');
  assert.equal(findings([rel('good.js')]).length, 0, 'a fixed answer chosen by comparison passes');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log('  ok - the detector catches a reflected request and passes a fixed answer');
