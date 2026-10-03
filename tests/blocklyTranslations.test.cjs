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
 const keys=Object.keys(english).filter(key=>/^blockly-(ANNOUNCE_|ARIA_|BLOCK_LABEL_|BUBBLE_LABEL_|COLOUR_|CONTROLS_|FIELD_|ICON_|INPUT_|KEYBOARD_|LOGIC_|LISTS_|PROCEDURES_|VARIABLES_|VARIABLE_|NEW_VARIABLE|RENAME_VARIABLE)/.test(key)&&!key.endsWith('_HELPURL')&&/[A-Za-z]/.test(english[key]));
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
 assert.equal(gu['blockly-LISTS_SORT_ORDER_ASCENDING'],'ચડતો ક્રમ');
 assert.equal(gu['blockly-LISTS_SORT_ORDER_DESCENDING'],'ઊતરતો ક્રમ');
 assert.notEqual(gu['blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST'],gu['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST']);
 assert.notEqual(gu['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST'],gu['blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST']);
 assert.equal(gu['blockly-VARIABLES_DEFAULT_NAME'],'વસ્તુ');
 assert.notEqual(gu['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'],gu['blockly-PROCEDURES_DEFRETURN_TOOLTIP']);
 assert.notEqual(gu['blockly-VARIABLES_GET_TOOLTIP'],gu['blockly-VARIABLES_SET_TOOLTIP']);
});
test('Gujarati math prose is translated while mathematical notation stays intact',()=>{
 const gu=require('../imports/i18n/data/gu-IN.i18n.json');
 const notation=new Set(['e','pi','sin','cos','tan','asin','acos','atan']);
 for(const key of Object.keys(english).filter(key=>key.startsWith('blockly-MATH_')&&!key.endsWith('_HELPURL'))){
  const source=english[key];
  assert.deepEqual(placeholders(gu[key]),placeholders(source),key);
  if(notation.has(source)||!/[A-Za-z]/.test(source))assert.equal(gu[key],source,key);
  else {assert.match(gu[key],/[\u0A80-\u0AFF]/,key);assert.notEqual(gu[key],source,key);}
 }
 assert.equal(gu['blockly-MATH_IS_EVEN'],'સમ છે');
 assert.equal(gu['blockly-MATH_IS_ODD'],'વિષમ છે');
 assert.notEqual(gu['blockly-MATH_ONLIST_OPERATOR_MEDIAN'],gu['blockly-MATH_ONLIST_OPERATOR_AVERAGE']);
 assert.notEqual(gu['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'],gu['blockly-MATH_ROUND_OPERATOR_ROUNDUP']);
});
test('Gujarati workspace and shortcut messages preserve navigation direction and placeholders',()=>{
 const gu=require('../imports/i18n/data/gu-IN.i18n.json');
 for(const key of Object.keys(english).filter(key=>/^blockly-(SHORTCUTS_|WORKSPACE_|SCREENREADER_)/.test(key))){
  assert.match(gu[key],/[\u0A80-\u0AFF]/,key);
  assert.notEqual(gu[key],english[key],key);
  assert.deepEqual(placeholders(gu[key]),placeholders(english[key]),key);
 }
 assert.equal(gu['blockly-SHORTCUTS_MOVE_LEFT'],'ડાબે ખસેડો');
 assert.equal(gu['blockly-SHORTCUTS_MOVE_RIGHT'],'જમણે ખસેડો');
 assert.notEqual(gu['blockly-SCREENREADER_MODE_ENABLED'],gu['blockly-SCREENREADER_MODE_DISABLED']);
 assert.match(gu['blockly-WORKSPACE_SEARCH_INPUT_LABEL'],/Shift\+Enter/);
});
test('Gujarati Blockly prose and editor messages have no remaining English placeholders',()=>{
 const gu=require('../imports/i18n/data/gu-IN.i18n.json');
 // Printed key names, platform brands, OK and standard math notation stay
 // recognizable. URLs and nonlinguistic symbols are not translation gaps.
 const invariant=new Set(('ALT_KEY BACKSPACE_KEY CAPS_LOCK_KEY CHROME_OS COMMAND_KEY CONTROL_KEY DIALOG_OK END_KEY ENTER_KEY ESCAPE HOME_KEY INSERT_KEY LINUX MAC_OS MATH_CONSTANT_E_ARIA MATH_CONSTANT_PI_ARIA MATH_TRIG_ACOS MATH_TRIG_ASIN MATH_TRIG_ATAN MATH_TRIG_COS MATH_TRIG_SIN MATH_TRIG_TAN OPTION_KEY PAGE_DOWN_KEY PAGE_UP_KEY PAUSE_KEY SHIFT_KEY SPACE_KEY TAB_KEY WINDOWS').split(' '));
 for(const [name,key]of Object.entries(mapping)){
  const source=english[key];
  assert.deepEqual(placeholders(gu[key]),placeholders(source),key);
  if(invariant.has(name)||/^https?:/.test(source)||!/[A-Za-z]/.test(source))continue;
  assert.notEqual(gu[key],source,key);
  assert.match(gu[key],/[\u0A80-\u0AFF]/,key);
 }
 for(const key of Object.keys(english).filter(key=>key.startsWith('r-blocks-'))){
  assert.notEqual(gu[key],english[key],key);
  assert.match(gu[key],/[\u0A80-\u0AFF]/,key);
  assert.deepEqual(placeholders(gu[key]),placeholders(english[key]),key);
 }
 assert.notEqual(gu['blockly-TEXT_TRIM_OPERATOR_LEFT'],gu['blockly-TEXT_TRIM_OPERATOR_RIGHT']);
});

