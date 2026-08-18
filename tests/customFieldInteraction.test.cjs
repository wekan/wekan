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
  assert.match(body, /sourceCard\?\.customFields/);
  assert.match(body, /!Boolean\(storedField\.value\)/);
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

test('server validates actor, board field definition and checkbox type', () => {
  for (const method of ['setCardCustomFieldAssigned', 'setCardCustomFieldCheckbox']) {
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
