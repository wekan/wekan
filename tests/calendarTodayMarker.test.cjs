'use strict';

// #6751: "it would make easier to work with calendar if today cell number
// color or style was different". The due/start/end date popup (WeKan's own
// calendarDateInput) marks today's cell - class and aria-current="date" - and
// styles it so that no board colour theme can hide it; the board Calendar view
// (FullCalendar's .fc-day-today) marks today's day NUMBER as well.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const calendars = require('../imports/lib/calendarSystems');
const months = require('../imports/lib/calendarMonth');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const iso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
class ReactiveVar { constructor(value) { this.value = value; } get() { return this.value; } set(value) { this.value = value; } }

// ---------------------------------------------------------------------------
// 1. The helper marks exactly today's cell, in every calendar system.
// ---------------------------------------------------------------------------
function loadPicker(calendarSystem) {
  let created, helpers;
  const data = { value: '', inputId: 'date', inline: true };
  let tpl;
  const context = {
    Template: {
      calendarDateInput: { onCreated(fn) { created = fn; }, helpers(map) { helpers = map; }, events() {} },
      currentData: () => data, instance: () => tpl,
    },
    ReactiveVar, Date, Intl, Event: class {},
    Tracker: { afterFlush: fn => fn() },
    ReactiveCache: { getCurrentUser: () => ({ getStartDayOfWeek: () => 1 }) },
    TAPi18n: { getLanguage: () => 'en', __: key => key },
    dateDisplayPreferences: () => ({ calendarSystem }),
    formatDateForDisplay: date => (date ? iso(date) : ''),
    formatDate: iso,
    getComputedStyle: () => ({ direction: 'ltr' }),
    require: name => (name.endsWith('calendarMonth') ? months : calendars),
  };
  vm.runInNewContext(read('client/components/forms/calendarDateInput.js').replace(/^import .*;\n/gm, ''), context);
  tpl = { data, autorun: fn => fn(), firstNode: {}, find: () => null };
  created.call(tpl);
  return { tpl, helpers };
}

