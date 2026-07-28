'use strict';

// Plain-Node guard for the Admin Panel / Attachments checkboxes (#6465).
// Run: node tests/adminAttachmentCheckboxes.test.cjs
//
// Every checkbox on those panes - Backup's "attachments / avatars / data", each
// storage's "Enabled" and "Read", the S3 path-style flag, the avatar-upload block
// - rendered as a grey rotated RECTANGLE instead of the green tick, in Backup,
// GridFS, Filesystem, S3, Azure and Google Cloud Storage alike.
//
// They were native `<input type="checkbox">` styled into WeKan's material
// checkbox: `appearance: none` plus a border that becomes a tick. That depends on
// the browser dropping its own rendering of the control, and where it does not,
// the geometry applies and the colours do not - which is exactly a grey rotated
// rectangle. Everywhere else in WeKan a checkbox is a `.materialCheckBox` DIV
// with `is-checked`, which has no native rendering to lose, so these panes use
// that too.
//
// Two of them could not be unchecked at all for a second reason: their state was
// written as `checked="{{filesystemRead}}"` - a quoted STRING. In HTML the
// `checked` attribute is boolean, so `checked="false"` means CHECKED.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/settings/attachments.jade');
const js = read('client/components/settings/attachments.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('adminAttachmentCheckboxes:');

test('no native checkbox is left on these panes', () => {
  assert.ok(!/type="checkbox"/.test(jade),
    'a native checkbox depends on the browser honouring appearance: none');
  assert.ok(!/checked="\{\{/.test(jade),
    'and `checked="{{x}}"` is a STRING - checked="false" is checked');
});

test('every one of them is the material checkbox WeKan uses everywhere else', () => {
  const boxes = [...jade.matchAll(/\.materialCheckBox([#.][\w-]+)?\(?[^\n]*/g)].map(m => m[0]);
  assert.ok(boxes.length >= 12, `expected every pane's boxes, found ${boxes.length}`);

  // Each one says what it is bound to, or carries is-checked outright (Backup's
  // three, which start on).
  for (const box of boxes) {
    assert.ok(/is-checked/.test(box), `${box.trim()} must express its state`);
  }

  // Escape EVERY regex metacharacter, the backslash included and FIRST - escaping
  // only the dots left a backslash in the value able to change the meaning of the
  // pattern it is spliced into (CodeQL js/incomplete-sanitization, alert #429).
  // The same helper as tests/testsAreRegistered.test.cjs, for the same reason.
  const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // The ones that mirror a setting are bound to that setting.
  for (const [id, helper] of [
    ['filesystem-read', 'filesystemRead'], ['gridfs-read', 'gridfsRead'],
    ['s3-enabled', 'cloudEnabled.s3'], ['s3-read', 'cloudRead.s3'],
    ['azure-enabled', 'cloudEnabled.azure'], ['azure-read', 'cloudRead.azure'],
    ['gcs-enabled', 'cloudEnabled.gcs'], ['gcs-read', 'cloudRead.gcs'],
    ['s3-force-path-style', 'cloudValue.s3.forcePathStyle'],
  ]) {
    const re = new RegExp(
      `\\.materialCheckBox#${escapeRegExp(id)}\\(class="\\{\\{#if ${escapeRegExp(helper)}\\}\\}is-checked`);
    assert.ok(re.test(jade), `#${id} must follow ${helper}`);
  }
});

test('a click toggles the box, and what reads it asks for is-checked', () => {
  assert.ok(/'click a\.js-toggle-checkbox'/.test(js), 'the plain boxes toggle');
  assert.ok(/\.find\('\.materialCheckBox'\)\.toggleClass\('is-checked'\)/.test(js),
    'by toggling the class the CSS keys on');

  // The two that save immediately toggle first and then write.
  for (const storage of ['filesystem', 'gridfs']) {
    const at = js.indexOf(`'click a.js-toggle-${storage}-read'`);
    assert.notStrictEqual(at, -1, `${storage} read must have a click handler`);
    const handler = js.slice(at, js.indexOf('\n  },', at));
    assert.ok(/toggleClass\('is-checked'\)/.test(handler), 'it toggles');
    assert.ok(/hasClass\('is-checked'\)/.test(handler), 'and saves what it toggled to');
  }

  // Nothing reads a native checkbox any more.
  assert.ok(!/is\(':checked'\)/.test(js), "no `.is(':checked')` read is left");
  assert.ok(!/\.prop\('checked'\)/.test(js), "no `.prop('checked')` read is left");
  assert.ok(/hasClass\('materialCheckBox'\)/.test(js),
    'the cloud form reads the box by its class');

  // A refused save must put the box back.
  const at = js.indexOf('function updateStorageConfigField');
  const fn = js.slice(at, js.indexOf('\nfunction ', at + 10));
  assert.ok(/toggleClass\('is-checked'\)/.test(fn),
    'a failed save must undo the toggle, or the setting looks saved when it is not');
});

test('the Backup pane still asks for its three parts', () => {
  for (const cls of ['js-backup-attachments', 'js-backup-avatars', 'js-backup-data']) {
    assert.ok(new RegExp(`\\.materialCheckBox\\.${cls}\\.is-checked`).test(jade),
      `${cls} is a material checkbox, on by default`);
    assert.ok(new RegExp(`\\.${cls}'\\)\\.hasClass\\('is-checked'\\)`).test(js),
      `${cls} is read as a material checkbox`);
  }
});

test('the converted rows are laid out as rows, not as full-height columns', () => {
  // `.flex` is `display: flex; height: 100%`, so an anchor that is one ITEM of a
  // row would stretch to the row's height and pull its box off its words.
  const css = read('client/components/settings/attachments.css');
  const rule = /storage-rw-item a\.flex,[\s\S]*?\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the storage rows must place their checkbox anchors');
  assert.ok(/align-items: center;/.test(rule[1]) && /height: auto;/.test(rule[1]),
    'centred on the label, and only as tall as it needs');

  const settings = read('client/components/settings/settingBody.css');
  const row = /\.setting-content \.checkbox-row label,\s*\n\.setting-content \.checkbox-row a\.flex \{([^}]*)\}/
    .exec(settings);
  assert.ok(row, 'the Backup include row must place both shapes of item');
  assert.ok(/height: auto;/.test(row[1]), 'and neither may take the row\'s height');
});

console.log(`\n${passed} tests passed`);
