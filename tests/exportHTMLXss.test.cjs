'use strict';

// Regression for GHSA-8r5p-4q9j-f5jx: Stored XSS in HTML board exports through a
// card-title second parse.
//
// The exported index.html embeds a click handler that opens a per-card modal. It
// read the card title/body via .textContent (which DECODES HTML entities) and then
// concatenated those values into `content.innerHTML` — a SECOND parse that revived
// entity-encoded markup (e.g. a card titled `&lt;img src=x onerror=...&gt;`) and
// executed it when a recipient clicked the card in the export. The fix builds the
// modal with DOM nodes and assigns the title/body through textContent, never
// innerHTML.
//
// exportHTML.js is a Blaze/ESM client module, so this guards the SOURCE of the
// injected handler: the untrusted values (titleText/allText) must reach only
// textContent, and must never be concatenated into an innerHTML assignment.
// Run: node tests/exportHTMLXss.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const src = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'lib', 'exportHTML.js'), 'utf8');

check('the card title/body are inserted via textContent (inert), not innerHTML', () => {
  assert.ok(/titleEl\.textContent = titleText/.test(src),
    'the card title must be assigned through textContent');
  assert.ok(/bodyEl\.textContent = allText/.test(src),
    'the card body must be assigned through textContent');
});

check('titleText / allText never reach an innerHTML assignment (the second parse)', () => {
  // Every `X.innerHTML = ...` assignment in the file must not include the
  // entity-decoded card values on its right-hand side.
  const innerHtmlAssigns = src.match(/\.innerHTML\s*=\s*[^\n;]+/g) || [];
  for (const line of innerHtmlAssigns) {
    assert.ok(!/titleText|allText/.test(line),
      `titleText/allText must not flow into innerHTML: ${line}`);
  }
});

check('the old vulnerable concatenation is gone', () => {
  assert.ok(!/content\.innerHTML\s*=\s*'<h2[^\n]*titleText/.test(src),
    'the h2/allText innerHTML concatenation must be removed');
  // The close button is now built as a DOM node, not modal.innerHTML.
  assert.ok(!/modal\.innerHTML\s*=/.test(src),
    'the modal must not be built via innerHTML');
});

check('the handler clears the modal safely and appends DOM nodes', () => {
  assert.ok(/while \(modal\.firstChild\)/.test(src), 'modal is cleared via DOM removal, not innerHTML=""');
  assert.ok(/document\.createElement\('h2'\)/.test(src) && /modal\.appendChild\(content\)/.test(src),
    'the modal content is built from DOM nodes');
});

// Behavioural check of the core property against a minimal DOM: an entity-decoded
// title containing a live tag, when assigned via textContent, must NOT create child
// elements (no second parse); if it were assigned via innerHTML it would.
check('textContent assignment does not revive an entity-decoded <img> (unlike innerHTML)', () => {
  // Minimal element stub mimicking the DOM contract used by the fix.
  function makeEl() {
    const el = { children: [], _text: '', style: {}, appendChild(c) { this.children.push(c); return c; } };
    Object.defineProperty(el, 'textContent', {
      get() { return this._text; },
      set(v) { this._text = String(v); /* textContent never parses children */ },
    });
    Object.defineProperty(el, 'innerHTML', {
      get() { return this._html || ''; },
      set(v) {
        this._html = String(v);
        // A real browser would parse markup into children on innerHTML=.
        if (/<img|<script|onerror=/i.test(this._html)) this.children.push({ tag: 'parsed-markup' });
      },
    });
    return el;
  }
  const decodedMaliciousTitle = '<img src=x onerror="alert(1)">'; // what .textContent decodes to
  const titleEl = makeEl();
  titleEl.textContent = decodedMaliciousTitle;
  assert.strictEqual(titleEl.children.length, 0, 'textContent must not parse markup into elements');
  // Control: the previously-vulnerable innerHTML path WOULD have parsed it.
  const bad = makeEl();
  bad.innerHTML = '<h2>' + decodedMaliciousTitle + '</h2>';
  assert.ok(bad.children.length > 0, 'sanity: innerHTML would have revived the tag');
});

console.log(`\nexportHTMLXss: ${passed} checks passed`);
