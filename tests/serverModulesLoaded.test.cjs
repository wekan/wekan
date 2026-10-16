'use strict';

// Every server module that does its work by being loaded - registering a login
// handler, a cron job, a startup observer - is reached from server/main.js.
//
// package.json sets meteor.mainModule, so Meteor loads ONLY what an import
// chain from server/main.js reaches; a file that is not imported never runs.
// Three finished features sat like that for months, each with a passing test
// that read the file but never asked whether the app loads it:
//   server/loginTimingNormalization.js  LockoutBleed's DDP login half (GHSA-2g94-9x3m-hv37)
//   server/cardRecurrenceSchedule.js    the card Recurrence setting's cron job
//   server/productNameCache.js          the product name for the snap's outage pages
// Run: node tests/serverModulesLoaded.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
// import ... from, export ... from (a re-export loads the module too), require, import()
const SPEC = /(?:import\s+(?:[^'"]*?\s+from\s+)?|export\s+(?:\*|\{[^}]*\})(?:\s+as\s+\w+)?\s+from\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g;
const EXTS = ['', '.js', '.mjs', '.cjs', '.jade', '.css', '.html', '.json', '/index.js'];

function resolve(from, spec) {
  let base;
  if (spec.startsWith('/')) base = path.join(ROOT, spec);
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const ext of EXTS) {
    const file = base + ext;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

function reachable(entries) {
  const seen = new Set();
  const stack = [...entries];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(SPEC)) {
      const next = resolve(file, m[1]);
      if (next) stack.push(next);
    }
  }
  return seen;
}

const loaded = reachable([path.join(ROOT, 'server/main.js')]);

// A module that runs by being loaded: it registers something at startup.
const SIDE_EFFECT = /Meteor\.startup\(|Meteor\.methods\(|Meteor\.publish\(|publishComposite\(|SyncedCron\.add\(|registerLoginHandler\(|WebApp\.(handlers|connectHandlers)\./;

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

test('the three features that were never loaded are loaded now', () => {
  for (const file of ['server/loginTimingNormalization.js', 'server/cardRecurrenceSchedule.js', 'server/productNameCache.js']) {
    assert.ok(loaded.has(path.join(ROOT, file)), `${file} is not reached from server/main.js`);
  }
});

test('negative: no server module that registers something at load time is left unloaded', () => {
  const unloaded = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!['node_modules', 'tests', '_build', '.build'].includes(e.name)) walk(rel); }
      else if (e.name.endsWith('.js') && SIDE_EFFECT.test(fs.readFileSync(path.join(ROOT, rel), 'utf8')) &&
        !loaded.has(path.join(ROOT, rel))) unloaded.push(rel);
    }
  };
  walk('server');
  assert.deepEqual(unloaded, [], 'these register something but nothing imports them, so they never run');
});

console.log(`# ${passed} passed`);
