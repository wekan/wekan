'use strict';

// The findings of docs/Features/General/Accessibility/Audit.md (an axe-core scan
// of the default theme), fixed and pinned by the shape of each fault, so none of
// them can return anywhere in the tree. tests/playwright/specs/45-axe-accessibility
// e2e.js scans the rendered pages; this reads the sources, where it can say "and
// nowhere else".
//
// Run: node tests/accessibilityAuditFixes.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
function files(dir, ext, out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files(rel, ext, out);
    else if (entry.name.endsWith(ext)) out.push(rel);
  }
  return out;
}
const css = files('client', '.css');

function luminance(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map(c => c + c).join('');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('accessibilityAuditFixes:');

test('WCAG 1.4.3: the default theme\'s blue carries the header text at AA, and the old blue is gone', () => {
  const colors = read('client/components/boards/boardColors.css');
  const belize = /\.board-color-belize \{[^}]*--board-theme-accent: (#[0-9a-f]{6});/.exec(colors);
  assert.ok(belize, 'the default theme names its accent');
  assert.ok(ratio('#ffffff', belize[1]) >= 4.5, `white on ${belize[1]}`);
  assert.ok(ratio('#f2f2f2', belize[1]) >= 4.5, `the #f2f2f2 button labels on ${belize[1]}`);
  const header = /#header \{[^}]*background: (#[0-9a-f]{6});/.exec(read('client/components/main/header.css'));
  assert.equal(header[1], belize[1], 'the header bar is the same blue as the theme');
  // negative: nowhere in the stylesheets or the accent table does the old blue remain
  for (const file of [...css, 'models/lib/themeAccents.js', 'client/components/main/themeColorPicker.js']) {
    assert.ok(!/#2980b9/i.test(read(file)) || /\/\*[^*]*#2980b9/.test(read(file)), `${file} still has #2980b9 as a colour`);
  }
  assert.match(read('models/lib/themeAccents.js'), /belize: '#2573a7'/);
});

test('WCAG 1.4.3: every label colour has text of at least 4.5 on it', () => {
  const labels = read('client/components/cards/labels.css');
  const seen = [];
  for (const m of labels.matchAll(/\.card-label-([a-z]+) \{([^}]*)\}/g)) {
    const bg = /background-color:\s*(#[0-9a-fA-F]{3,6})/.exec(m[2]);
    if (!bg) continue;
    const text = (/(?:^|\s)color:\s*(#[0-9a-fA-F]{3,6})/.exec(m[2]) || [])[1] || '#ffffff';
    seen.push(m[1]);
    // hover states in this file only change the text, never the fill
    assert.ok(ratio(text, bg[1]) >= 4.5, `.card-label-${m[1]}: ${text} on ${bg[1]} is ${ratio(text, bg[1]).toFixed(2)}`);
  }
  assert.ok(seen.length > 20, 'the whole palette was read');
});

test('WCAG 1.4.3: the quiet greys and grey tiles are dark enough on the page greys', () => {
  for (const file of css) {
    const text = read(file);
    assert.ok(!/(?<![-\w])color: #8c8c8c/.test(text), `${file}: text #8c8c8c is 2.5 on the page grey`);
    assert.ok(!/(?<![-\w])color: #727479/.test(text), `${file}: text #727479 is 3.5 on the page grey`);
  }
  for (const bg of ['#dedede', '#f7f7f7', '#e4e4e4']) {
    assert.ok(ratio('#595959', bg) >= 4.5 && ratio('#5a5c61', bg) >= 4.5, `the replacement greys on ${bg}`);
  }
  assert.ok(ratio('#ffffff', '#767676') >= 4.5, 'white on the grey tiles');
  assert.doesNotMatch(read('client/components/boards/boardsList.css'), /\.board-list \.js-add-board \.label \{[^}]*background-color: #999/);
  assert.match(read('client/components/main/globalSearch.css'), /\.list-title \{[^}]*color: #000/);
});

test('WCAG 2.5.3 Label in Name: header controls and avatars carry their visible text in their name', () => {
  const header = read('client/components/main/header.jade');
  assert.match(header, /js-open-starred-boards\(title="[^"]*" aria-label="\{\{starredBoardsCount\}\} /);
  const bar = read('client/components/users/userHeader.jade');
  assert.match(bar, /js-open-header-member-menu\([^)]*aria-label="\{\{userBarLabel\}\}"/);
  assert.match(read('client/components/users/userHeader.js'), /userBarLabel\(\)/);
  const avatar = read('client/components/users/userAvatar.jade');
  assert.match(avatar, /a\.member\([^\n]*aria-label="\{\{initialsInName\}\}/);
  assert.match(read('client/components/users/userAvatar.js'), /initialsInName\(\)/);
});

test('WCAG 4.1.2: the card\'s fields have a name, and the editor takes one', () => {
  assert.match(read('client/components/main/editor.jade'), /aria-label=labelText/);
  assert.match(read('client/components/main/editor.js'), /labelText\(\) \{[\s\S]{0,160}data\.labelKey \? TAPi18n\.__\(data\.labelKey\)/);
  for (const [file, pattern] of [
    ['client/components/activities/comments.jade', /\+editor\(class="js-new-comment-input" labelKey="comment"\)/],
    ['client/components/activities/comments.jade', /\+editor\(autofocus=true labelKey="comment"\)/],
    ['client/components/cards/cardDescription.jade', /labelKey="description"/],
    ['client/components/cards/cardPomodoro.jade', /js-pomodoro-work-minutes[^\n]*aria-label=/],
  ]) assert.match(read(file), pattern, file);
});

test('WCAG 4.1.2: a card section heading is a heading holding a button, and the controls are beside the button', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  const header = jade.slice(jade.indexOf('template(name="cardSectionHeader")'), jade.indexOf('template(name="editCardTitleForm")'));
  assert.doesNotMatch(header, /role="button"/, 'no heading with a button role');
  assert.doesNotMatch(header, /tabindex=/, 'the heading is not a tab stop; the button is');
  assert.match(header, /h3\.card-details-item-title\.js-toggle-card-section\(data-section="\{\{section\}\}"\)/);
  assert.match(header, /button\.card-details-section-toggle\(type="button" aria-expanded="\{\{#if isSectionOpen section\}\}true\{\{else\}\}false\{\{\/if\}\}"\)/);
  // The button's content is indented under it; the layout toggle and the menu are not.
  const lines = header.split('\n');
  const at = lines.findIndex(l => /button\.card-details-section-toggle/.test(l));
  const indent = l => l.match(/^ */)[0].length;
  const inside = [];
  for (let i = at + 1; i < lines.length && (lines[i].trim() === '' || indent(lines[i]) > indent(lines[at])); i += 1) inside.push(lines[i]);
  assert.ok(!inside.some(l => /card-details-section-menu|custom-fields-layout-toggle|\ba\.|\bbutton\./.test(l)), 'nothing focusable inside the toggle button');
  assert.ok(/card-details-section-menu/.test(header) && /custom-fields-layout-toggle/.test(header), 'both controls are still there');
});

test('WCAG 1.3.1 / 2.4.6: the pages have one level-one heading, and the sign-in form has a main landmark', () => {
  assert.match(read('client/components/main/header.jade'), /span\.header-page-title\(title="\{\{headerTitleFullPath\}\}" role="heading" aria-level="1"/);
  const layouts = read('client/components/main/layouts.jade');
  const forms = layouts.slice(layouts.indexOf('template(name="userFormsLayout")'));
  assert.doesNotMatch(forms.slice(0, 1800), /h1\.at-form-landing-logo/, 'no empty h1 as a spacer');
  assert.match(forms, /section\.auth-layout\(role="main"\)/);
  assert.match(read('client/components/main/layouts.js'), /\.at-title h1, \.at-title h2, \.at-title h3[\s\S]{0,200}setAttribute\('aria-level', '1'\)/);
  const titles = require('../models/lib/pageTitles');
  for (const route of ['import-start', 'activity-feed', 'bookmarks', 'import', 'accessibility', 'due-cards']) {
    assert.ok(titles.pageTitleKey(route), `${route} is named in the bar, so its h1 has text`);
  }
  assert.match(read('client/components/main/dueCards.jade'), /\.no-results\n\s+h2 /, 'no h3 straight after the h1');
});

console.log(`accessibilityAuditFixes: ${passed} tests passed`);
