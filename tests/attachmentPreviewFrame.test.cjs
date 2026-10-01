'use strict';
// Image previews on cards (v12.12 email report: "Preview of Images is gone").
// The board cover was a flat band because the minicard cover() helper returned
// a wrapper without _id, so attachmentPreviewUrl() gave '' and the cover was
// url('?dummyReload...'); the open card's attachment tile was a <button>
// filled with the theme accent by forms.css. Run: node tests/attachmentPreviewFrame.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// The fallback, executed as written in attachments.js.
const js = read('client/components/cards/attachments.js');
const fallbackSource = js.slice(js.indexOf('export function previewFallback'), js.indexOf('\n}\n', js.indexOf('export function previewFallback')) + 2)
  .replace('export function', 'function');
const previewFallback = new Function(`${fallbackSource}; return previewFallback;`)();
const img = src => ({ dataset: {}, _src: src, getAttribute() { return this._src; }, set src(v) { this._src = v; }, get src() { return this._src; } });

test('a failed thumbnail falls back to the original once, then stops', () => {
  const image = img('/cdn/storage/attachments/abc/thumbnail?dummyReloadAfterSessionEstablished=s');
  previewFallback(image);
  assert.equal(image.src, '/cdn/storage/attachments/abc?dummyReloadAfterSessionEstablished=s');
  previewFallback(image);
  assert.equal(image.src, '/cdn/storage/attachments/abc?dummyReloadAfterSessionEstablished=s', 'no second swap, no loop');
  const plain = img('/cdn/storage/attachments/abc/thumbnail');
  previewFallback(plain);
  assert.equal(plain.src, '/cdn/storage/attachments/abc');
});

test('an original, an empty src or no image is left alone (negative)', () => {
  for (const src of ['/cdn/storage/attachments/abc', '', '/cdn/storage/attachments/thumbnailish']) {
    const image = img(src);
    previewFallback(image);
    assert.equal(image.src, src);
    assert.equal(image.dataset.previewFellBack, undefined);
  }
  previewFallback(null);
  assert.match(js, /document\.addEventListener\('error', event => \{/);
  assert.match(js, /'img\.attachment-thumbnail, img\.minicard-cover-image, img\.card-details-cover-image'/);
  assert.doesNotMatch(fallbackSource, /console|securityLog|record\(/, 'a failed preview is not logged');
});

test('the board cover is the attachment, drawn as an img only when it has a URL', () => {
  const minicard = read('client/components/cards/minicard.js');
  const cover = minicard.slice(minicard.indexOf('  cover() {'), minicard.indexOf('  sess() {'));
  assert.match(cover, /resolveCoverId\(this/, 'linked cards still resolve the real card');
  assert.match(cover, /isLiveAttachment\(attachment\)/, 'a soft-deleted attachment is still never a cover');
  assert.match(cover, /return attachment;/);
  assert.doesNotMatch(cover, /link\(\)\s*\{/, 'no link-only wrapper without _id');
  const jade = read('client/components/cards/minicard.jade');
  assert.match(jade, /if attachmentPreviewUrl cover\s+\.minicard-cover\s+img\.minicard-cover-image\(/);
  assert.match(jade, /\$eq section "cover"/, 'the cover keeps its place in the minicard field order');
  const details = read('client/components/cards/cardDetails.jade');
  assert.match(details, /if currentBoard\.allowsCoverAttachmentOnCard[\s\S]*?if attachmentPreviewUrl cover\s+\.card-details-cover\s+img\.card-details-cover-image\(/);
  assert.match(read('client/components/cards/cardDetails.js'), /Template\.cardDetails\.helpers\(\{\s*\/\/[^\n]*\n[^\n]*\n\s*sess\(\) \{/);
});

test('no cover is a CSS background any more, and no invalid border-radius remains (negative)', () => {
  for (const file of ['client/components/cards/minicard.jade', 'client/components/cards/cardDetails.jade']) {
    assert.doesNotMatch(read(file), /cover[^\n]*background-image/, file);
  }
  assert.doesNotMatch(read('client/components/cards/cardDetails.jade'), /cover\.link 'original'/);
  const minicardCss = read('client/components/cards/minicard.css');
  assert.doesNotMatch(minicardCss, /border-radius:\s*top/);
  assert.match(minicardCss, /\.minicard \.minicard-cover-image \{[^}]*object-fit: cover;/);
  assert.match(read('client/components/boards/boardColors.css'), /\.board-color-modern \.minicard \.minicard-cover-image \{\s*height: 100px;/);
  assert.match(read('client/components/cards/cardDetails.css'), /\.card-details-cover-image \{[^}]*height: 180px;[^}]*object-fit: cover;/);
});

test('the attachment tile is a neutral frame in every state the global button rule paints', () => {
  const css = read('client/components/cards/attachments.css');
  for (const state of ['', ':hover', ':focus', ':active', ':active:hover', ':active:focus']) {
    assert.ok(css.includes(`button.attachment-thumbnail-container${state},`) || css.includes(`button.attachment-thumbnail-container${state} {`),
      `state ${state || 'rest'} is reset`);
  }
  const block = css.slice(css.indexOf('button.attachment-thumbnail-container,'), css.indexOf('}', css.indexOf('button.attachment-thumbnail-container,')));
  for (const rule of ['width: 144px;', 'height: 96px;', 'background: #f4f5f7;', 'min-height: 0;', 'padding: 0;', 'font-weight: 400;']) {
    assert.ok(block.includes(rule), rule);
  }
  assert.doesNotMatch(block, /--theme-accent/, 'the accent is not a picture background');
  assert.match(css, /img\.attachment-thumbnail,\s*video\.attachment-thumbnail \{[^}]*object-fit: contain;/);
  assert.match(css, /button\.attachment-thumbnail-container:focus-visible \{\s*outline: 2px solid #01628c;/);
  assert.match(css, /\.attachment-item \{[^}]*gap: 12px;/);
  // The button stays: it is the keyboard control with the aria-label.
  assert.match(read('client/components/cards/attachments.jade'), /button\.attachment-thumbnail-container\.open-preview\(type="button" aria-label=/);
  assert.match(read('client/components/cards/attachments.jade'), /img\.attachment-thumbnail\(src="\{\{attachmentPreviewUrl this\}\}"[^)]*loading="lazy"\)/);
  // My Attachments uses the same classes on a div and keeps its own sizing.
  assert.match(css, /div\.attachment-thumbnail-container \{[^}]*width: 150px;/);
  // forms.css is untouched: other buttons stay the accent.
  assert.match(read('client/components/forms/forms.css'), /--theme-accent-fill/);
});
