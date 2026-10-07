'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/tpi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');

test('Tok Pisin Blockly text operations preserve source tokens and result semantics',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-TEXT_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-TEXT_INDEXOF_TOOLTIP'],/fes teks.*namba tu teks.*%1 sapos teks i no stap/);
 assert.match(data['blockly-TEXT_ISEMPTY_TOOLTIP'],/tru.*i no gat samting/);
 assert.match(data['blockly-TEXT_LENGTH_TOOLTIP'],/wantaim ol spes/);
 assert.match(data['blockly-TEXT_REPLACE_MESSAGE0'],/%1 wantaim %2.*%3/);
 assert.match(data['blockly-TEXT_REPLACE_TOOLTIP'],/olgeta ples/);
 assert.match(data['blockly-TEXT_CHARAT_FROM_END'],/stat long pinis/);
 assert.notEqual(data['blockly-TEXT_CHARAT_FIRST'],data['blockly-TEXT_CHARAT_LAST']);
});

test('Tok Pisin text controls distinguish case, trim directions and prompt types',()=>{
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'],/liklik leta/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'],/BIKPELA LETA/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'],/bikpela leta.*stat bilong wan wan tok/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_LEFT'],/han kais/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_RIGHT'],/han sut/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_BOTH'],/tupela sait/);
 assert.match(data['blockly-TEXT_TRIM_TOOLTIP'],/kopi.*wanpela o tupela pinis/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_NUMBER'],/wanpela namba/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_TEXT'],/sampela teks/);
 assert.equal(data['blockly-TEXT_APPEND_VARIABLE'],data['blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM']);
});