test('Ladin keyboard and math labels preserve operations and recognizable key names',()=>{
 const lld=require('../imports/i18n/data/lld.i18n.json');
 const names='ALT_KEY BACKSPACE_KEY CAPS_LOCK_KEY COMMAND_KEY CONTEXT_MENU_KEY CONTROL_KEY END_KEY ENTER_KEY ESCAPE HOME_KEY INPUT_LABEL_MATH_DIVIDEND INPUT_LABEL_MATH_DIVISOR INSERT_KEY MATH_TRIG_ACOS MATH_TRIG_ASIN MATH_TRIG_ATAN MATH_TRIG_COS MATH_TRIG_SIN MATH_TRIG_TAN OPTION_KEY PAGE_DOWN_KEY PAGE_UP_KEY PAUSE_KEY SHIFT_KEY TAB_KEY UNNAMED_KEY'.split(' ');
 for(const name of names){
  const key=`blockly-${name}`;
  assert.notEqual(lld[key],english[key],key);
  assert.deepEqual(tokens(lld[key]),tokens(english[key]),`${key}: exact tokens`);
 }
 for(const name of ['ACOS','ASIN','ATAN','COS','SIN','TAN'])
  assert.equal(lld[`blockly-MATH_TRIG_${name}`],lld[`blockly-MATH_TRIG_${name}_ARIA`]);
 assert.match(lld['blockly-PAGE_DOWN_KEY'],/ju$/);
 assert.match(lld['blockly-PAGE_UP_KEY'],/su$/);
 assert.notEqual(lld['blockly-INPUT_LABEL_MATH_DIVIDEND'],lld['blockly-INPUT_LABEL_MATH_DIVISOR']);
 assert.notEqual(lld['blockly-HOME_KEY'],lld['blockly-END_KEY']);
 for(const name of ['Alt','Backspace','Command','Control','Option'])
  assert.ok(lld[`blockly-${name.toUpperCase()}_KEY`].includes(name));
 // Product names remain recognizable; they are not prose needing translation.
 for(const name of ['CHROME_OS','LINUX','MAC_OS','WINDOWS'])
  assert.equal(lld[`blockly-${name}`],english[`blockly-${name}`]);
});

