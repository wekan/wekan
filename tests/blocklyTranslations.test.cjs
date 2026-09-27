'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {mergeMessages,locale,mapping,tokens}=require('../releases/translations/import-blockly.cjs');
const root=path.resolve(__dirname,'..');
const english=require('../imports/i18n/data/en.i18n.json');
const upstream=require('blockly/msg/en');
const placeholders=value=>(String(value).match(/%\d+(?:\$[a-z])?|%[a-z]|__[A-Za-z0-9_]+__|%\{[^}]+\}/g)||[]).sort();

test('every Blockly message resolves through all WeKan locale catalogs with intact placeholders',()=>{
  assert.deepEqual(Object.keys(mapping).sort(),Object.keys(upstream).sort());
  for(const file of fs.readdirSync(path.join(root,'imports/i18n/data')).filter(f=>f.endsWith('.i18n.json'))){
    const data=JSON.parse(fs.readFileSync(path.join(root,'imports/i18n/data',file)));
    assert.deepEqual(Object.keys(data),Object.keys(english),`${file}: key order`);
    for(const [blockly,key]of Object.entries(mapping)){
      assert.equal(typeof data[key],'string',`${file}: ${key}`);
      assert.deepEqual(placeholders(data[key]),placeholders(upstream[blockly]),`${file}: ${key}`);
    }
  }
});
test('upstream import preserves local translations and rejects damaged placeholders',()=>{
  assert.equal(tokens('%{BKY_HELP} %1 %1 %2$s __board__ %d'), '%1|%1|%2$s|%d|%{BKY_HELP}|__board__');
  assert.notEqual(tokens('%{BKY_HELP}'), tokens('%{BKY_AIDE}'));
  const data={'blockly-DELETE_BLOCK':'Human translation','blockly-DELETE_X_BLOCKS':upstream.DELETE_X_BLOCKS};
  const result=mergeMessages(data,{DELETE_BLOCK:'Replacement',DELETE_X_BLOCKS:'Missing the count'});
  assert.equal(result['blockly-DELETE_BLOCK'],'Human translation');
  assert.equal(result['blockly-DELETE_X_BLOCKS'],upstream.DELETE_X_BLOCKS);
  assert.equal(data['blockly-DELETE_BLOCK'],'Human translation');
  assert.equal(mergeMessages({}, {DELETE_X_BLOCKS:'Poista %1 lohkoa'})['blockly-DELETE_X_BLOCKS'],'Poista %1 lohkoa');
  assert.equal(locale('zh_TW'),'zh-hant');
  assert.equal(locale('fi-FI'),'fi');
  assert.equal(locale('not-a-locale'),undefined);
});
test('localized editor reads WeKan messages without sprintf and preserves drafts across direction changes',()=>{
 const source=fs.readFileSync(path.join(root,'client/components/rules/blocks/editor.js'),'utf8');
 assert.match(source,/postProcess: false/);
 assert.doesNotMatch(source,/blockly\/msg\/en/);
 assert.match(source,/serialization\.workspaces\.save\(workspace\)/);
 assert.match(source,/workspace = inject\(direction\)/);
 assert.match(source,/restore\(state\)/);
 const fi=require('../imports/i18n/data/fi.i18n.json');
 const fr=require('../imports/i18n/data/fr.i18n.json');
 const de=require('../imports/i18n/data/de.i18n.json');
 assert.equal(fi['blockly-ANNOUNCE_MOVE_BEFORE'],'Siirretään %1 ennen lohkoa %2.');
 assert.equal(fr['blockly-INPUT_LABEL_NUMBER_A'],'premier nombre');
 assert.equal(de['blockly-KEYBOARD_NAV_COPIED_HINT'],'Kopiert. Drücke %1 zum Einfügen.');
});
test('resumed Gujarati accessibility and basic block controls contain Gujarati prose',()=>{
 const gu=require('../imports/i18n/data/gu-IN.i18n.json');
 const keys=Object.keys(english).filter(key=>/^blockly-(ANNOUNCE_|ARIA_|BLOCK_LABEL_|BUBBLE_LABEL_|COLOUR_|CONTROLS_|FIELD_|ICON_|INPUT_|KEYBOARD_|LOGIC_)/.test(key)&&!key.endsWith('_HELPURL')&&/[A-Za-z]/.test(english[key]));
 for(const key of keys){
  assert.match(gu[key],/[\u0A80-\u0AFF]/,key);
  assert.notEqual(gu[key],english[key],key);
  assert.deepEqual(placeholders(gu[key]),placeholders(english[key]),key);
 }
 assert.equal(gu['blockly-COLOUR_RGB_BLUE'],'વાદળી');
 assert.equal(gu['blockly-ARIA_LABEL_BUTTON'],'બટન');
 assert.equal(gu['blockly-ARIA_LABEL_FIELD_ANGLE'],'%1 અંશ');
 assert.equal(gu['blockly-CONTROLS_IF_MSG_IF'],'જો');
 assert.equal(gu['blockly-FIELD_BITMAP_PIXEL_ON'],'ચાલુ');
 assert.notEqual(gu['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],gu['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL']);
 assert.equal(gu['blockly-LOGIC_BOOLEAN_TRUE'],'સાચું');
 assert.equal(gu['blockly-LOGIC_BOOLEAN_FALSE'],'ખોટું');
 assert.notEqual(gu['blockly-INPUT_LABEL_MATH_DIVIDEND'],gu['blockly-INPUT_LABEL_MATH_DIVISOR']);
 assert.notEqual(gu['blockly-LOGIC_OPERATION_AND'],gu['blockly-LOGIC_OPERATION_OR']);
});
