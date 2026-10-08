'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const codes=['fi','sv','de','fr','es','pt','it','nl'];
const keys=['card-field-visibility','card-field-visibility-desc'];
test('card-field visibility translations preserve complete catalog order and source tokens',()=>{
 for(const code of codes){
  const data=require('../imports/i18n/data/'+code+'.i18n.json');
  assert.deepEqual(Object.keys(data),Object.keys(english),code);
  for(const key of keys){
   assert.ok(data[key].trim(),code+': '+key);
   assert.notEqual(data[key],english[key],code+': '+key);
   assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),code+': '+key);
  }
 }
});
test('visibility descriptions retain unchanged data and per-board field order',()=>{
 const meanings={
  fi:['eivät muutu','valitaan uudelleen','järjestys on taulukohtainen'],
  sv:['Inga kortdata eller tavleinställningar ändras','markeras igen','sin egen fältordning'],
  de:['bleiben unverändert','wieder ausgewählt','eigene Feldreihenfolge'],
  fr:['Aucune donnée de carte ni aucun paramètre de tableau ne change','Cocher à nouveau','propre ordre des champs'],
  es:['No se modifican los datos','marcarlo de nuevo','propio orden de campos'],
  pt:['não são alterados','marcar o campo novamente','própria ordem dos campos'],
  it:['non cambiano','Selezionando nuovamente','proprio ordine dei campi'],
  nl:['veranderen niet','opnieuw wordt aangevinkt','eigen volgorde van velden'],
 };
 for(const [code,phrases] of Object.entries(meanings)){
  const text=require('../imports/i18n/data/'+code+'.i18n.json')['card-field-visibility-desc'];
  for(const phrase of phrases) assert.ok(text.includes(phrase),code+': '+phrase);
 }
});
