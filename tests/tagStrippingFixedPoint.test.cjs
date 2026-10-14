'use strict';

// CodeQL js/incomplete-multi-character-sanitization (alert #545): a single
// `replace(/<[^>]*>/g, '')` is not a sanitizer - removing one tag can splice
// the text around it into a new one ("<<script>script>" -> "<script>").
// Run: node tests/tagStrippingFixedPoint.test.cjs
//
// The alert was a test's stand-in sanitizer, which now drives the real one
// (server/lib/inputSanitizer.js). This suite keeps the shape out of the whole
// tree: every tag-stripping replace either loops to a fixed point, or writes
// something that is never HTML and is listed below with the reason.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
// Both spellings of "any tag": `<[^>]*>` and `<[^>]+>` (alerts #570/#571 were
// the second, which this pattern used to miss), with any flags.
const TAG_STRIP = /\.replace\(\/<\[\^>\][*+]>\/[a-z]*,/;

// Output that is not HTML, so a re-formed tag in it is inert text.
const NOT_HTML = {
  'models/lib/pdfDocument.js': 'PDF text: tags become spaces before the text is drawn with a PDF font',
  'server/lib/documentGif.js': 'search-index text of an Office document: tags become spaces, and the text is only matched against search terms, never rendered',
};

// A match is safe inside `do { ... } while (x !== prev)`: the replace is
// repeated until nothing changes.
function inFixedPointLoop(lines, index) {
  // Or the replace is the step of a fixed-point helper on the same line
  // (models/lib/emailToCard.js: untilStable(text, s => s.replace(...))).
  // The helper must itself be a do/while fixed point in the same file, so a
  // helper of that name that does not loop is not accepted.
  if (/\buntilStable\(/.test(lines[index])) {
    return /function untilStable\([^)]*\)\s*\{[^}]*\bdo \{[\s\S]*?\} while \(\s*\w+ !== \w+\s*\);/.test(lines.join('\n'));
  }
  const before = lines.slice(Math.max(0, index - 3), index).join('\n');
  const after = lines.slice(index + 1, index + 3).join('\n');
  return /\bdo \{\s*$/m.test(before) && /\} while \(\s*\w+ !== \w+\s*\);/.test(after);
}

function findings(files) {
  const out = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (!TAG_STRIP.test(line) || /^\s*\/\//.test(line)) return;
      if (NOT_HTML[file] || inFixedPointLoop(lines, index)) return;
      out.push(`${file}:${index + 1}: ${line.trim()}`);
    });
  }
  return out;
}

const tracked = execFileSync('git', ['ls-files', '--', '*.js', '*.cjs', '*.mjs'], { cwd: ROOT }).toString()
  .split('\n').filter(file => file && !file.startsWith('_build/') && !file.includes('node_modules/')
    && fs.existsSync(path.join(ROOT, file))
    // This file's detector fixtures are strings written to a temporary file.
    && file !== 'tests/tagStrippingFixedPoint.test.cjs');

assert.deepEqual(findings(tracked), [], 'single-pass tag stripping found');
for (const file of Object.keys(NOT_HTML)) assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} still exists`);
console.log(`  ok - ${tracked.length} files: every tag-stripping replace loops, or writes non-HTML output`);

// The detector finds the shape it is here for: the stub alert #545 flagged,
// and a loop that is not a fixed point.
const tmp = path.join(ROOT, '.tools', 'tmp', `tagstrip-${process.pid}`);
fs.mkdirSync(tmp, { recursive: true });
try {
  const rel = name => path.relative(ROOT, path.join(tmp, name));
  fs.writeFileSync(path.join(tmp, 'stub.js'), "const stripTags = value => value.replace(/<[^>]*>/g, '');\n");
  fs.writeFileSync(path.join(tmp, 'loop.js'),
    "let s = x, prev;\ndo {\n  prev = s;\n  s = s.replace(/<[^>]*>/g, '');\n} while (s !== prev);\n");
  fs.writeFileSync(path.join(tmp, 'once.js'), "for (;;) {\n  s = s.replace(/<[^>]*>/g, '');\n  break;\n}\n");
  assert.equal(findings([rel('stub.js')]).length, 1, 'the alert #545 stub is caught');
  assert.equal(findings([rel('loop.js')]).length, 0, 'a fixed-point loop passes');
  assert.equal(findings([rel('once.js')]).length, 1, 'any other loop is not enough');
  // Alerts #570/#571: the `+` spelling, in a chain, is caught too...
  fs.writeFileSync(path.join(tmp, 'plus.js'), "const t = html\n  .replace(/<br>/gi, '')\n  .replace(/<[^>]+>/g, '')\n  .trim();\n");
  assert.equal(findings([rel('plus.js')]).length, 1, 'the <[^>]+> spelling is caught');
  // ...and the helper it was fixed with passes.
  const loopHelper = "function untilStable(text, step) {\n  let prev;\n  let next = text;\n  do {\n    prev = next;\n    next = step(prev);\n  } while (next !== prev);\n  return next;\n}\n";
  fs.writeFileSync(path.join(tmp, 'helper.js'), `${loopHelper}text = untilStable(text, s => s.replace(/<[^>]*>/g, ''));\n`);
  assert.equal(findings([rel('helper.js')]).length, 0, 'untilStable(...) with a do/while fixed point passes');
  fs.writeFileSync(path.join(tmp, 'fake.js'), "function untilStable(text, step) { return step(text); }\ntext = untilStable(text, s => s.replace(/<[^>]*>/g, ''));\n");
  assert.equal(findings([rel('fake.js')]).length, 1, 'an untilStable that does not loop is not accepted');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log('  ok - the detector flags a one-pass strip and accepts only a fixed-point loop');
