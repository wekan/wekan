'use strict';

// wekan/wekan#6588: "Card cannot be opened when a comment/description contains a
// `file://` link". Clicking the minicard played the open animation and the details
// panel never mounted; Blaze swallowed the exception, so there was no visible
// error at all until the reporter overrode Meteor._debug and caught:
//
//   TypeError: this.__schemas__[t.toLowerCase()].validate is not a function
//     testSchemaAt / matchAtStart / markdown-it (tokenize -> parse -> render)
//
// Run: node tests/markdownCustomUrlSchemes.test.cjs
//
// WeKan registers eight custom URL schemes so links like `thunderlink:` and
// `file://` become clickable (packages/markdown/src/template-integration.js). It
// registered them the linkify-it 4/5 way:
//
//   Markdown.linkify.add(scheme + ':', 'http:')     // "behave like http:"
//
// linkify-it 6 removed string aliases and builds the definition by SPREADING it:
// `{ normalize: ..., ...'http:' }` is `{0:'h',1:'t',2:'t',3:'p',4:':'}`, an entry
// with no `validate` at all - and testSchemaAt calls `.validate(...)` on it. Every
// one of those eight schemes was therefore a landmine in any card's text.
//
// This suite runs the REAL linkify-it and markdown-it from node_modules, with the
// same registration the package performs, so it reproduces the crash against the
// shipped dependency rather than against a description of it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(
  path.join(repoRoot, 'packages/markdown/src/template-integration.js'), 'utf8');

let passed = 0;
const queued = [];
function test(name, fn) { queued.push([name, fn]); }

console.log('markdownCustomUrlSchemes:');

// The scheme list and the validator, taken out of the package source (which
// imports Meteor and cannot be required here) and run for real.
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `${name} is gone from the markdown package`);
  const open = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') { depth -= 1; if (depth === 0) { end = i + 1; break; } }
  }
  const preamble = source.slice(source.indexOf('const SCHEME_TAIL_RE'), start);
  const ctx = { module: { exports: {} } };
  vm.createContext(ctx);
  vm.runInContext(`${preamble}\n${source.slice(start, end)}\nmodule.exports = ${name};`, ctx);
  return ctx.module.exports;
}
const validateSchemeTail = extract('validateSchemeTail');

