'use strict';

// The card viewer's task-list checkbox survives both sanitizer passes, and
// nothing else that is a form field does (wekan/wekan#2419); code
// highlighting classes survive only on code inside <pre>.
// Run: node tests/markdownSanitizerHooks.test.cjs
//
// packages/markdown/src/secureDOMPurify.js described its extra rules in a
// HOOKS key of the config object. DOMPurify has no such option, so none of
// them ever ran, and they were written as `return false`, which DOMPurify
// hooks ignore. The card viewer then sanitizes the markdown output a second
// time with imports/lib/secureDOMPurify.js, which forbids every <input>, so
// "- [ ] Task" rendered with no checkbox at all. Both passes now add a real
// hook around each call that keeps only a disabled checkbox.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// imports/lib is an ES module importing the DOMPurify singleton, which needs a
// window; evaluate it with a jsdom-backed DOMPurify instead.
function loadViewerSanitizer(purifier) {
  const source = read('imports/lib/secureDOMPurify.js')
    .replace(/^import DOMPurify from 'dompurify';$/m, '')
    .replace(/^import \{ allowedUriRegExp \} from '\/models\/lib\/urlSchemeAllowlist';$/m, '')
    .replace(/^export function /gm, 'function ');
  const sandbox = { DOMPurify: purifier, allowedUriRegExp: require('../models/lib/urlSchemeAllowlist.js').allowedUriRegExp };
  vm.runInNewContext(`${source}\nthis.sanitizeHTML = sanitizeHTML; this.getSecureDOMPurifyConfig = getSecureDOMPurifyConfig;`, sandbox);
  return sandbox;
}

function checkCheckboxRules(clean, label) {
  // Negative: no live form control survives.
  for (const html of ['<input type="text" placeholder="Password">', '<input type="password">', '<input>',
    '<input type="file">', '<input type="hidden" value="token">', '<input type="submit">']) {
    assert.equal(clean(html), '', `${label}: ${html}`);
  }
  // name/value/form are not allowed attributes, so they are stripped first and
  // what remains is only a disabled checkbox that submits nothing.
  for (const html of ['<input type="checkbox" name="x">', '<input type="checkbox" value="1">']) {
    assert.equal(clean(html), '<input type="checkbox" disabled="">', `${label}: ${html}`);
  }
  // A form attribute is either stripped (the viewer does not allow it) or,
  // where MathML's own `form` attribute is allowed, drops the whole input.
  assert.match(clean('<input type="CHECKBOX" form="f">'), /^(?:|<input type="CHECKBOX" disabled="">)$/, label);
  // Positive: the task-list checkbox survives, always disabled.
  assert.equal(clean('<input type="checkbox" disabled>'), '<input type="checkbox" disabled="">', label);
  assert.equal(clean('<input type="checkbox" checked>'), '<input type="checkbox" checked="" disabled="">', label);
  assert.equal(clean('<ul><li><input type="checkbox" disabled="disabled"> Task</li></ul>'),
    '<ul><li><input type="checkbox" disabled=""> Task</li></ul>', label);
  // Script and handlers are still gone.
  assert.equal(clean('<input type="checkbox" onclick="x()"><script>1</script>'), '<input type="checkbox" disabled="">', label);
}

function checkHighlightRules(clean, label) {
  // Highlighting classes only on <code>/<span> inside <pre>, and only hljs-*/language-*.
  assert.equal(clean('<pre><code class="hljs language-js"><span class="hljs-keyword">const</span></code></pre>'),
    '<pre><code class="hljs language-js"><span class="hljs-keyword">const</span></code></pre>', label);
  assert.equal(clean('<pre><code class="hljs evil"><span class="hljs-string danger">x</span></code></pre>'),
    '<pre><code class="hljs"><span class="hljs-string">x</span></code></pre>', `${label}: other classes are removed`);
  // Negative: no class survives outside <pre>, on other elements, or a foreign class.
  for (const html of ['<p class="hljs-keyword">x</p>', '<span class="hljs-keyword">x</span>', '<code class="hljs">x</code>',
    '<div class="language-js">x</div>', '<pre><div class="hljs">x</div></pre>', '<pre><a class="hljs-link" href="#">x</a></pre>',
    '<pre><span class="evil">x</span></pre>']) {
    assert.doesNotMatch(clean(html), /class=/, `${label}: ${html}`);
  }
  assert.equal(clean('<pre><span class="hljs-x" id="y" style="color:red" onclick="z()">x</span></pre>'),
    '<pre><span class="hljs-x">x</span></pre>', label);
}

