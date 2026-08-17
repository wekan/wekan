'use strict';

// An export renders markdown the way WeKan renders it.
// Run: node tests/exportMarkdown.test.cjs
//
// A card's description, its comments and its checklist items are markdown, and
// WeKan draws them as markdown everywhere it shows them. The exports did not:
// the PDF flattened `**bold**` to the word with its asterisks still attached and
// Excel wrote the source into a cell, so a card that reads well on screen
// exported as something nobody would write on purpose - wekan/wekan#6586,
// "markdown is not formatted - this doesn't make sense in a pdf file, does it?"
//
// ONE PARSE, TWO MEDIA. models/lib/exportMarkdown.js answers in a shape neither
// exporter is: blocks carrying runs of styled text. The PDF picks a Courier
// face and indents; Excel builds a `richText` array. Neither knows markdown, so
// a fix to how a list nests reaches both at once - which is the whole point of
// there being one module.
//
// It is tested as arithmetic: markdown in, blocks out, under bare node.

const assert = require('assert');
const {
  markdownBlocks, markdownRuns, markdownPlainText, markdownItConstructor,
} = require('../models/lib/exportMarkdown');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const styled = runs => runs.map(r => r.text
  + (r.bold ? '[b]' : '') + (r.italic ? '[i]' : '')
  + (r.code ? '[c]' : '') + (r.strike ? '[s]' : '')
  + (r.link ? `->${r.link}` : '')).join('');

console.log('exportMarkdown:');

test('the parser constructor works through CommonJS and Meteor ESM interop', () => {
  function Constructor() {}
  assert.strictEqual(markdownItConstructor(Constructor), Constructor,
    'bare Node returns the constructor itself');
  assert.strictEqual(markdownItConstructor({ default: Constructor }), Constructor,
    'the production bundle returns the constructor as the default export');
});

test('emphasis is emphasis, not asterisks', () => {
  const [para] = markdownBlocks('Some **bold** and *italic* text.');
  assert.strictEqual(para.type, 'paragraph');
  assert.strictEqual(styled(para.runs), 'Some bold[b] and italic[i] text.');
  // The thing the reporter saw: the markers must not survive into the file.
  assert.ok(!markdownPlainText('Some **bold** text').includes('**'),
    'no asterisks reach the document');
});

test('a list is a list, and a nested one is nested', () => {
  const blocks = markdownBlocks('- one\n- two\n  - deeper\n');
  assert.deepStrictEqual(blocks.map(b => `${b.type}:${b.level}`),
    ['bullet:0', 'bullet:0', 'bullet:1']);
  assert.strictEqual(styled(blocks[2].runs), 'deeper');
});

test('a numbered list keeps its numbers, and its own start', () => {
  const blocks = markdownBlocks('3. three\n4. four\n');
  assert.deepStrictEqual(blocks.map(b => b.index), [3, 4],
    'a list that starts at 3 is not renumbered from 1');
});

test('code, quotes, headings and rules each keep their kind', () => {
  const blocks = markdownBlocks('# Title\n\n> quoted\n\n```js\nnpm i\n```\n\n---\n');
  const kinds = blocks.map(b => b.type);
  assert.ok(kinds.includes('heading'), 'a heading');
  assert.ok(kinds.includes('code'), 'a code block');
  assert.ok(kinds.includes('rule'), 'a horizontal rule');
  const heading = blocks.find(b => b.type === 'heading');
  assert.strictEqual(heading.level, 1, 'and the heading knows its level');
  const code = blocks.find(b => b.type === 'code');
  assert.strictEqual(code.text, 'npm i', 'the code is the code, without the fence');
  assert.strictEqual(code.language, 'js', 'and its language is kept');
  const quoted = blocks.find(b => b.quote);
  assert.ok(quoted, 'a quote is marked as quoted rather than losing its mark');
});

test('a link keeps both its words and its address', () => {
  const [para] = markdownBlocks('See [the site](https://wekan.fi) for more.');
  assert.strictEqual(styled(para.runs), 'See the site->https://wekan.fi for more.');
  // Neither half may be dropped: the words are what the sentence reads as, and
  // the address is the only thing a printed page can be followed from.
  const flat = markdownPlainText('See [the site](https://wekan.fi)');
  assert.ok(flat.includes('the site'), 'the words survive');
});

