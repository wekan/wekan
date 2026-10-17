'use strict';

// Every client .jade template compiles with the build's own compiler
// (npm-packages/meteor-jade-loader, the Rspack loader) without an error or a
// warning. A warning is printed on every build and dev-server start, where it
// is read as noise until the real one is missed among them: editor.jade's
// inlineViewer had a bare `{{> UI.contentBlock }}` line under `+viewer`, and
// each start said "missing space before text for line 26".
//
// Run: node tests/jadeCompilesClean.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const getCompiler = require(path.join(ROOT, 'npm-packages/meteor-jade-loader/lib/jade-compiler.js'));
const { JadeCompiler } = getCompiler();

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '_build' || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.jade')) out.push(full);
  }
  return out;
}

// Compile as the loader does: .tpl.jade in template mode, the rest in file mode.
function compile(source, filename) {
  const messages = [];
  const warn = console.warn;
  console.warn = message => messages.push(String(message));
  try {
    JadeCompiler.parse(source, { filename, fileMode: !filename.endsWith('.tpl.jade') });
  } catch (error) {
    messages.push(`error: ${String(error.message).split('\n')[0]}`);
  } finally {
    console.warn = warn;
  }
  return messages;
}

console.log('jadeCompilesClean:');

test('the check hears the warning it is about (negative)', () => {
  const messages = compile('template(name="x")\n  span\n    +viewer\n      {{> UI.contentBlock }}\n', 'probe.jade');
  assert.ok(messages.some(m => /missing space before text/.test(m)), messages.join('\n'));
  assert.deepStrictEqual(compile('template(name="x")\n  span\n    +viewer\n      +Template.contentBlock\n', 'probe.jade'), []);
});

test('every client template compiles without an error or a warning', () => {
  const files = walk(path.join(ROOT, 'client'));
  assert.ok(files.length > 100, `found only ${files.length} templates`);
  const found = files.flatMap(file => compile(fs.readFileSync(file, 'utf8'), path.relative(ROOT, file))
    .map(message => `${path.relative(ROOT, file)}: ${message}`));
  assert.deepStrictEqual(found, []);
});

console.log(`\njadeCompilesClean: ${passed} tests passed`);
