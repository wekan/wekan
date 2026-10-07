'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/mi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');

test('Māori Blockly text operations preserve source tokens and result semantics',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-TEXT_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-TEXT_INDEXOF_TOOLTIP'],/kuputuhi tuatahi.*kuputuhi tuarua.*%1 mēnā kāore te kuputuhi i kitea/);
 assert.match(data['blockly-TEXT_ISEMPTY_TOOLTIP'],/pono.*he putua/);
 assert.match(data['blockly-TEXT_LENGTH_TOOLTIP'],/tae atu ki ngā āputa/);
 assert.match(data['blockly-TEXT_REPLACE_MESSAGE0'],/%1 ki te %2.*%3/);
 assert.match(data['blockly-TEXT_REPLACE_TOOLTIP'],/putanga katoa/);
 assert.match(data['blockly-TEXT_CHARAT_FROM_END'],/mai i te mutunga/);
 assert.notEqual(data['blockly-TEXT_CHARAT_FIRST'],data['blockly-TEXT_CHARAT_LAST']);
});

test('Māori text controls distinguish case, trim directions and prompt types',()=>{
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'],/pūriki/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'],/PŪMATUA/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'],/pūmatua.*tīmatanga o ia kupu/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_LEFT'],/mauī/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_RIGHT'],/matau/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_BOTH'],/taha e rua/);
 assert.match(data['blockly-TEXT_TRIM_TOOLTIP'],/tārua.*tētahi pito.*pito e rua/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_NUMBER'],/he tau/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_TEXT'],/he kuputuhi/);
 assert.equal(data['blockly-TEXT_APPEND_VARIABLE'],data['blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM']);
});
