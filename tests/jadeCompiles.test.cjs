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
const { JadeCompiler } = require(
  path.join(root, 'npm-packages/meteor-jade-loader/lib/jade-compiler'))();

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
      JadeCompiler.parse(fs.readFileSync(file, 'utf8'),
        { filename: file, fileMode: fileMode(file) });
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
    JadeCompiler.parse(fs.readFileSync(full, 'utf8'),
      { filename: full, fileMode: true });
  }
  // And the check must really reject the shape that broke: a tag-like `<body>` in an
  // INDENTED comment BLOCK, which is what "Expected \"body\" end tag" was about. The
  // block's text lines are lexed, so the angle brackets open a tag that never closes.
  assert.throws(() => JadeCompiler.parse(
    'template(name="t")\n  //-\n    a comment mentioning <body>\n  div x\n',
    { filename: 'broken.jade', fileMode: true }),
  'a raw tag inside a comment block must be rejected');
  // A one-line `//-` comment is lexed differently and tolerates it - which is why the
  // fix was to reword the block, and why this suite checks whole files rather than
  // grepping for angle brackets.
  JadeCompiler.parse(
    'template(name="t")\n  //- a comment mentioning <body> inline\n  div x\n',
    { filename: 'ok.jade', fileMode: true });
});

console.log(`\njadeCompiles: ${passed} tests passed`);
