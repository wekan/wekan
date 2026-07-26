'use strict';

// Admin Panel / Settings / Visibility / Wait Spinner shows a live PREVIEW of the
// spinner the dropdown names, beside it — and below it when the pane is too narrow
// for both. Source guards: the markup, the template mapping and the CSS that does
// the wrapping (there is no browser here to measure a layout).
//
// Run: node tests/spinnerPreview.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const liveJade = s => s.replace(/^\s*\/\/-.*$/gm, '');

console.log('spinnerPreview:');

const jade = liveJade(read('client/components/settings/settingBody.jade'));
const js = read('client/components/settings/settingBody.js');
const css = read('client/components/settings/settingBody.css');
const pane = jade.slice(jade.indexOf("template(name='selectSpinnerName')"));

test('the dropdown and the preview sit in one row', () => {
  assert.ok(/\.spinner-select-row/.test(pane), 'a row holds both');
  assert.ok(pane.indexOf('select#spinnerName') < pane.indexOf('.spinner-preview'),
    'the preview follows the dropdown, so it lands to its right in LTR');
  assert.ok(/\+Template\.dynamic\(template=previewTemplate\)/.test(pane),
    'and it renders the spinner template itself, not a picture of one');
});

test('the preview drops BELOW the dropdown when there is no room beside it', () => {
  const row = css.slice(css.indexOf('.spinner-select-row {'));
  assert.ok(/display: flex;/.test(row.slice(0, 200)), 'a flex row');
  assert.ok(/flex-wrap: wrap;/.test(row.slice(0, 200)),
    'that wraps - which is what puts the preview underneath at narrow widths');
  // No hand-picked breakpoint: the row wraps at whatever width the pane has.
  assert.ok(!/@media[^{]*spinner-select-row/.test(css),
    'no media query needs to guess a width');
});

test('the preview follows the DROPDOWN, not the saved setting', () => {
  // An admin must see what they are about to save before pressing Save.
  assert.ok(/Template\.selectSpinnerName\.onCreated/.test(js), 'it keeps its own state');
  assert.ok(/this\.previewName = new ReactiveVar\(/.test(js));
  assert.ok(/'change #spinnerName'\(event, templateInstance\) \{\s*\n\s*templateInstance\.previewName\.set\(event\.currentTarget\.value\);/.test(js),
    'changing the dropdown updates it');
  // …while the option list still comes from the saved setting, so changing the
  // dropdown does not re-render the options under the pointer.
  assert.ok(/isSelected\(match\) \{\s*\n\s*return Template\.instance\(\)\.data\.spinnerName === match;/.test(js),
    'the selected option is still the saved one');
});

test('the preview names a spinner template that exists', () => {
  const { ALLOWED_WAIT_SPINNERS } = (() => {
    const src = read('config/const.js');
    const block = /ALLOWED_WAIT_SPINNERS\s*=\s*\[(.*?)\]/s.exec(src);
    return { ALLOWED_WAIT_SPINNERS: [...block[1].matchAll(/'([\w-]+)'/g)].map(m => m[1]) };
  })();
  // The mapping in the helper must be the one client/lib/spinner.js uses for the
  // real spinner, or the preview would show a different one - or nothing.
  assert.ok(/return `spinner\$\{name\.replace\(\/-\/g, ''\)\}`/.test(js),
    'name -> spinner<Name> with the dashes removed');
  const templates = fs.readdirSync(path.join(__dirname, '..', 'client/components/main'))
    .filter(f => f.startsWith('spinner') && f.endsWith('.jade'))
    .map(f => read(`client/components/main/${f}`))
    .join('\n');
  for (const name of ALLOWED_WAIT_SPINNERS) {
    const tpl = `spinner${name.replace(/-/g, '')}`;
    assert.ok(templates.includes(`template(name="${tpl}")`),
      `${name}: ${tpl} must be a real template`);
  }
});

test('a full-page spinner is scaled down to fit beside a form field', () => {
  // The spinners are written for a loading screen: `margin: 100px auto 0`, up to
  // 70px wide. Dropped into a form row unchanged they would push the dropdown away.
  const box = css.slice(css.indexOf('.spinner-select-row .spinner-preview {'));
  assert.ok(/width: 72px;[\s\S]*?height: 44px;/.test(box.slice(0, 300)),
    'a fixed box, so switching spinners does not move the dropdown');
  assert.ok(/margin: 0 auto !important;/.test(box), 'the loading-screen margin is dropped');
  assert.ok(/transform: scale\(/.test(box), 'and the spinner is scaled to fit');
});

console.log(`\n${passed} tests passed`);
