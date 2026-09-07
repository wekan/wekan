'use strict';

// The date markup is written once.
// Run: node tests/dateTemplates.test.cjs
//
// Two shapes were copied across three files: the "edit a date" form (eight
// identical copies - the card's Received, Start, Due and End, a vote's end, a
// poker's end, a custom field's date, and a ninth `datepicker` template nothing
// included) and the date BADGE (fourteen copies - the same four dates on the
// card and again on the minicard, a generic one, the two end dates, and three
// custom-field ones).
//
// The JavaScript was already shared: client/lib/datepicker.js has the state and
// the handlers, and each popup differs only in what it stores. Only the markup
// was duplicated, so a change to the form meant eight edits and a change to the
// badge meant fourteen, with nothing to say so.
//
// Each shape is one template now, and it takes what it draws as ARGUMENTS -
// because a helper is looked up on the template it is written in, not on the
// one including it. That is what lets the markup be shared while every popup
// keeps its own state, its own click and its own name.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const cardDate = read('client/components/cards/cardDate.jade');
const cardDetails = read('client/components/cards/cardDetails.jade');
const customFields = read('client/components/cards/cardCustomFields.jade');
const datepicker = read('client/components/forms/datepicker.jade');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('dateTemplates:');

test('the edit form is written once', () => {
  assert.ok(/template\(name="editDateForm"\)/.test(datepicker), 'one template');
  const copies = (cardDate + customFields + datepicker)
    .match(/input\.js-date-field#date/g) || [];
  assert.strictEqual(copies.length, 1, 'and the date field exists in exactly one place');
  // All eight popups include it, and pass the three things it draws.
  for (const popup of ['editCardReceivedDatePopup', 'editCardStartDatePopup',
    'editCardDueDatePopup', 'editCardEndDatePopup', 'editVoteEndDatePopup',
    'editPokerEndDatePopup']) {
    const at = cardDate.indexOf(`template(name="${popup}")`);
    assert.ok(at !== -1, `${popup} still exists`);
    assert.ok(/\+editDateForm\(showDate=showDate showTime=showTime error=error datePicker=datePicker\)/
      .test(cardDate.slice(at, at + 200)), `${popup} includes it`);
  }
  assert.ok(/\+editDateForm\(showDate=showDate showTime=showTime error=error datePicker=datePicker customFieldCopyValue=value customFieldControls=true\)/.test(customFields),
    'and so does the custom field date popup, with its date-specific controls');
});

test('the badge is written once', () => {
  assert.ok(/template\(name="dateBadgeBody"\)/.test(cardDate), 'one template');
  const links = cardDate.match(/a\.js-edit-date/g) || [];
  assert.strictEqual(links.length, 1, 'and the badge link exists in exactly one place');
  const includes = cardDate.match(/\+dateBadgeBody\(/g) || [];
  assert.strictEqual(includes.length, 14, 'fourteen templates draw it');
});

test('a custom field date is still not a .card-date (negative)', () => {
  // The trap in sharing one badge: three of the fourteen never carried
  // `card-date`, and folding them into a template that adds it would restyle
  // them. `baseClass` is what the caller's own markup carried.
  const body = cardDate.slice(cardDate.indexOf('template(name="dateBadgeBody")'),
    cardDate.indexOf('template(name="dateBadge")'));
  assert.ok(/class="\{\{baseClass\}\} \{\{classes\}\}"/.test(body),
    'the base class comes from the caller');
  assert.ok(!/a\.js-edit-date\.card-date|a\.card-date/.test(body),
    'and is not baked into the shared markup');
  for (const plain of ['dateCustomField', 'cardCustomFieldDate', 'minicardCustomFieldDate']) {
    const at = cardDate.indexOf(`template(name="${plain}")`);
    const include = cardDate.slice(at, cardDate.indexOf('\n', cardDate.indexOf('+dateBadgeBody', at)));
    assert.ok(!/baseClass=/.test(include), `${plain} passes no base class`);
    assert.ok(!/canModifyCard=/.test(include), `${plain} is not a link either, as before`);
  }
});

test('a minicard badge keeps its own kind class (negative)', () => {
  // `.due-date` and friends are what colour it; they moved into `baseClass`,
  // not away.
  for (const [tpl, kind] of [['minicardReceivedDate', 'received-date'],
    ['minicardStartDate', 'start-date'], ['minicardDueDate', 'due-date'],
    ['minicardEndDate', 'end-date']]) {
    const at = cardDate.indexOf(`template(name="${tpl}")`);
    const include = cardDate.slice(at, cardDate.indexOf('\n', cardDate.indexOf('+dateBadgeBody', at)));
    assert.ok(include.includes(`baseClass="card-date ${kind}"`), `${tpl} keeps ${kind}`);
  }
});

test('opened-card date badges receive the edit permission explicitly', () => {
  for (const template of [
    'cardReceivedDate', 'cardStartDate', 'cardDueDate', 'cardEndDate',
  ]) {
    assert.ok(cardDetails.includes(`+${template}(card=this canModifyCard=canModifyCard)`),
      `${template} stays editable for members who can modify the card`);
  }
});

test('the ninth copy of the form is gone, with the file that wired it', () => {
  // `datepicker` was a template nothing included, and a popup cannot open it
  // either - a popup's template name ends in `Popup`.
  assert.ok(!/template\(name="datepicker"\)/.test(datepicker), 'the template is gone');
  assert.ok(!fs.existsSync(path.join(ROOT, 'client/components/forms/datepicker.js')),
    'and so is its module');
  const forms = read('client/features/forms.js');
  assert.ok(!/datepicker\.js/.test(forms.replace(/\/\/.*/g, '')), 'nothing imports it');
  assert.ok(/client\/lib\/datepicker\.js/.test(forms), 'and the note says where the state lives');
});

test('the child form owns the event map and receives each popup state (#6607)', () => {
  // Blaze event maps do not cross a child-template boundary. Registering the
  // map on each popup made this included form look right but made Save, Delete
  // and validation inert. The form must own the map and receive datePicker.
  const js = read('client/components/cards/cardDate.js');
  const picker = read('client/lib/datepicker.js');
  assert.ok(/Template\.editDateForm\.events\(datePickerEvents\(\)\)/.test(picker),
    'the child template handles its own events');
  assert.ok(/Template\.currentData\(\)\?\.datePicker/.test(picker),
    'the handlers use state passed by the popup');
  for (const [popup, setter] of [['editCardReceivedDatePopup', 'setReceived'],
    ['editCardStartDatePopup', 'setStart'], ['editCardDueDatePopup', 'setDue'],
    ['editCardEndDatePopup', 'setEnd']]) {
    assert.ok(js.includes(`Template.${popup}.onCreated`), `${popup} still has its own state`);
    assert.ok(js.includes(setter), `${popup} still stores its own field`);
  }
  assert.ok(!/\.events\(datePickerEvents/.test(js),
    'negative: no ineffective parent event map remains');
});

test('the shared template exists before its event map is registered', () => {
  const imports = read('client/imports.js');
  assert.ok(imports.indexOf("import '/client/features/forms'")
    < imports.indexOf("import '/client/lib/datepicker'"),
  'Template.editDateForm.events() must not run before datepicker.jade creates it');
  assert.strictEqual((imports.match(/import '\/client\/lib\/datepicker'/g) || []).length, 1,
    'the ordering fix must not load a second copy');
});

test('clicking an existing date reopens its editor with the Card context', () => {
  const js = read('client/components/cards/cardDate.js');
  const opener = js.slice(js.indexOf('function openDateEditor(name) {'),
    js.indexOf('// Shared onCreated logic'));
  assert.ok(/Popup\.open\(name\)\.call\(\s*cardFromDateContext\(templateInstance\.data\),\s*event,\s*templateInstance,?\s*\)/.test(opener),
    'the surrounding date template supplies its Card, not dateBadgeBody arguments');
  assert.ok(/event\.stopPropagation\(\)/.test(opener),
    'cardDetails must not open a second popup while the badge click bubbles');
  for (const kind of ['Received', 'Start', 'Due', 'End']) {
    assert.ok(new RegExp(`Template\\.card${kind}Date\\.events\\(\\{[\\s\\S]*?openDateEditor\\('editCard${kind}Date'\\)`)
      .test(js), `${kind} dates reopen through the Card-aware handler`);
  }
  assert.ok(!/'click \.js-edit-date': Popup\.open\('editCard/.test(js),
    'negative: no existing card date passes child display data to a popup');
});

console.log(`\ndateTemplates: ${passed} tests passed`);
