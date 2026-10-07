'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/nso.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');

test('Northern Sotho Blockly text operations preserve source tokens and result semantics',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-TEXT_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key] && !key.endsWith('_HELPURL') && !key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-TEXT_INDEXOF_TOOLTIP'],/sa mathomo.*sa bobedi.*%1 ge sengwalwa se sa hwetšwe/);
 assert.match(data['blockly-TEXT_ISEMPTY_TOOLTIP'],/nnete.*se se na selo/);
 assert.match(data['blockly-TEXT_LENGTH_TOOLTIP'],/go akaretša dikgoba/);
 assert.match(data['blockly-TEXT_REPLACE_MESSAGE0'],/%2 legatong la %1.*%3/);
 assert.match(data['blockly-TEXT_REPLACE_TOOLTIP'],/mafelong ka moka/);
 assert.match(data['blockly-TEXT_CHARAT_FROM_END'],/go tšwa mafelelong/);
 assert.notEqual(data['blockly-TEXT_CHARAT_FIRST'],data['blockly-TEXT_CHARAT_LAST']);
});

test('Northern Sotho text controls distinguish case, trim directions and prompt types',()=>{
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'],/tše nnyane/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'],/TŠE KGOLO/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'],/mathomo.*lentšung le lengwe le le lengwe/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_LEFT'],/nngele/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_RIGHT'],/go ja/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_BOTH'],/ka bobedi/);
 assert.match(data['blockly-TEXT_TRIM_TOOLTIP'],/khophi.*e tee goba.*ka bobedi/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_NUMBER'],/nomoro/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_TEXT'],/sengwalwa/);
 assert.equal(data['blockly-TEXT_APPEND_VARIABLE'],data['blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM']);
});