test('Upper Sorbian keyboard labels preserve navigation direction and key identity',()=>{
 const hsb=require('../imports/i18n/data/hsb.i18n.json');
 const names='ALT_KEY BACKSPACE_KEY CAPS_LOCK_KEY COMMAND_KEY CONTEXT_MENU_KEY CONTROL_KEY END_KEY ENTER_KEY ESCAPE HOME_KEY INSERT_KEY OPTION_KEY PAGE_DOWN_KEY PAGE_UP_KEY PAUSE_KEY SHIFT_KEY SPACE_KEY TAB_KEY'.split(' ');
 for(const name of names){
  const key=`blockly-${name}`;
  assert.notEqual(hsb[key],english[key],key);
  assert.deepEqual(tokens(hsb[key]),tokens(english[key]),`${key}: exact tokens`);
 }
 assert.match(hsb['blockly-PAGE_DOWN_KEY'],/dele$/);
 assert.match(hsb['blockly-PAGE_UP_KEY'],/horje$/);
 assert.notEqual(hsb['blockly-HOME_KEY'],hsb['blockly-END_KEY']);
 assert.notEqual(hsb['blockly-SHIFT_KEY'],hsb['blockly-CAPS_LOCK_KEY']);
 for(const name of ['Alt','Backspace','Command','Control','Option'])
  assert.ok(hsb[`blockly-${name.toUpperCase()}_KEY`].includes(name));
 // Standard math notation, shared mathematical words and product names are valid unchanged.
 for(const name of ['CHROME_OS','LINUX','MAC_OS','WINDOWS','INPUT_LABEL_NUMBER_MIN','MATH_ADDITION_SYMBOL_ARIA','MATH_ONLIST_OPERATOR_MIN_ARIA','MATH_SUBTRACTION_SYMBOL_ARIA','MATH_TRIG_ACOS','MATH_TRIG_ASIN','MATH_TRIG_ATAN','MATH_TRIG_COS','MATH_TRIG_SIN','MATH_TRIG_TAN'])
  assert.equal(hsb[`blockly-${name}`],english[`blockly-${name}`]);
});

test('Silesian keyboard labels preserve navigation direction and key identity',()=>{
 const szl=require('../imports/i18n/data/szl.i18n.json');
 const names='ALT_KEY BACKSPACE_KEY CAPS_LOCK_KEY COMMAND_KEY CONTEXT_MENU_KEY CONTROL_KEY END_KEY ENTER_KEY ESCAPE HOME_KEY INSERT_KEY OPTION_KEY PAGE_DOWN_KEY PAGE_UP_KEY PAUSE_KEY SHIFT_KEY SPACE_KEY TAB_KEY UNNAMED_KEY'.split(' ');
 for(const name of names){
  const key=`blockly-${name}`;
  assert.notEqual(szl[key],english[key],key);
  assert.deepEqual(tokens(szl[key]),tokens(english[key]),`${key}: exact tokens`);
 }
 assert.match(szl['blockly-PAGE_DOWN_KEY'],/w dōł$/);
 assert.match(szl['blockly-PAGE_UP_KEY'],/w gōra$/);
 assert.notEqual(szl['blockly-HOME_KEY'],szl['blockly-END_KEY']);
 assert.notEqual(szl['blockly-SHIFT_KEY'],szl['blockly-CAPS_LOCK_KEY']);
 for(const name of ['Alt','Backspace','Command','Control','Option','Enter','Shift'])
  assert.ok(szl[`blockly-${name.toUpperCase()}_KEY`].includes(name));
 // Product names and standard mathematical notation remain unchanged.
 for(const name of ['CHROME_OS','LINUX','MAC_OS','WINDOWS','MATH_ADDITION_SYMBOL_ARIA','MATH_SUBTRACTION_SYMBOL_ARIA','MATH_TRIG_ACOS','MATH_TRIG_ASIN','MATH_TRIG_ATAN','MATH_TRIG_COS','MATH_TRIG_SIN','MATH_TRIG_TAN'])
  assert.equal(szl[`blockly-${name}`],english[`blockly-${name}`]);
});
