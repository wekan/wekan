'use strict';
const assert = require('node:assert/strict');
const data = require('../imports/i18n/data/gl-ES.i18n.json');
assert.match(data['accounts-lockout-known-users'], /usuarios coñecidos.*usuario correcto, contrasinal incorrecto/);
assert.match(data['accounts-lockout-unknown-users'], /usuarios descoñecidos.*usuario inexistente/);
for (const key of ['accounts-lockout-known-users', 'accounts-lockout-unknown-users']) assert.doesNotMatch(data[key], /usuários|senha|Configurações/);
assert.match(data['act-addChecklist'], /engadiu a lista de verificación/);
(async () => {
  const translator = require('i18next').createInstance();
  await translator.init({ lng: 'gl-ES', fallbackLng: false, keySeparator: false, interpolation: { prefix: '__', suffix: '__', escapeValue: false }, resources: { 'gl-ES': { translation: data } } });
  assert.equal(translator.t('act-addAttachment', { attachment: 'FILE', card: 'CARD', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'engadiu o anexo FILE á tarxeta CARD na lista LIST no carril LANE no taboleiro BOARD');
  assert.equal(data['act-addLabel'], data['act-addedLabel']);
  assert.equal(translator.t('act-addChecklistItem', { checklistItem: 'ITEM', checklist: 'CHECK', card: 'CARD', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'engadiu o elemento ITEM á lista de verificación CHECK na tarxeta CARD na lista LIST no carril LANE no taboleiro BOARD');
  assert.equal(translator.t('act-atUserComment', { card: 'CARD', comment: 'COMMENT', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'mencionoute na tarxeta CARD: COMMENT na lista LIST no carril LANE no taboleiro BOARD');
  assert.equal(translator.t('act-archivedSwimlane', { swimlane: 'LANE', board: 'BOARD' }), 'O carril LANE no taboleiro BOARD moveuse ao Arquivo');
  console.log('galicianRegionalAuditedTranslations: credential meanings and actual attachment rendering passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