function schemesFromSource() {
  const start = source.indexOf('var urlschemes = [');
  const end = source.indexOf('];', start);
  assert.ok(start !== -1 && end !== -1, 'the scheme list is gone');
  return source.slice(start, end)
    .match(/"[a-z]+"/g)
    .map(s => s.replace(/"/g, ''));
}
const SCHEMES = schemesFromSource();

async function linkifyLike(register) {
  const { LinkifyIt } = await import('linkify-it');
  const linkify = new LinkifyIt();
  register(linkify);
  return linkify;
}

test('the shipped linkify-it really does crash on the old alias registration', async () => {
  // The bug, reproduced against the dependency that is installed: if this ever
  // stops throwing, linkify-it has changed again and the fix below can be
  // revisited - but until then, the alias form is not an option.
  const linkify = await linkifyLike(l => l.add('file:', 'http:'));
  assert.deepStrictEqual(Object.keys(linkify.__schemas__['file:']).sort(),
    ['0', '1', '2', '3', '4', 'normalize'],
    'the string is spread into indexed properties, so there is no validate');
  assert.throws(() => linkify.test('see file://server/share/doc.xlsm'),
    /validate is not a function/,
    'and one such link in a card is what made the card impossible to open');
});

test('every scheme WeKan registers has a working validate now', async () => {
  const linkify = await linkifyLike(l => {
    for (const scheme of SCHEMES) l.add(scheme + ':', { validate: validateSchemeTail });
  });
  for (const scheme of SCHEMES) {
    const entry = linkify.__schemas__[scheme + ':'];
    assert.strictEqual(typeof entry.validate, 'function', `${scheme}: has no validate`);
  }
  assert.strictEqual(SCHEMES.length, 8, 'the eight schemes are still registered');
  assert.ok(SCHEMES.includes('file'), 'including the one from the report');
});

test('the reported text renders instead of throwing', async () => {
  const linkify = await linkifyLike(l => {
    for (const scheme of SCHEMES) l.add(scheme + ':', { validate: validateSchemeTail });
  });
  for (const text of [
    'see file://server/share/doc.xlsm',
    '<file://server/share/doc.xlsm>',
    'thunderlink:message-id-123 and onenote:https://example/x',
    'file:',                                   // a scheme with nothing after it
    'mailspring:compose?to=someone@example.org',
  ]) {
    assert.doesNotThrow(() => linkify.test(text), `threw on: ${text}`);
    assert.doesNotThrow(() => linkify.match(text), `threw matching: ${text}`);
  }
  const matches = linkify.match('see file://server/share/doc.xlsm');
  assert.ok(matches && matches.length === 1, 'and the link is still recognised as a link');
  assert.strictEqual(matches[0].url, 'file://server/share/doc.xlsm');
});

test('markdown-it renders a card containing such a link, end to end', async () => {
  const { default: MarkdownIt } = await import('markdown-it');
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: true });
  for (const scheme of SCHEMES) md.linkify.add(scheme + ':', { validate: validateSchemeTail });
  const rendered = md.render('Network path: file://server/share/doc.xlsm\n\nAnd a normal https://wekan.fi link.');
  assert.match(rendered, /file:\/\/server\/share\/doc\.xlsm/,
    'the text is still there - which is the whole point: the card renders');
  assert.match(rendered, /href="https:\/\/wekan\.fi"/, 'and ordinary links still work');
});

test('a file: link renders as TEXT, and that is the honest outcome (negative)', async () => {
  // Registering the scheme makes markdown-it RECOGNISE it. Two filters then decide
  // whether a reader gets a clickable link, and both refuse: markdown-it's own
  // validateLink blocks file: (with javascript:, vbscript: and data:), and the
  // viewer's DOMPurify allows only http/https/ftp/ftps/mailto/tel/callto/cid/xmpp
  // hrefs. So this list has never produced a clickable link for any of its
  // schemes - its only observable effect was the crash. Making them clickable
  // means relaxing both, for schemes that launch local applications, which is a
  // security decision (#3218) rather than part of a crash fix.
  const { default: MarkdownIt } = await import('markdown-it');
  const md = new MarkdownIt({ linkify: true });
  for (const scheme of SCHEMES) md.linkify.add(scheme + ':', { validate: validateSchemeTail });
  const rendered = md.render('file://server/share/doc.xlsm');
  assert.ok(!/href="file:/.test(rendered),
    'markdown-it refuses a file: href, and this test is here so that the day it '
    + 'changes is a decision rather than a surprise');
  const uriAllowlist = fs.readFileSync(
    path.join(repoRoot, 'packages/markdown/src/secureDOMPurify.js'), 'utf8');
  assert.match(uriAllowlist, /ALLOWED_URI_REGEXP/,
    'and the viewer keeps its own allowlist, which is the second refusal');
});

test('trailing punctuation stays in the sentence, not in the link', () => {
  // linkify calls validate with the position AFTER the scheme, so pos is 5 for
  // "file:" - the length it returns is the length of the link that follows.
  const after = 'file:'.length;
  assert.strictEqual(validateSchemeTail('file://a/b.xlsm.', after), '//a/b.xlsm'.length,
    'a full stop after a link is the end of the sentence');
  assert.strictEqual(validateSchemeTail('file://a/b)', after), '//a/b'.length);
  assert.strictEqual(validateSchemeTail('file://a/b, and more', after), '//a/b'.length);
});

