'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const { DATE_FORMATS, resolveDateFormat } = require('../models/lib/dateFormatPolicy');
const read = file => fs.readFileSync(file, 'utf8');

test('global format overrides every personal format only while enabled', () => {
  for (const globalDateFormat of DATE_FORMATS) for (const preferred of [...DATE_FORMATS, undefined]) {
    assert.equal(resolveDateFormat(preferred, { hideDateFormat: true, globalDateFormat }), globalDateFormat);
    assert.equal(resolveDateFormat(preferred, { hideDateFormat: false, globalDateFormat }), preferred || DATE_FORMATS[0]);
  }
  assert.equal(resolveDateFormat('MM-DD-YYYY', { hideDateFormat: true, globalDateFormat: 'invalid' }), DATE_FORMATS[0]);
  assert.equal(resolveDateFormat(null, null), DATE_FORMATS[0]);
});

test('exports obey the same policy for users, guests and blocked local storage', () => {
  let setting = { hideDateFormat: true, globalDateFormat: 'DD-MM-YYYY' };
  let user = { getDateFormat: () => 'MM-DD-YYYY' };
  const context = {
    require: () => ({ resolveDateFormat }),
    ReactiveCache: { getCurrentSetting: () => setting, getCurrentUser: () => user },
    window: { localStorage: { getItem: () => 'YYYY-MM-DD' } },
  };
  vm.runInNewContext(read('client/lib/exportLocale.js').replace(/^import .*;\n/gm, '').replace(/export function/g, 'function'), context);
  assert.equal(context.cardDateFormat(), 'DD-MM-YYYY');
  setting.hideDateFormat = false;
  assert.equal(context.cardDateFormat(), 'MM-DD-YYYY');
  user = null;
  assert.equal(context.cardDateFormat(), 'YYYY-MM-DD');
  setting.hideDateFormat = true;
  context.window.localStorage.getItem = () => { throw Error('blocked'); };
  assert.equal(context.cardDateFormat(), 'DD-MM-YYYY');
});

test('setting is validated, published and saved beside the requested controls', () => {
  const schema = read('models/settings.js');
  assert.match(schema, /hideDateFormat: \{\s*type: Boolean/);
  assert.match(schema, /globalDateFormat: \{[\s\S]*?allowedValues: \['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'\]/);
  for (const key of ['hideDateFormat', 'globalDateFormat']) {
    assert.match(read('server/publications/settings.js'), new RegExp(`${key}: 1`));
    assert.ok(read('client/components/settings/settingBody.js').includes(key));
  }
  const jade = read('client/components/settings/settingBody.jade');
  assert.ok(jade.indexOf('#hide-board-member-list') < jade.indexOf('#hide-date-format'));
  assert.ok(jade.indexOf('#global-date-format') < jade.indexOf(".title {{_ 'wait-spinner'}}"));
  assert.match(read('client/components/cards/cardDetails.jade'), /unless isDateFormatForced\s+\.card-details-item-content\s+select.js-date-format-selector/);
  assert.match(read('client/components/cards/cardDetails.js'), /isDateFormatForced\(\) \? 'date' : 'date-format'/);
  assert.match(read('server/permissions/settings.js'), /user && user.isAdmin/);
});

test('the new setting label is translated in every locale without changing placeholders', () => {
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
