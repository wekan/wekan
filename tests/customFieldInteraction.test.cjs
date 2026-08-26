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
const datepickerTemplate = read('client/components/forms/datepicker.jade');
const datepickerCss = read('client/components/forms/datepicker.css');
const formsCss = read('client/components/forms/forms.css');
const editorCss = read('client/components/main/editor.css');
const minicardClient = read('client/components/cards/minicard.js');
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
  assert.match(templateBody, /input\(type="text" value=editValue autofocus\)/);
});

test('dropdown has the standard X immediately beside Save', () => {
  const at = template.indexOf('template(name="cardCustomField-dropdown")');
  const body = template.slice(at, template.indexOf(
    '// cardCustomField-dropdown', at));
  assert.match(body,
    /button\.primary\(type="submit"\)[\s\S]*a\.fa\.fa-times-thin\.js-close-inlined-form/);
});

test('dropdown edit mode preselects the saved value', () => {
  const clientAt = client.indexOf("Template['cardCustomField-dropdown'].onCreated");
  const clientBody = client.slice(clientAt, client.indexOf(
    '// cardCustomField-stringtemplate', clientAt));
  const templateAt = template.indexOf('template(name="cardCustomField-dropdown")');
  const templateBody = template.slice(templateAt, template.indexOf(
    'template(name="cardCustomField-stringtemplate")', templateAt));

  assert.match(clientBody,
    /isSelectedItem\(itemId\) \{[\s\S]*Template\.instance\(\)\.data\.value \?\? ''\) === itemId;/,
    'the option is compared with the current persisted template value');
  assert.match(templateBody,
    /each items[\s\S]*if isSelectedItem _id[\s\S]*selected="selected"/);
  assert.doesNotMatch(templateBody, /\$eq data\.value this\._id/,
    'selection does not read value from the current dropdown-item context');
});

