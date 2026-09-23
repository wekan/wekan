'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const { DATE_FORMATS, resolveDateFormat } = require('../models/lib/dateFormatPolicy');
const read = file => fs.readFileSync(file, 'utf8');

test('enabled member, board and global formats cascade in that order', () => {
  for (const globalDateFormat of DATE_FORMATS) for (const preferred of DATE_FORMATS) {
    const setting = { hideDateFormat: true, globalDateFormat };
    const board = { dateFormatOverride: true, dateFormat: 'MM-DD-YYYY-date-only' };
    assert.equal(resolveDateFormat(preferred, setting, board, true), preferred);
    assert.equal(resolveDateFormat(preferred, setting, board, false), board.dateFormat);
    board.dateFormatOverride = false;
    assert.equal(resolveDateFormat(preferred, setting, board, false), globalDateFormat);
    setting.hideDateFormat = false;
    assert.equal(resolveDateFormat(preferred, setting, board, false), DATE_FORMATS[0]);
  }
  assert.equal(resolveDateFormat('invalid', {hideDateFormat: true, globalDateFormat: 'DD-MM-YYYY'}, {dateFormatOverride: true, dateFormat: 'invalid'}, true), 'DD-MM-YYYY');
  assert.equal(resolveDateFormat(null, null), DATE_FORMATS[0]);
});

test('exports follow the same scope flags for members and guests', () => {
  const setting = { hideDateFormat: true, globalDateFormat: 'DD-MM-YYYY' };
  const board = { dateFormatOverride: true, dateFormat: 'YYYY-MM-DD-date-only' };
  let user = { profile: { dateFormatOverride: true }, getDateFormat: () => 'MM-DD-YYYY' };
  const context = {
    require: () => ({ resolveDateFormat }),
    Utils: { getCurrentBoard: () => board },
    ReactiveCache: { getCurrentSetting: () => setting, getCurrentUser: () => user },
  };
  vm.runInNewContext(read('client/lib/exportLocale.js').replace(/^import .*;\n/gm, '').replace(/export function/g, 'function'), context);
  assert.equal(context.cardDateFormat(), 'MM-DD-YYYY');
  user.profile.dateFormatOverride = false;
  assert.equal(context.cardDateFormat(), board.dateFormat);
  user = null;
  assert.equal(context.cardDateFormat(), board.dateFormat);
  board.dateFormatOverride = false;
  assert.equal(context.cardDateFormat(), 'DD-MM-YYYY');
});

test('Date has its own global save and board/member popups, never a card selector', () => {
  const jade = read('client/components/settings/settingBody.jade');
  assert.ok(jade.indexOf('.js-visibility-all-boards-save') < jade.indexOf('#global-date-format-enabled'));
  assert.ok(jade.indexOf('#global-date-format') < jade.indexOf('.js-visibility-date-save'));
  assert.doesNotMatch(jade, /date-format-for-everyone/);
  assert.doesNotMatch(read('client/components/settings/settingBody.js'), /'click a\.js-toggle-hide-logo, click a\.js-toggle-date-format'/);
  assert.match(read('client/components/cards/cardDetails.jade'), /label="date"/);
  assert.doesNotMatch(read('client/components/cards/cardDetails.jade'), /js-date-format-selector/);
  assert.match(read('client/components/sidebar/sidebar.js'), /Popup.open\('boardDateSettings'/);
  assert.match(read('client/components/users/userHeader.js'), /Popup.open\('memberDateSettings'/);
  assert.match(read('server/permissions/settings.js'), /user && user.isAdmin/);
});

test('date popup labels reuse translations available in every locale', () => {
  const popup = read('client/components/forms/dateFormatSettings.jade');
  const keys = [...popup.matchAll(/{{_ '([^']+)'/g)].map(match => match[1]);
  const englishLabels = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const file of fs.readdirSync('imports/i18n/data').filter(name => name.endsWith('.i18n.json'))) {
    const locale = JSON.parse(read(`imports/i18n/data/${file}`));
    for (const key of keys) {
      assert.ok(locale[key], `${file}: ${key}`);
      const tokens = value => (value.match(/__\w+__|%(?:\d+\$)?[a-z]/gi) || []).sort();
      assert.deepEqual(tokens(locale[key]), tokens(englishLabels[key]), `${file}: ${key}`);
    }
  }
  const key = 'date-format-for-everyone';
  const english = JSON.parse(read('imports/i18n/data/en.i18n.json'))[key];
  const tokens = value => (value.match(/__\w+__|%(?:\d+\$)?[a-z]/gi) || []).sort();
  for (const file of fs.readdirSync('imports/i18n/data').filter(name => name.endsWith('.i18n.json'))) {
    const value = JSON.parse(read(`imports/i18n/data/${file}`))[key];
    assert.ok(value, file);
    if (!/^en(?:[-_.])/.test(file)) assert.notEqual(value, english, file);
    assert.deepEqual(tokens(value), tokens(english), file);
  }
  assert.match(read('client/components/boards/charts/exportChart.js'), /dateFormat: cardDateFormat\(\)/);
});

test('member Date is a direct menu entry and owns the calendar controls', () => {
  const header = read('client/components/users/userHeader.jade');
  assert.ok(header.slice(0, header.indexOf('template(name="changeSettingsPopup")')).includes('a.js-member-date-settings'));
  const oldPopup = header.split('template(name="changeSettingsPopup")')[1].split('template(name="userDeletePopup")')[0];
  assert.doesNotMatch(oldPopup, /js-member-date-settings|start-day-of-week|calendar-system/);
  const editor = read('client/components/forms/dateFormatSettings.jade');
  assert.ok(editor.indexOf('select.js-date-format-select') < editor.indexOf('select#start-day-of-week'));
  assert.ok(editor.indexOf('select#start-day-of-week') < editor.indexOf('select#calendar-system'));
  const save = read('client/components/users/userHeader.js').split("'click .js-apply-user-settings'")[1].split('// #5778')[0];
  assert.doesNotMatch(save, /changeStartDayOfWeek|changeCalendarSystem/);
});

test('week-of-year toggle is below the board Date editor and its rule', () => {
  const popup = read('client/components/forms/dateFormatSettings.jade').split('template(name="memberDateSettingsPopup")')[0];
  assert.match(popup, /dateFormatEditor\(scope="board"\)\s+hr\s+ul.show-week-of-year-toggle/);
  assert.doesNotMatch(read('client/components/sidebar/sidebar.jade'), /js-show-week-of-year-toggle/);
  assert.match(read('client/components/forms/dateFormatSettings.js'), /Template.boardDateSettingsPopup.events/);
});

test('member format status and separators match the grouped Date layout', () => {
  const jade = read('client/components/forms/dateFormatSettings.jade');
  assert.match(jade, /unless isMember\s+hr\s+form.js-date-format-form/);
  assert.match(jade, /strong.js-member-date-format-heading.*memberMenuPopup-title.*date-format/);
  assert.match(jade, /if isMember\s+hr\s+label.bold.clear/);
  assert.match(jade, /hr\s+label.bold.clear\s+i.fa.fa-calendar-check-o/);
  assert.match(read('client/components/forms/dateFormatSettings.js'), /overrideDraft.set\(event.currentTarget.checked\)/);
});
