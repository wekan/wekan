'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(
  root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
const veps = read('ve-PP');
const finnish = read('fi');
const terms = {
  actions: 'Tegendad',
  'boardChangeVisibilityPopup-title': 'Vajehta nägubut',
  'font-size-default': 'Sanumata',
  'changePasswordPopup-title': 'Vajehta peitsana',
  current: 'Nügüdläine',
  discard: 'Heitä',
  'export-card-attachment-filename': 'Failan nimi',
  'export-card-attachment-size': 'Suruz’',
  'loginPopup-title': 'Tule sistemaha',
  preview: 'Ezikacund',
  'previewAttachedImagePopup-title': 'Ezikacund',
  'previewClipboardImagePopup-title': 'Ezikacund',
  unwatch: 'Ala kacu',
  'welcome-list2': 'Nügüd’aigaline',
  default: 'Sanumata',
  defaultdefault: 'Sanumata',
  'r-import': 'To',
  'r-d-send-email-message': 'Kirjeine',
  'operator-description': 'Kirjutuz',
  'predicate-all': 'kaik',
  'next-page': "uz' lehtpol'",
  'previous-page': "enzne lehtpol'",
  history: 'Istorii',
  'confirm-btn': 'Vahvištoita',
  'move-progress-file': 'Fail',
  'attachmentRenamePopup-title': "Anda uz' nimi",
  'change-visibility': 'Vajehta nägubut',
  collapse: 'Saubata',
  'cron-error-details': 'Ližatedod',
  'anonymized-user': 'Kävutai',
  view: 'Kacu',
};
for (const [key, value] of Object.entries(terms)) {
  assert.equal(veps[key], value, `${key}: exact native MediaWiki Veps value`);
  assert.notEqual(veps[key], finnish[key], `${key}: Finnish seed removed`);
}
const lexicalTerms = {
  'color-gold': 'kuld',
  'color-pink': 'ruza',
  'color-silver': 'hobed',
  'color-sky': 'taivaz',
  computer: 'Tedomašin',
  home: 'Pertʹ',
  or: 'vai',
  people: 'Rahvaz',
  'r-board': 'laud',
  'r-subject': 'azj',
  'r-d-send-email-subject': 'azj',
  'r-df-end-at': 'lop',
  monday: 'Ezmärg',
  tuesday: 'Tožnarg',
  wednesday: 'Koumanzʹpäiv',
  thursday: 'Nellänzʹpäiv',
  friday: 'Pätnič',
  saturday: 'Sobat',
  sunday: 'Pühäpäiv',
  task: 'Tego',
  'operator-team': 'jouk',
  'office-people': 'Rahvaz',
  subject: 'Azj',
  action: 'Tego',
  support: 'Tugi',
  'supportPopup-title': 'Tugi',
  'cron-error-time': 'Aig',
  duration: 'Piduzʹ',
  weight: 'Jügu',
};
for (const [key, value] of Object.entries(lexicalTerms)) {
  assert.equal(veps[key], value, `${key}: exact Veps lexical value`);
  assert.notEqual(veps[key], finnish[key], `${key}: Finnish seed removed`);
}
const sharedTerms = {
  repository: 'Repo',
  'dueCardsViewChange-choice-me': 'Minä',
  'r-of': '/',
  of: ' / ',
  queue: 'Jono',
  name: 'Nimi',
  no: 'Ei',
  'r-sort-name': 'nimi',
  'r-name': 'nimi',
  'event-bleed': 'Nimi',
};
for (const [key, value] of Object.entries(sharedTerms)) {
  assert.equal(veps[key], value, `${key}: attested shared Veps term`);
  assert.equal(finnish[key], value, `${key}: intentionally shared with Finnish`);
}
const remainingFinnishMatches = Object.keys(veps).filter(key =>
  veps[key] !== read('en')[key] && veps[key] === finnish[key]);
assert.deepEqual(remainingFinnishMatches.sort(), Object.keys(sharedTerms).sort(),
  'every remaining Finnish match is explicitly reviewed');
console.log(`vepsMediaWikiTerms: ${Object.keys(terms).length + Object.keys(lexicalTerms).length} repairs and ${Object.keys(sharedTerms).length} shared terms passed`);
