'use strict';

// #6611: card custom-field selection and checkbox changes must be acknowledged
// server writes, and deleted definitions must not leak ids into PDF/Excel.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { buildExportCardDocument } = require('../models/lib/cardExportDocument');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const client = read('client/components/cards/cardCustomFields.js');
const template = read('client/components/cards/cardCustomFields.jade');
const server = read('server/models/cards.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('customFieldInteraction:');

test('selection waits for an authorized server method', () => {
  assert.match(client, /async 'click \.js-select-field'[\s\S]*?await Meteor\.callAsync\(\s*'setCardCustomFieldAssigned'/);
  assert.doesNotMatch(client, /card\.toggleCustomField\(customFieldId\)/);
});

test('opened-card checkbox saves its value independently of visibility', () => {
  const at = client.indexOf("async 'click .js-card-custom-field-checkbox .check-box-container'");
  const body = client.slice(at, client.indexOf('\n  },', at));
  assert.match(body, /await Meteor\.callAsync\(\s*'setCardCustomFieldCheckbox'/);
  assert.match(body, /Template\.currentData\(\)/);
  assert.match(body, /!Boolean\(currentField\.value\)/);
  assert.match(body, /event\.stopPropagation\(\)/);
  assert.doesNotMatch(body, /tpl\.card\.setCustomField/);
});

test('opened-card checkbox renders the persisted value in its own context', () => {
  const at = template.indexOf('template(name="cardCustomField-checkbox")');
  const body = template.slice(at, template.indexOf(
    'template(name="cardCustomField-currency")', at));
  assert.match(body, /class="\{\{#if value\}\}is-checked/);
  assert.doesNotMatch(body, /data\.value/);
});

test('currency save is acknowledged and has an X beside Save', () => {
  const clientAt = client.indexOf("async 'submit .js-card-customfield-currency'");
  const clientBody = client.slice(clientAt, client.indexOf('\n  },', clientAt));
  assert.match(clientBody,
    /await Meteor\.callAsync\(\s*'setCardCustomFieldCurrency'/);
  assert.match(clientBody, /Number\.isFinite\(value\)/);
  assert.doesNotMatch(clientBody, /tpl\.card\.setCustomField/);

  const templateAt = template.indexOf('template(name="cardCustomField-currency")');
  const templateBody = template.slice(templateAt, template.indexOf(
    'template(name="cardCustomField-date")', templateAt));
  assert.match(templateBody,
    /button\.primary\(type="submit"\)[\s\S]*a\.fa\.fa-times-thin\.js-close-inlined-form/);
  assert.match(templateBody, /input\(type="text" value=value autofocus\)/);
});

test('dropdown has the standard X immediately beside Save', () => {
  const at = template.indexOf('template(name="cardCustomField-dropdown")');
  const body = template.slice(at, template.indexOf(
    '// cardCustomField-dropdown', at));
  assert.match(body,
    /button\.primary\(type="submit"\)[\s\S]*a\.fa\.fa-times-thin\.js-close-inlined-form/);
});

test('number has the standard X immediately beside Save', () => {
  const at = template.indexOf('template(name="cardCustomField-number")');
  const body = template.slice(at, template.indexOf(
    'template(name="cardCustomField-checkbox")', at));
  assert.match(body,
    /button\.primary\(type="submit"\)[\s\S]*a\.fa\.fa-times-thin\.js-close-inlined-form/);
});

test('text has the standard X immediately beside Save', () => {
  const at = template.indexOf('template(name="cardCustomField-text")');
  const body = template.slice(at, template.indexOf(
    'template(name="cardCustomField-number")', at));
  assert.match(body,
    /button\.primary\(type="submit"\)[\s\S]*a\.fa\.fa-times-thin\.js-close-inlined-form/);
});

test('every custom field editor has a copy-to-clipboard control', () => {
  assert.match(template, /template\(name="customFieldCopyButton"\)[\s\S]*js-copy-custom-field/);
  // Text already receives the established copy control from +editor.
  const textAt = template.indexOf('template(name="cardCustomField-text")');
  const textBody = template.slice(textAt, template.indexOf(
    'template(name="cardCustomField-number")', textAt));
  assert.match(textBody, /\+editor\(autofocus=true\)/);

  const boundaries = [
    ['number', 'checkbox'],
    ['checkbox', 'currency'],
    ['currency', 'date'],
    ['date', 'datePopup'],
    ['dropdown', 'stringtemplate'],
  ];
  for (const [type, next] of boundaries) {
    const at = template.indexOf(`template(name="cardCustomField-${type}")`);
    const body = template.slice(at, template.indexOf(
      `template(name="cardCustomField-${next}")`, at));
    assert.match(body, /\+customFieldCopyButton\(value=/, `${type} has copy`);
  }
  const stringAt = template.indexOf('template(name="cardCustomField-stringtemplate")');
  assert.match(template.slice(stringAt), /\+customFieldCopyButton\(value=/);

  assert.match(client,
    /Template\.customFieldCopyButton\.events\([\s\S]*Utils\.copyTextToClipboard\(value\)/);
  assert.match(client, /rawValue instanceof Date[\s\S]*toISOString\(\)/);
  assert.match(client, /Array\.isArray\(rawValue\)[\s\S]*join\('\\n'\)/);
});

test('server validates actor, board field definition and value type', () => {
  for (const method of [
    'setCardCustomFieldAssigned',
    'setCardCustomFieldCheckbox',
    'setCardCustomFieldCurrency',
  ]) {
    const at = server.indexOf(`async ${method}(`);
    const body = server.slice(at, server.indexOf('\n  },', at));
    assert.ok(at >= 0, `${method} exists`);
    assert.ok(body.indexOf('check(') < body.indexOf('await '), `${method} checks before await`);
    assert.match(body, /canEditCardOrLinkedCard\(this\.userId, card, board\)/);
    assert.match(body, /boardIds: card\.boardId/);
  }
  const checkbox = server.slice(server.indexOf('async setCardCustomFieldCheckbox'));
  assert.match(checkbox, /type: 'checkbox'/);
  assert.match(checkbox, /if \(index < 0\) throw new Meteor\.Error\('custom-field-not-on-card'\)/);
  const currency = server.slice(server.indexOf('async setCardCustomFieldCurrency'));
  assert.match(currency, /type: 'currency'/);
  assert.match(currency, /Number\.isFinite\(value\)/);
});

test('deleted definitions are omitted from detailed exports', () => {
  const document = buildExportCardDocument({
    card: { customFields: [{ _id: 'live', value: true }, { _id: 'gone', value: 'secret' }] },
    customFieldsById: { live: { _id: 'live', name: 'Approved', type: 'checkbox' } },
  }, { fields: ['custom-fields'] });
  const text = JSON.stringify(document);
  assert.ok(text.includes('Approved'));
  assert.ok(!text.includes('gone'));
});

test('NEGATIVE — an export with only orphaned custom-field ids has no custom fields', () => {
  const document = buildExportCardDocument({
    card: { customFields: [{ _id: 'deleted-definition', value: 'x' }] },
    customFieldsById: {},
  }, { fields: ['custom-fields'] });
  assert.ok(!document.some(block => block.type === 'section'
    && block.key === 'custom-fields'));
});

console.log(`\n${passed} tests passed`);