test('a scheme with nothing usable after it is not a link (negative)', () => {
  assert.strictEqual(validateSchemeTail('', 0), 0);
  assert.strictEqual(validateSchemeTail('file:', 5), 0, 'nothing after the colon');
  assert.strictEqual(validateSchemeTail('file: some text', 5), 0, 'a space right after it');
  assert.strictEqual(validateSchemeTail(null, 0), 0, 'junk in, zero out - never a throw');
  assert.strictEqual(validateSchemeTail(undefined, 0), 0);
});

test('a link with no // still counts, which is what thunderlink: looks like', () => {
  assert.strictEqual(validateSchemeTail('thunderlink:msgid@example', 12), 'msgid@example'.length);
  assert.ok(validateSchemeTail('conisio://open/doc', 8) > 0);
});

test('the viewer never lets a render failure close the card (negative)', () => {
  // The fix above removes the known crash; this keeps the guarantee when the next
  // one arrives from a plugin, a formula or an upgrade.
  const helper = source.slice(source.indexOf("registerHelper('markdown'"));
  assert.ok(/try \{/.test(helper) && /Markdown\.render\(text\)/.test(helper),
    'the render has to be inside a try');
  const catchBlock = helper.slice(helper.indexOf('} catch (error)'));
  assert.ok(/escapeHtmlSource\(text\)/.test(catchBlock),
    'and the fallback shows the text as written, rather than an empty card');
  assert.ok(/DOMPurify\.sanitize/.test(catchBlock),
    'still sanitized: a render that failed is not a reason to inject raw text');
  assert.ok(!/return;\s*}/.test(catchBlock.slice(0, 200)),
    'and it must RETURN something - returning nothing is the blank panel again');
});

test('#6640: ordinary comment markdown renders independently and keeps its text', async () => {
  // The report used French project notes with emphasis, lists and a literal >.
  // Exercise that shape through the shipped renderer configuration: one comment
  // must never make its own body, the card comment list or Activities blank.
  const { default: MarkdownIt } = await import('markdown-it');
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: true });
  const comments = [
    'Compte-rendu avec *italique* et **gras**',
    '- première tâche\n- deuxième tâche',
    'Version 3 > version 2, sans balise HTML',
  ];
  for (const comment of comments) {
    let rendered;
    assert.doesNotThrow(() => { rendered = md.render(comment); });
    assert.ok(rendered && /[A-Za-zÀ-ÿ]/.test(rendered),
      `comment rendered blank: ${comment}`);
  }
});

test('#6590: the onenote: link that hung a whole BOARD renders too', async () => {
  // Reported separately, and the same crash: "A board gets stuck indefinitely on
  // the loading animation (three dots) for all users. The root cause was traced
  // to a single card whose description and a checklist item title contained a
  // string starting with an unregistered URL-like scheme". #6588 was one card
  // that would not open; #6590 is one card that stopped the board rendering for
  // everyone, out of the same `this.__schemas__[...].validate is not a function`.
  //
  // The braces are worth pinning: the tail matcher stops at `{`, so the GUID
  // stays as text rather than being swallowed into a link - and nothing throws.
  const { default: MarkdownIt } = await import('markdown-it');
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: true });
  for (const scheme of SCHEMES) md.linkify.add(scheme + ':', { validate: validateSchemeTail });
  const text = 'onenote:///path/to/file.one#section-id={GUID}';
  let rendered;
  assert.doesNotThrow(() => { rendered = md.render(text); },
    "whether a board renders must not depend on one card's description");
  assert.match(rendered, /onenote:/, 'the text is still there');
  assert.match(rendered, /\{GUID\}/, 'and so is the part after the brace');
  // A checklist item title goes through the same renderer - the other half of
  // the report.
  assert.doesNotThrow(() => md.render(`- [ ] ${text}`));
});

(async () => {
  for (const [name, fn] of queued) { await fn(); passed += 1; console.log('  ok -', name); }
  console.log(`\nmarkdownCustomUrlSchemes: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
