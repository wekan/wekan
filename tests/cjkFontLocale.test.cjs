'use strict';

// Regression coverage for #914. Chinese and Japanese share many Unicode Han
// code points, so a Japanese-specific font in the global fallback stack can
// draw Chinese text with Japanese glyphs. The default must remain neutral and
// the document language must follow the selected locale so the browser can
// choose locale-appropriate glyph variants.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const withoutComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the global UI stack contains no Japanese-specific fallback', () => {
  const css = withoutComments(read('client/components/main/layouts.css'));
  const sharedRule = css.match(/html,\s*\nbody,\s*\ninput,[\s\S]*?\{([\s\S]*?)\}/);
  assert.ok(sharedRule, 'the shared html/body/form-control rule must exist');
  const family = sharedRule[1].match(/font-family:\s*([^;]+);/);
  assert.ok(family, 'the shared UI must declare its default font stack');
  assert.match(family[1], /Arial/);
  assert.match(family[1], /sans-serif/);
  assert.doesNotMatch(family[1], /Yu Gothic|Meiryo/i);
});

test('the initial layout declares the current locale on html', () => {
  const jade = read('client/components/main/layouts.jade');
  const js = read('client/components/main/layouts.js');
  assert.match(jade, /html\(lang="\{\{htmlLang\}\}" dir="\{\{htmlDir\}\}"\)/);
  assert.match(js, /htmlLang\(\)[\s\S]{0,100}TAPi18n\.getLanguage\(\)/);
});

test('later language changes update the root language reactively', () => {
  const js = read('client/lib/i18n.js');
  assert.match(js, /Tracker\.autorun\(\(\) => \{[\s\S]{0,300}TAPi18n\.getLanguage\(\)/);
  assert.match(js, /document\.documentElement\.lang = lang/);
  assert.match(js, /document\.documentElement\.dir = dir/);
});

console.log(`\ncjkFontLocale: ${passed} tests passed`);