test('WeKan\'s own options: a single newline IS a line break', () => {
  // The reader's markdown-it runs with `breaks: true`, so a card written on two
  // lines shows as two lines. An export that joined them would disagree with the
  // screen about what the author wrote.
  const [para] = markdownBlocks('first\nsecond');
  assert.ok(styled(para.runs).includes('\n'), 'the break is kept');
});

test('runs of the same style are merged (negative)', () => {
  // Excel writes a font object per run. Text that is all one style must arrive
  // as ONE run, or a paragraph becomes forty identical font declarations.
  const runs = markdownRuns('plain unstyled sentence with several words');
  assert.strictEqual(runs.length, 1, `expected one run, got ${runs.length}`);
});

test('HTML in a card is TEXT, never markup (negative)', () => {
  // An export is a document. A card containing a script tag must put those
  // characters in the file rather than have anything act on them.
  const flat = markdownPlainText('before <script>alert(1)</script> after');
  assert.ok(flat.includes('<script>'), 'the tag is shown as written');
  const runs = markdownRuns('<b>not bold</b>');
  assert.ok(!runs.some(r => r.bold), 'and inline HTML does not become styling');
});

test('anything unparseable still exports, as its own text', () => {
  // A card must always export. Nothing here may throw into the exporter.
  for (const input of [null, undefined, '', 42, {}, '```\nunclosed fence']) {
    assert.doesNotThrow(() => markdownBlocks(input), `markdownBlocks(${input})`);
    assert.doesNotThrow(() => markdownPlainText(input), `markdownPlainText(${input})`);
  }
  assert.deepStrictEqual(markdownBlocks(''), [], 'empty in, empty out');
});

test('one line for a cell keeps the shape of the list', () => {
  // A spreadsheet cell has one value, so blocks are joined - but a bullet keeps
  // its bullet and an indent keeps its indent, or a list arrives as a paragraph.
  const flat = markdownPlainText('- one\n- two\n  - deeper\n');
  assert.ok(flat.includes('• one'), 'a bullet');
  assert.ok(/\n {4}• deeper/.test(flat), 'and a nested one is indented');
});

test('both exporters ask THIS module (negative)', () => {
  // The point of the module is that there is one of it. An exporter that parses
  // markdown itself is the duplication this removes.
  const fs = require('fs');
  const path = require('path');
  const ROOT = path.join(__dirname, '..');
  const excel = fs.readFileSync(path.join(ROOT, 'models/server/ExporterExcelCard.js'), 'utf8');
  const adapter = fs.readFileSync(path.join(ROOT, 'models/lib/cardExportDocument.js'), 'utf8');
  const document = fs.readFileSync(path.join(ROOT, 'models/lib/cardDocument.js'), 'utf8');
  assert.ok(/buildExportCardDocument\(/.test(excel)
    && /buildCardDocument\(/.test(adapter)
    && /require\('\.\/exportMarkdown'\)/.test(document),
  'the Excel card exporter must render markdown through the shared document');
  for (const file of ['models/server/ExporterExcelCard.js']) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8')
      .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
    assert.ok(!/new MarkdownIt|require\('markdown-it'\)/.test(code),
      `${file} must not parse markdown itself`);
  }
});

test('Excel renders every card text through it, not just the description', () => {
  // A description that renders and a comment that does not is worse than
  // neither, because the file then disagrees with itself about what markdown is.
  const fs = require('fs');
  const path = require('path');
  const document = fs.readFileSync(
    path.join(__dirname, '..', 'models/lib/cardDocument.js'), 'utf8');
  assert.ok(/markdownBlocks\(\(card && card\.description\)/.test(document));
  assert.ok(/markdownBlocks\(item\.title/.test(document));
  assert.ok(/markdownBlocks\(comment\.text/.test(document));
});

test('a rich-text cell is still measured by its TEXT (negative)', () => {
  // The row height is estimated from the value's length. A rich-text value is an
  // object whose `.length` is undefined, so measuring the value itself would
  // give every formatted comment the minimum height and clip it.
  const fs = require('fs');
  const path = require('path');
  const renderer = fs.readFileSync(
    path.join(__dirname, '..', 'models/server/renderCardDocumentExcel.js'), 'utf8');
  assert.ok(/richText: values\.map/.test(renderer),
    'the renderer carries every styled run into ExcelJS rich text');
});

console.log(`\nexportMarkdown: ${passed} tests passed`);
