'use strict';

// An async function returns a Promise. Keeping that Promise in a variable and
// then using the variable as the value - `.forEach`, `.map`, `.length`, `[i]`
// - throws or reads undefined. cloneBoard (models/import.js) did exactly
// that: `const membersMapping = getMembersToMap(data)` without `await`, then
// `membersMapping.forEach(...)`, so every clone through that method stopped
// with "membersMapping.forEach is not a function".
//
// The test pins the fix, and the negative sweep resolves, file by file, every
// `const x = f(...)` whose f is an async function - declared in that file or
// imported from a module that exports it async - and fails when x is then
// used as an array or object without being awaited.
//
// Run: node tests/asyncResultAwaited.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const SKIP = new Set(['_build', 'node_modules', '.npm', 'tests']);
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = ['models', 'server', 'client', 'imports', 'config']
  .flatMap(top => walk(path.join(ROOT, top)));
const source = new Map(files.map(f => [f, fs.readFileSync(f, 'utf8')]));

function resolveModule(fromFile, spec) {
  let base;
  if (spec.startsWith('/')) base = path.join(ROOT, spec);
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else return null;
  for (const candidate of [base, `${base}.js`, path.join(base, 'index.js')]) {
    if (source.has(candidate)) return candidate;
  }
  return null;
}

const exportedAsync = file => new Set(
  [...source.get(file).matchAll(/export\s+async\s+function\s+(\w+)/g)].map(m => m[1]));

// The async functions a file can call by bare name.
function asyncNamesIn(file) {
  const src = source.get(file);
  const names = new Set([...src.matchAll(/(?:^|[^.\w])async\s+function\s+(\w+)/g)].map(m => m[1]));
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const target = resolveModule(file, m[2]);
    if (!target) continue;
    const asyncs = exportedAsync(target);
    for (const part of m[1].split(',')) {
      const [orig, alias] = part.trim().split(/\s+as\s+/);
      if (orig && asyncs.has(orig)) names.add(alias || orig);
    }
  }
  // A plain (non-async) local function of the same name shadows an import.
  for (const m of src.matchAll(/(?:^|[^.\w])(?<!async\s)function\s+(\w+)/g)) {
    if (!new RegExp(`async\\s+function\\s+${m[1]}\\b`).test(src)) names.delete(m[1]);
  }
  return names;
}

function unawaited(file) {
  const src = source.get(file);
  const asyncs = asyncNamesIn(file);
  const found = [];
  for (const m of src.matchAll(/\b(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\s*\(/g)) {
    const [, variable, fn] = m;
    if (!asyncs.has(fn)) continue;
    const after = src.slice(m.index + m[0].length, m.index + m[0].length + 3000);
    const usedAsValue = new RegExp(
      `\\b${variable}\\s*(?:\\.(?:forEach|map|filter|length|find|some|every|reduce|includes)\\b|\\[)`);
    if (usedAsValue.test(after)) {
      const line = src.slice(0, m.index).split('\n').length;
      found.push(`${path.relative(ROOT, file)}:${line}: ${variable} = ${fn}(...)`);
    }
  }
  return found;
}

console.log('asyncResultAwaited:');

test('cloneBoard awaits the member mapping before reading it', () => {
  const src = read('models/import.js');
  assert.ok(/const membersMapping = await getMembersToMap\(data\);/.test(src));
  assert.ok(/export async function getMembersToMap/.test(read('models/wekanmapper.js')));
});

test('the sweep recognises the shape it guards against', () => {
  const file = path.join(ROOT, 'models', 'import.js');
  const original = source.get(file);
  source.set(file, original.replace('await getMembersToMap(data)', 'getMembersToMap(data)'));
  try {
    assert.deepStrictEqual(unawaited(file).length, 1, 'the old cloneBoard line must be found');
  } finally {
    source.set(file, original);
  }
});

test('no un-awaited async result is used as a value anywhere (negative)', () => {
  assert.deepStrictEqual(files.flatMap(unawaited), []);
});

console.log(`\nasyncResultAwaited: ${passed} tests passed`);