test('every custom field editor starts with its saved value', () => {
  assert.match(client,
    /function persistedEditValue\(\) \{[\s\S]*Template\.instance\(\)\.data\?\.value;/);
  for (const [type, next] of [
    ['text', 'number'],
    ['number', 'checkbox'],
    ['checkbox', 'currency'],
    ['currency', 'date'],
  ]) {
    const at = template.indexOf(`template(name="cardCustomField-${type}")`);
    const body = template.slice(at, template.indexOf(
      `template(name="cardCustomField-${next}")`, at));
    assert.match(body, /editValue/, `${type} binds its persisted edit value`);
    assert.match(client,
      new RegExp(`Template\\['cardCustomField-${type}'\\]\\.helpers\\(\\{[\\s\\S]*?editValue: persistedEditValue`),
      `${type} exposes the persisted value to its editor`);
  }

  assert.match(client,
    /setupDatePicker\(this, \{[\s\S]*initialDate: data\.value \? data\.value : undefined/,
    'Date initializes its popup from the saved date');
  assert.match(client,
    /this\.stringtemplateItems = new ReactiveVar\(Template\.currentData\(\)\.value \?\? \[\]\)/,
    'String Template initializes its staged inputs from the saved array');
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

test('string template has the standard X immediately beside Save', () => {
  const at = template.indexOf('template(name="cardCustomField-stringtemplate")');
  const body = template.slice(at);
  assert.match(body,
    /button\.primary\(type="submit"\)[\s\S]*a\.fa\.fa-times-thin\.js-close-inlined-form\(title="\{\{_ 'close'\}\}"\)/);
  assert.match(client,
    /click \.js-close-inlined-form[\s\S]*stringtemplateItems\.set\(Template\.currentData\(\)\.value \?\? \[\]\)/,
    'X continues to restore the saved items instead of retaining staged edits');
});

test('every custom field editor has a copy-to-clipboard control', () => {
  assert.match(template, /template\(name="customFieldCopyButton"\)[\s\S]*js-copy-custom-field/);
  const textAt = template.indexOf('template(name="cardCustomField-text")');
  const textBody = template.slice(textAt, template.indexOf(
    'template(name="cardCustomField-number")', textAt));
  assert.match(textBody, /\+editor\(autofocus=true hideCopy=true\)/);
  assert.match(textBody,
    /\+customFieldCopyButton[\s\S]*\+editor[\s\S]*button\.primary[\s\S]*js-close-inlined-form/);

  const boundaries = [
    ['number', 'checkbox'],
    ['checkbox', 'currency'],
    ['currency', 'date'],
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
  assert.match(datepickerTemplate,
    /\.right[\s\S]*input\.js-time-field[\s\S]*customFieldControls[\s\S]*\+customFieldCopyButton/);

  assert.match(client,
    /Template\.customFieldCopyButton\.events\([\s\S]*Utils\.copyTextToClipboard\(value\)/);
  assert.match(client, /closest\('form'\)/);
  assert.match(client, /rawValue instanceof Date[\s\S]*toISOString\(\)/);
  assert.match(client, /Array\.isArray\(rawValue\)[\s\S]*join\('\\n'\)/);
});

test('Text Convert to Markdown sits immediately left of Copy', () => {
  assert.match(editorCss,
    /\.inlined-form\.js-card-customfield-text > a\.fa\.fa-brands\.fa-markdown \{[\s\S]*?float: none;[\s\S]*?inset-inline-end: 28px;[\s\S]*?top: -24px;/,
    'the Text-specific override aligns Convert with Copy above the editor');
  assert.match(formsCss,
    /\.custom-field-copy-control \{[\s\S]*?inset-inline-end: 0;[\s\S]*?top: -24px;/,
    'Copy remains the rightmost control in LTR');
});

test('the title and value open editing while checkbox control stays independent', () => {
  const wrapperAt = template.indexOf('template(name="cardCustomField")');
  const wrapper = template.slice(wrapperAt, template.indexOf(
    'template(name="customFieldCopyButton")', wrapperAt));
  assert.match(wrapper, /js-edit-card-custom-field-value/);
  assert.match(client,
    /function openCustomFieldValueEditor[\s\S]*js-custom-field-edit-trigger/);
  assert.match(template,
    /a\.js-edit-date\.js-custom-field-edit-trigger/,
    'the visible datetime itself is the direct popup opener and title target');
  assert.match(client,
    /Template\['cardCustomField-date'\]\.events\(\{[\s\S]*'click \.js-edit-date': Popup\.open\('cardCustomField-date'\)/,
    'the Date template handles its own visible datetime click directly');
  assert.match(client,
    /'text',[\s\S]*'checkbox',[\s\S]*'currency',[\s\S]*'dropdown',[\s\S]*'stringtemplate',[\s\S]*\.forEach\(type => \{[\s\S]*Template\[`cardCustomField-\$\{type\}`\]\.events[\s\S]*openCustomFieldValueEditor/,
    'the other nested type templates own their value clicks');
  assert.match(client,
    /event\.target\.closest\('\.check-box-container'\)\) return/,
    'the shared route does not take over the Checkbox square');
  for (const [type, next] of [
    ['text', 'number'],
    ['number', 'checkbox'],
    ['currency', 'date'],
    ['dropdown', 'stringtemplate'],
  ]) {
    const at = template.indexOf(`template(name="cardCustomField-${type}")`);
    const body = template.slice(at, template.indexOf(
      `template(name="cardCustomField-${next}")`, at));
    assert.match(body, /js-edit-card-custom-field-value/, `${type} value opens edit`);
  }

  assert.doesNotMatch(template,
    /a\.js-open-inlined-form[\s\S]{0,180}(formattedValue|selectedItem|\+viewer)/);
  const checkboxAt = template.indexOf('template(name="cardCustomField-checkbox")');
  const checkbox = template.slice(checkboxAt, template.indexOf(
    'template(name="cardCustomField-currency")', checkboxAt));
  assert.match(checkbox, /js-card-customfield-checkbox-editor/);
  assert.match(checkbox,
    /js-card-custom-field-checkbox\.js-edit-card-custom-field-value[\s\S]*check-box-container/,
    'the checkbox row opens editing, with its direct control nested inside');
  assert.match(client,
    /click \.js-card-custom-field-checkbox \.check-box-container[\s\S]*event\.stopPropagation\(\)/,
    'the checkbox square toggles without opening editing');
  assert.match(client,
    /change \.js-card-customfield-checkbox-input[\s\S]*toggleClass\('is-checked', event\.currentTarget\.checked\)/,
    'the staged editor visibly supports both checking and unchecking');
  assert.match(checkbox,
    /\+customFieldCopyButton[\s\S]*button\.primary\(type="submit"\)[\s\S]*js-close-inlined-form/);
});

test('copy sits above the top-right corner of every custom field editor', () => {
  assert.match(template,
    /span\.custom-field-copy-control[\s\S]*a\.fa\.fa-copy\.js-copy-custom-field/);
  const controlAt = formsCss.indexOf('.custom-field-copy-control {');
  const controlCss = formsCss.slice(controlAt, formsCss.indexOf('}', controlAt));
  assert.match(controlCss, /position: absolute;/);
  assert.match(controlCss, /inset-inline-end: 0;/);
  assert.match(controlCss, /top: -24px;/);
  assert.match(formsCss,
    /form\.inlined-form \.custom-field-copy-control > a\.fa-copy[\s\S]*position: static;[\s\S]*top: auto;/);
  assert.match(datepickerTemplate,
    /\.right[\s\S]*?input\.js-time-field[\s\S]*?customFieldControls[\s\S]*?\.custom-field-date-copy[\s\S]*?\+customFieldCopyButton/,
    'Date places Copy immediately after the Time field');
  assert.match(datepickerCss,
    /\.custom-field-date-copy \{[\s\S]*?align-items: center;[\s\S]*?padding-top: 24px;/,
    'Copy aligns with the Time input instead of adding a row above Date and Time');
  assert.match(datepickerCss,
    /\.datepicker-container \.fields \{[\s\S]*?display: flex;[\s\S]*?gap: 15px;/,
    'the shared datepicker keeps Date, Time and Copy in one row for every popup name');
  assert.match(datepickerCss,
    /\.fields \.left \{[\s\S]*?flex: 1;[\s\S]*?min-width: 0;[\s\S]*?float: none;[\s\S]*?order: 1;[\s\S]*?width: auto;/,
    'Date is explicitly the first item in the row');
  assert.match(datepickerCss,
    /\.fields \.right \{[\s\S]*?flex: 1;[\s\S]*?min-width: 0;[\s\S]*?float: none;[\s\S]*?order: 2;[\s\S]*?width: auto;/,
    'Time is explicitly the second item in the row');
  assert.match(datepickerCss,
    /input\[type='date'\],[\s\S]*?input\[type='time'\][\s\S]*?box-sizing: border-box;[\s\S]*?max-width: 100%;[\s\S]*?width: 100%;/,
    'date and time inputs shrink inside the popup instead of creating horizontal scroll');
  assert.match(datepickerCss,
    /\.custom-field-date-copy \{[\s\S]*?order: 3;/,
    'Copy is explicitly to the right of Time');
  assert.match(datepickerCss,
    /\.custom-field-date-copy \.custom-field-copy-control \{[\s\S]*?position: static;/,
    'Date overrides the absolute above-editor position inside its fields row');
  assert.doesNotMatch(datepickerTemplate, /js-close-date-editor/,
    'the form does not duplicate the popup header X below Copy');
  assert.doesNotMatch(formsCss, /\.custom-field-date-editor \{\s*padding-top:/,
    'Date no longer reserves empty space above its inputs');
});

test('minicard Currency and String Template format their row without throwing', () => {
  const currencyAt = minicardClient.indexOf(
    'formattedCurrencyCustomFieldValue(definition)',
  );
  const currency = minicardClient.slice(currencyAt,
    minicardClient.indexOf('formattedStringtemplateCustomFieldValue', currencyAt));
  assert.doesNotMatch(currency, /this\s*\.customFieldsWD\(\)/,
    'the custom-field row is not mistaken for a Card');
  assert.match(currency, /const customFieldTrueValue = field\.trueValue/);
  assert.match(currency, /Number\.isFinite\(number\)/);
  assert.match(currency, /customFieldTrueValue === '' \|\| customFieldTrueValue == null/,
    'empty values stay empty while numeric zero remains valid');

  const stringAt = minicardClient.indexOf(
    'formattedStringtemplateCustomFieldValue(definition)',
  );
  const stringTemplate = minicardClient.slice(stringAt,
    minicardClient.indexOf('showCreatorOnMinicard', stringAt));
  assert.doesNotMatch(stringTemplate, /this\s*\.customFieldsWD\(\)/);
  assert.match(stringTemplate, /Array\.isArray\(field\.trueValue\)/);
  assert.match(stringTemplate, /new CustomFieldStringTemplate\(fieldDefinition\)/);
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
