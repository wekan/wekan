'use strict';

// Every .jade template must actually compile.
//
// Nothing else here catches a broken template. The other suites read .jade as TEXT
// and grep it, so a file that the compiler rejects still passes all of them - the
// failure only appears when the app is rebuilt:
//
//   Jade compilation error in client/components/main/header.jade:
//     Expected "body" end tag
//
// That one came from a `<body>` written inside a `//-` comment: the comment text is
// still lexed, so the angle brackets were read as a tag. A whole rebuild broke on a
// comment. Cheap to prevent - the real compiler parses all 107 templates in ~0.2s.
//
// This runs the SAME compiler the build uses (npm-packages/meteor-jade-loader), not a
// stock jade: WeKan's fork adds `+component`, if/unless/each/with, and Spacebars
// expressions, so a stock parser would reject valid files and pass broken ones.
//
// Run: node tests/jadeCompiles.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const { JadeCompiler, SpacebarsCompiler } = require(
  path.join(root, 'npm-packages/meteor-jade-loader/lib/jade-compiler'))();

// PARSING IS NOT ENOUGH. The loader parses and then runs SpacebarsCompiler.codeGen on
// the body and on every template, and some errors only surface in that second step:
//
//   Jade compilation error in peopleBody.jade: Can't use the built-in 'if' here
//
// which is what a `//-` comment placed BETWEEN `if` and `else if` produces - it splits
// the chain and orphans the else. This suite parsed only, so it passed while the build
// failed. Do what the loader does.
function compile(source, file, fileMode) {
  const result = JadeCompiler.parse(source, { filename: file, fileMode });
  if (!fileMode) {
    SpacebarsCompiler.codeGen(result, { isTemplate: true, sourceName: file });
    return;
  }
  if (result.body !== null && result.body !== undefined) {
    SpacebarsCompiler.codeGen(result.body, { isBody: true, sourceName: '<body>' });
  }
  for (const name of Object.keys(result.templates || {})) {
    SpacebarsCompiler.codeGen(result.templates[name],
      { isTemplate: true, sourceName: `Template "${name}"` });
  }
}

function jadeFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules') continue;
    if (entry.isDirectory()) jadeFiles(full, out);
    else if (full.endsWith('.jade')) out.push(full);
  }
  return out;
}

// `.tpl.jade` is compiled in TEMPLATE mode (bare markup, no `template(name=...)`
// wrapper); everything else is a file of templates. The loader picks by extension,
// so we do the same.
function fileMode(file) {
  return !path.basename(file).endsWith('.tpl.jade');
}

const files = [...jadeFiles(path.join(root, 'client')),
  ...jadeFiles(path.join(root, 'packages'))];

console.log('jadeCompiles:');

test('there are templates to check', () => {
  assert.ok(files.length > 50, `expected the app's templates, found ${files.length}`);
});

test('every .jade template compiles', () => {
  const broken = [];
  for (const file of files) {
    try {
      compile(fs.readFileSync(file, 'utf8'), file, fileMode(file));
    } catch (e) {
      broken.push(`${path.relative(root, file)}: ${String(e.message).split('\n')[0]}`);
    }
  }
  assert.deepStrictEqual(broken, [],
    'these would break the build:\n  ' + broken.join('\n  '));
});

test('the header templates that were broken compile (negative)', () => {
  // The two files the regression was in, checked by name so a rename cannot quietly
  // drop them from the sweep above.
  for (const rel of ['client/components/main/header.jade',
    'client/components/boards/boardHeader.jade']) {
    const full = path.join(root, rel);
    assert.ok(fs.existsSync(full), `${rel} must exist`);
    compile(fs.readFileSync(full, 'utf8'), full, true);
  }
  // And the check must really reject the shape that broke: a tag-like `<body>` in an
  // INDENTED comment BLOCK, which is what "Expected \"body\" end tag" was about. The
  // block's text lines are lexed, so the angle brackets open a tag that never closes.
  assert.throws(() => compile(
    'template(name="t")\n  //-\n    a comment mentioning <body>\n  div x\n',
    'broken.jade', true),
  'a raw tag inside a comment block must be rejected');
  // A one-line `//-` comment is lexed differently and tolerates it - which is why the
  // fix was to reword the block, and why this suite checks whole files rather than
  // grepping for angle brackets.
  compile('template(name="t")\n  //- a comment mentioning <body> inline\n  div x\n',
    'ok.jade', true);
});

test('a comment between if and else if is caught (negative)', () => {
  // The break this suite missed. `//-` between `if` and `else if` splits the chain and
  // orphans the else, and the build stops with "Can't use the built-in 'if' here".
  const broken = 'template(name="t")\n  div\n    if a\n      span x\n'
    + '    //- a comment splitting the chain\n    else if b\n      span y\n';
  assert.throws(() => compile(broken, 'broken.jade', true),
    'a comment splitting an if/else chain must be rejected');
  // PARSING ALONE DOES NOT SEE IT - which is exactly why this suite was green while
  // the build failed. If this ever stops throwing, the check above has been weakened
  // back to a parse.
  JadeCompiler.parse(broken, { filename: 'broken.jade', fileMode: true });
  // The same chain with the comment ABOVE it is fine, which is the fix.
  compile('template(name="t")\n  div\n    //- a comment about the chain\n'
    + '    if a\n      span x\n    else if b\n      span y\n', 'ok.jade', true);
});

console.log(`\njadeCompiles: ${passed} tests passed`);
