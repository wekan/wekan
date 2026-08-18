const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(
  path.join(root, 'client/components/cards/attachments.css'),
  'utf8',
);

function declarations(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(match, `${selector} must have a CSS rule`);
  return match[1];
}

test('#6612: the attachment overlay gives its viewer the available viewport', () => {
  assert.match(declarations('#viewer-overlay'), /display:\s*flex/);
  assert.match(declarations('#viewer-overlay'), /flex-direction:\s*column/);
  assert.match(declarations('#viewer-overlay.hidden'), /display:\s*none/);
  assert.match(declarations('#viewer-container'), /flex:\s*1 1 auto/);
  assert.match(declarations('#viewer-content'), /flex:\s*1 1 auto/);
  assert.match(declarations('#pdf-viewer'), /width:\s*100%/);
  assert.match(declarations('#txt-viewer'), /width:\s*100%/);
});

test('#6612 negative: desktop document previews are not fixed-width columns', () => {
  assert.doesNotMatch(declarations('#pdf-viewer'), /width:\s*\d+px/);
  assert.doesNotMatch(declarations('#txt-viewer'), /width:\s*\d+px/);
  assert.doesNotMatch(css, /max-width:\s*1600px[\s\S]*?#pdf-viewer/);
});
