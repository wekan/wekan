'use strict';

// Cross-page keyboard and screen-reader contracts. These checks deliberately
// target shared primitives: fixing one template covers every page that uses it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

const accessibility = read('client/lib/accessibility.js');
const tabsTemplate = read('client/components/lib/basicTabs.jade');
const tabsClient = read('client/components/lib/basicTabs.js');
const archiveTemplate = read('client/components/sidebar/sidebarArchives.jade');
const archiveClient = read('client/components/sidebar/sidebarArchives.js');
const popupClient = read('client/lib/popup.js');
const popupEvents = read('client/components/main/popup.js');
const layouts = read('client/components/main/layouts.js');
const password = read('client/components/users/passwordInput.jade');
const card = read('client/components/cards/cardDetails.jade');
const minicard = read('client/components/cards/minicard.jade');
const customFields = read('client/components/cards/cardCustomFields.jade');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

console.log('accessibilityTabOrder:');

test('no template uses a positive tabindex that overrides DOM order', () => {
  const offenders = [];
  for (const file of walk(path.join(root, 'client')).filter(file => /\.jade$/.test(file))) {
    const source = fs.readFileSync(file, 'utf8');
    source.split('\n').forEach((line, index) => {
      if (/tabindex\s*=\s*["']?[1-9]/.test(line)) {
        offenders.push(`${path.relative(root, file)}:${index + 1}`);
      }
    });
  }
  assert.deepStrictEqual(offenders, []);
});

test('every image in a template declares alternative text intent', () => {
  const offenders = [];
  for (const file of walk(path.join(root, 'client')).filter(file => /\.jade$/.test(file))) {
    const source = fs.readFileSync(file, 'utf8');
    source.split('\n').forEach((line, index) => {
      if (/^\s*img(?:[.(]|$)/.test(line) && !/\balt=/.test(line)) {
        offenders.push(`${path.relative(root, file)}:${index + 1}`);
      }
    });
  }
  assert.deepStrictEqual(offenders, []);
});

test('links are naturally focusable and title tooltips become accessible names', () => {
  assert.match(accessibility, /attributes\.href = '#'/);
  assert.match(accessibility, /attributes\['aria-label'\] = attributes\.title/);
});

test('password visibility follows the input in normal Tab order', () => {
  assert.doesNotMatch(password, /password-toggle-btn[^\n]*tabindex="-1"/);
  assert.match(password, /aria-label="\{\{_ 'password'\}\}: \{\{_ 'visibility'\}\}"/);
  assert.strictEqual((password.match(/aria-hidden="true"/g) || []).length, 2);
});

test('shared tabs expose tablist, tab and tabpanel relationships', () => {
  assert.match(tabsTemplate, /ul\.tabs-list\(role="tablist"\)/);
  assert.match(tabsTemplate, /role="tab"[\s\S]*tabindex="\{\{tabIndex slug\}\}"[\s\S]*aria-selected=/);
  assert.match(tabsTemplate, /role="tabpanel"[\s\S]*aria-labelledby=/);
  assert.match(tabsClient, /ArrowRight[\s\S]*ArrowLeft[\s\S]*Home[\s\S]*End/);
  assert.match(tabsClient, /Tracker\.afterFlush[\s\S]*\.focus\(\)/);
});

test('the archive tabs have the same keyboard model', () => {
  assert.match(archiveTemplate, /ul\.tabs-list\(role="tablist"\)/);
  assert.match(archiveTemplate, /role="tab"[\s\S]*aria-selected=/);
  assert.match(archiveTemplate, /role="tabpanel"[\s\S]*aria-labelledby=/);
  assert.match(archiveClient, /keydown \.tab-item[\s\S]*ArrowRight[\s\S]*Home[\s\S]*\.focus\(\)/);
});

test('popups focus their content, contain Tab, and restore their opener', () => {
  assert.match(popupClient, /focusFirstControl\(\)[\s\S]*\[autofocus\]/);
  assert.match(popupEvents, /keydown \.js-pop-over[\s\S]*event\.key !== 'Tab'/);
  assert.match(popupEvents, /event\.shiftKey[\s\S]*last\.focus\(\)[\s\S]*first\.focus\(\)/);
  assert.match(popupClient, /openerElement\?\.isConnected[\s\S]*openerElement\.focus\(\)/);
});

test('modals contain Tab and restore the previously focused control', () => {
  assert.match(layouts, /keydown #modal[\s\S]*event\.key !== 'Tab'/);
  assert.match(layouts, /event\.shiftKey[\s\S]*last\.focus\(\)[\s\S]*first\.focus\(\)/);
  assert.match(layouts, /lastFocused = document\.activeElement[\s\S]*lastFocused\.focus\(\)/);
});

test('card and minicard edit targets are keyboard reachable', () => {
  assert.match(card, /a\.card-collapse-toggle\.js-card-collapse-toggle/);
  assert.match(card, /a\.card-details-title-edit-zone\.js-open-inlined-form/);
  assert.match(minicard, /a\.minicard-title-edit-zone\.js-open-inlined-form/);
  assert.match(customFields,
    /js-card-custom-field-checkbox\.js-edit-card-custom-field-value[\s\S]*role="button" tabindex="0"/);
});

console.log(`\n${passed} tests passed`);