async function main() {
  const window = new JSDOM('').window;

  const { secureSanitize, getSecureDOMPurifyConfig } = await import('../packages/markdown/src/secureDOMPurify.js');
  const markdownPurifier = createDOMPurify(window);
  checkCheckboxRules(html => secureSanitize(markdownPurifier, html), 'markdown pass');
  checkHighlightRules(html => secureSanitize(markdownPurifier, html), 'markdown pass');
  assert.equal(markdownPurifier.sanitize('<pre><code class="hljs">x</code></pre>', getSecureDOMPurifyConfig()),
    '<pre><code>x</code></pre>', 'the class hook is removed after each call');
  // The hooks are for these calls only: plain DOMPurify is unaffected afterwards.
  assert.equal(markdownPurifier.sanitize('<input type="password">', getSecureDOMPurifyConfig()), '<input type="password">');
  console.log('  ok - the markdown pass keeps only a disabled checkbox and code highlighting in <pre>');

  const viewerPurifier = createDOMPurify(window);
  const viewer = loadViewerSanitizer(viewerPurifier);
  checkCheckboxRules(html => viewer.sanitizeHTML(html), 'viewer pass');
  checkCheckboxRules(html => viewer.sanitizeHTML(html, { stripLinks: true }), 'viewer pass, links stripped');
  checkHighlightRules(html => viewer.sanitizeHTML(html), 'viewer pass');

  // Real highlight.js output passes both passes intact and still escaped.
  const hljs = require('highlight.js/lib/common');
  const code = hljs.highlight('const x = "<script>alert(1)</script>"; // hi', { language: 'javascript' }).value;
  const block = `<pre><code class="language-js">${code}</code></pre>`;
  const twice = viewer.sanitizeHTML(secureSanitize(markdownPurifier, block));
  assert.match(twice, /<span class="hljs-keyword">const<\/span>/);
  assert.match(twice, /<span class="hljs-string">/);
  assert.match(twice, /<span class="hljs-comment">\/\/ hi<\/span>/);
  assert.match(twice, /&lt;script&gt;/, 'code stays text');
  assert.doesNotMatch(twice, /<script/);
  // Its config on its own still forbids every input, and the hook is removed.
  assert.ok(viewer.getSecureDOMPurifyConfig().FORBID_TAGS.includes('input'));
  assert.equal(viewerPurifier.sanitize('<input type="checkbox">', viewer.getSecureDOMPurifyConfig()), '');
  assert.equal(viewerPurifier.sanitize('<input type="password">', { ALLOWED_TAGS: ['input'], ALLOWED_ATTR: ['type'] }),
    '<input type="password">', 'no hook is left installed after sanitizeHTML');
  console.log('  ok - the viewer pass keeps the task checkbox and highlighting, and nothing else');

  // No sanitizer config may carry a dead HOOKS key again, and the markdown
  // package never calls DOMPurify.sanitize without its hooks.
  for (const file of ['packages/markdown/src/secureDOMPurify.js', 'imports/lib/secureDOMPurify.js', 'client/lib/secureDOMPurify.js']) {
    assert.doesNotMatch(read(file), /^\s*HOOKS:\s*\{/m, file);
  }
  const integration = read('packages/markdown/src/template-integration.js');
  assert.doesNotMatch(integration, /DOMPurify\.sanitize\(/);
  assert.match(integration, /secureSanitize\(DOMPurify, renderedMarkdown, getSecureDOMPurifyConfig\(urlSchemes\)\)/);
  console.log('  ok - no dead HOOKS config remains');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