for (const system of ['gregorian', 'jalali']) {
  const { tpl, helpers } = loadPicker(system);
  // Midnight may pass between the two clocks; accept either side of it.
  const before = iso(new Date());
  const cells = helpers.weeks().flatMap(row => row.days).filter(Boolean);
  const after = iso(new Date());
  const marked = cells.filter(day => day.today);
  assert.equal(marked.length, 1, `${system}: exactly one cell of the current month is today`);
  assert.ok([before, after].includes(marked[0].iso), `${system}: the marked cell is today's local date`);
  assert.equal(marked[0].ariaCurrent, 'date', `${system}: today's button carries aria-current="date"`);

  // Negative: no other day carries the marker or aria-current.
  for (const day of cells.filter(cell => cell !== marked[0])) {
    assert.equal(day.today, false, `${system}: ${day.iso} is not today`);
    assert.equal(day.ariaCurrent, null, `${system}: ${day.iso} has no aria-current (null omits the attribute)`);
  }

  // Negative: a month that does not contain today marks nothing, including
  // the same day number a year away.
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  tpl.shownDate.set(yearAgo);
  const other = helpers.weeks().flatMap(row => row.days).filter(Boolean);
  assert.ok(other.length >= 28);
  assert.equal(other.filter(day => day.today || day.ariaCurrent).length, 0,
    `${system}: a month without today marks no cell`);

  // Selecting another day does not move the today marker.
  tpl.shownDate.set(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tpl.selectedDate.set(tomorrow);
  const withSelection = helpers.weeks().flatMap(row => row.days).filter(Boolean);
  const selected = withSelection.find(day => day.selected);
  if (selected) assert.equal(selected.today, false, `${system}: the selected day (tomorrow) is not today`);
  assert.ok(withSelection.filter(day => day.today).length <= 1);
}

// ---------------------------------------------------------------------------
// 2. The template renders the marker on the button and its cell.
// ---------------------------------------------------------------------------
const jade = read('client/components/forms/calendarDateInput.jade');
const dayButton = jade.split('\n').find(line => /button\.primary\.js-calendar-day\(/.test(line));
assert.ok(dayButton, 'the day button is in the template');
assert.match(dayButton, /class="\{\{#if today\}\}is-today\{\{\/if\}\}"/, 'today\'s button gets .is-today');
assert.match(dayButton, /aria-current=ariaCurrent/, 'aria-current comes from the helper, null on other days');
assert.doesNotMatch(dayButton, /aria-current="date"/, 'aria-current is never hard-coded onto every day');
assert.match(jade, /td\(class="\{\{#if this\.today\}\}is-today-cell\{\{\/if\}\}"\)/, 'today\'s cell gets .is-today-cell');

// ---------------------------------------------------------------------------
// 3. The style exists and nothing can override it.
// ---------------------------------------------------------------------------
const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = re.exec(stripComments(css)))) {
    const selector = match[1].replace(/@[^{]*$/, '').trim();
    out.push({ selector, body: match[2] });
  }
  return out;
}
// Specificity [ids, classes, elements] of one simple selector; :is()/:where()
// count as their most specific / no argument, which is enough for WeKan's CSS.
function specificity(selector) {
  let s = selector;
  let extra = [0, 0, 0];
  s = s.replace(/:where\([^()]*\)/g, ' ');
  s = s.replace(/:(is|not|has)\(([^()]*)\)/g, (_, kind, args) => {
    const best = args.split(',').map(arg => specificity(arg.trim()))
      .sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0] || [0, 0, 0];
    extra = extra.map((value, index) => value + best[index]);
    return ' ';
  });
  const ids = (s.match(/#[\w-]+/g) || []).length;
  const classes = (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length;
  const elements = (s.replace(/\[[^\]]*\]/g, '').match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length
    + (s.match(/::[\w-]+/g) || []).length;
  return [ids + extra[0], classes + extra[1], elements + extra[2]];
}
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const splitList = selector => {
  const parts = [];
  let depth = 0, current = '';
  for (const ch of selector) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; } else current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const pickerCss = read('client/components/forms/calendarDateInput.css');
const todaySelector = '.calendar-date-input .selected-calendar-picker button.js-calendar-day.is-today';
const todayRule = rules(pickerCss).find(rule => rule.selector === todaySelector);
assert.ok(todayRule, 'the picker has a today rule');
assert.match(todayRule.body, /box-shadow:\s*inset 0 0 0 3px currentColor/, 'today has a ring in the button\'s own text colour');
assert.match(todayRule.body, /font-weight:\s*bold/);
assert.match(todayRule.body, /text-decoration:\s*underline/);
assert.doesNotMatch(todayRule.body, /(margin|padding|border)-(left|right)|\b(left|right):/, 'RTL-safe: no physical sides');
const cellRule = rules(pickerCss).find(rule => /td\.is-today-cell/.test(rule.selector));
assert.ok(cellRule && /background:\s*color-mix\(in srgb, currentColor/.test(cellRule.body),
  'today\'s cell has a subtle background derived from the text colour (light and dark themes)');

// Negative: no rule anywhere in client/ that can reach a picker day button
// overrides the today marker - neither with !important nor with a higher
// specificity - and nothing hides an .is-today element.
const mine = specificity(todaySelector);
const cssFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.css')) cssFiles.push(full);
  }
})(path.join(root, 'client'));
assert.ok(cssFiles.length > 10);
const guarded = /(^|;)\s*(box-shadow|text-decoration(-line)?|font-weight)\s*:/;
let competing = 0;
for (const file of cssFiles) {
  for (const rule of rules(fs.readFileSync(file, 'utf8'))) {
    for (const sel of splitList(rule.selector)) {
      if (sel === todaySelector) continue;
      assert.doesNotMatch(`${sel}{${rule.body}}`, /\.is-today\b[^{]*\{[^}]*(display\s*:\s*none|visibility\s*:\s*hidden)/,
        `${path.relative(root, file)}: ${sel} must not hide today`);
      const reachesDay = /selected-calendar-picker|js-calendar-day|calendar-date-input/.test(sel)
        && /(button|js-calendar-day|\.primary)[^\s>+~]*$/.test(sel);
      if (!reachesDay || !guarded.test(rule.body)) continue;
      competing += 1;
      const body = rule.body.split(';').filter(decl => /^\s*(box-shadow|text-decoration(-line)?|font-weight)\s*:/.test(decl));
      for (const decl of body) {
        assert.doesNotMatch(decl, /!important/,
          `${path.relative(root, file)}: "${sel} { ${decl.trim()} }" would override today's marker`);
      }
      // Rules that only apply in other states (selected, hover) may be equal or
      // higher; plain ones must lose to the today rule.
      if (/:hover|:active|:focus|aria-pressed/.test(sel)) continue;
      assert.ok(compare(specificity(sel), mine) < 0,
        `${path.relative(root, file)}: "${sel}" (${specificity(sel)}) must be less specific than the today rule (${mine})`);
    }
  }
}

// The scan is not vacuous: board themes style the picker's buttons.
assert.ok(competing >= 3, `theme rules for picker buttons were examined (${competing})`);

// ---------------------------------------------------------------------------
// 4. Board Calendar view: FullCalendar's today cell gets a marked number.
// ---------------------------------------------------------------------------
const boardCss = read('client/components/boards/calendarView.css');
const numberRule = rules(boardCss).find(rule =>
  rule.selector === '.calendar-view .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number');
assert.ok(numberRule, 'board calendar marks today\'s day number');
assert.match(numberRule.body, /background:\s*var\(--board-theme-dark, var\(--theme-accent, #005377\)\)/,
  'it follows the board colour theme');
assert.match(numberRule.body, /color:\s*#fff/);
assert.match(numberRule.body, /border-radius:\s*999px/);
// Negative: only today's number is marked, and FullCalendar's own today tint is
// not switched off anywhere.
for (const rule of rules(boardCss)) {
  if (/fc-daygrid-day-number/.test(rule.selector) && /background/.test(rule.body)) {
    assert.match(rule.selector, /\.fc-day-today/, 'only today\'s number gets a background');
  }
}
for (const file of cssFiles) {
  const css = stripComments(fs.readFileSync(file, 'utf8'));
  assert.doesNotMatch(css, /--fc-today-bg-color\s*:\s*(transparent|none)/, `${path.relative(root, file)} hides FullCalendar's today tint`);
  assert.doesNotMatch(css, /fc-daygrid-day-number[^{]*\{[^}]*!important/, `${path.relative(root, file)} forces day-number style`);
}

console.log('calendarTodayMarker: date popup and board calendar mark today, and nothing hides it');
