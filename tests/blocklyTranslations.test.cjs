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

test('movement announcements preserve arguments and distinguish directions in every non-English locale', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const names='CANT_SCROLL_FURTHER MOVE_AFTER MOVE_AROUND MOVE_BEFORE MOVE_CANCELED MOVE_INSIDE MOVE_TO MOVE_WORKSPACE SCROLLED_DOWN SCROLLED_LEFT SCROLLED_RIGHT SCROLLED_UP'.split(' ');
 for(const code of fs.readdirSync(path.join(root,'imports/i18n/data')).filter(f=>f.endsWith('.i18n.json')&&!/^en(?:[-_]|\.)/.test(f)).map(f=>f.replace('.i18n.json',''))){
  const data=require(`../imports/i18n/data/${code}.i18n.json`);
  for(const name of names){
   const key=`blockly-ANNOUNCE_${name}`;
   assert.ok(data[key]?.trim(),`${code}:${key}`);
   assert.notEqual(data[key],english[key],`${code}:${key}`);
   assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),`${code}:${key}`);
  }
  assert.equal(new Set(['DOWN','LEFT','RIGHT','UP'].map(n=>data[`blockly-ANNOUNCE_SCROLLED_${n}`])).size,4,code);
  assert.notEqual(data['blockly-ANNOUNCE_MOVE_BEFORE'],data['blockly-ANNOUNCE_MOVE_AFTER'],code);
  assert.notEqual(data['blockly-ANNOUNCE_MOVE_INSIDE'],data['blockly-ANNOUNCE_MOVE_AROUND'],code);
 }
});

test('filled comment and accessibility controls preserve arguments and opposite actions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const names=['ADD_COMMENT','REMOVE_COMMENT',...'ADD_ELSE_IF ADD_INPUT ADD_LIST_ITEM ADD_TEXT BUTTON COMMENT_COLLAPSE COMMENT_EXPAND FIELD_ANGLE REMOVE_ELSE_IF REMOVE_INPUT REMOVE_LIST_ITEM REMOVE_TEXT TRASH_EMPTY'.split(' ').map(n=>'ARIA_LABEL_'+n)];
 for(const code of ['ku','ckb','tt','so','ny','mi','sm','tk_TM','yi','bho','mai','or_IN','kok','pap','ary','st','tn','nso','zu','zu-ZA','xh','ss','nd','ts','ve','bi','tpi','fj','to','haw','om','rw','rn','lg','wa','wa-RR','ace','gv','se','ve-CC','rup','ak','bm','ee','wo','ff','ks','bua','cv','sah','bo','dz','ti','qu','ay','gn','vo','tlh','ve-PP','wuu-Hans','nah','zgh','kl','iu']){
  const data=require(`../imports/i18n/data/${code}.i18n.json`);
  for(const name of names){
   const key='blockly-'+name;
   assert.ok(data[key]?.trim(),`${code}:${key}`);
   assert.notEqual(data[key],english[key],`${code}:${key}`);
   assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),`${code}:${key}`);
  }
  for(const kind of ['ELSE_IF','INPUT','LIST_ITEM','TEXT'])assert.notEqual(data['blockly-ARIA_LABEL_ADD_'+kind],data['blockly-ARIA_LABEL_REMOVE_'+kind],`${code}:${kind}`);
  assert.notEqual(data['blockly-ARIA_LABEL_COMMENT_COLLAPSE'],data['blockly-ARIA_LABEL_COMMENT_EXPAND'],code);
  assert.notEqual(data['blockly-ADD_COMMENT'],data['blockly-REMOVE_COMMENT'],code);
 }
 assert.equal(require('../imports/i18n/data/tt.i18n.json').text,'Текст');
 assert.equal(require('../imports/i18n/data/to.i18n.json').text,'Lea kuo tohi');
 assert.equal(require('../imports/i18n/data/ak.i18n.json').text,'Nsɛm a wɔakyerɛw');
 for(const [code,value] of [['qu','Qillqasqa'],['vo','Vödem'],['tlh','ghItlh']])assert.equal(require(`../imports/i18n/data/${code}.i18n.json`).text,value);
});

test('Waray field labels do not retain Walloon seed text',()=>{
 const data=require('../imports/i18n/data/wa-RR.i18n.json');
 assert.equal(data.date,'Petsa');
 assert.equal(data['custom-field-dropdown'],'Lista nga naabri tipaubos');
 assert.equal(data['custom-field-checkbox'],'Kahon nga mamarkahan');
 assert.equal(data['custom-field-dropdownMultiSelect'],'Lista nga mahimo pumili hin damu');
 const walloon=require('../imports/i18n/data/wa.i18n.json');
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-ARIA_TYPE_FIELD_'))){
  assert.notEqual(data[key],walloon[key],key);
 }
});

test('Venda and Tsonga field labels replace foreign seeds and filler',()=>{
 const ve=require('../imports/i18n/data/ve.i18n.json');
 const ts=require('../imports/i18n/data/ts.i18n.json');
 assert.equal(ve.date,'Datumu');
 assert.equal(ve['custom-field-dropdown'],'Mutevhe une wa tsitsa');
 assert.equal(ve['custom-field-checkbox'],'Bogisi ḽa u maka');
 assert.equal(ts['custom-field-dropdown'],'Nxaxamelo lowu rhelelaka');
 assert.equal(ts['custom-field-checkbox'],'Bokisi ro fungha');
});

test('Luganda generic selectors do not retain English with a language label',()=>{
 const data=require('../imports/i18n/data/lg.i18n.json');
 assert.equal(data['custom-field-dropdown'],'Olukalala olukakka');
 assert.equal(data['custom-field-checkbox'],"Akasanduuko ak'okulonda");
});

test('Bislama and Tok Pisin selectors do not retain prefixed English filler',()=>{
 for(const [code,dropdown,checkbox] of [['bi','Lis we i open i go daon','Bokis blong tikim'],['tpi','Lis i op i go daun','Bokis bilong tikim']]){
  const data=require(`../imports/i18n/data/${code}.i18n.json`);
  assert.equal(data['custom-field-dropdown'],dropdown);
  assert.equal(data['custom-field-checkbox'],checkbox);
 }
});

test('Tongan and Hawaiian selectors use descriptive local wording',()=>{
 for(const [code,dropdown,checkbox] of [['to','Lisi ʻoku hifo ki lalo','Puha fakaʻilonga'],['haw','Papa inoa e hāʻule iho ana','Pahu kaha']]){
  const data=require(`../imports/i18n/data/${code}.i18n.json`);
  assert.equal(data['custom-field-dropdown'],dropdown);
  assert.equal(data['custom-field-checkbox'],checkbox);
 }
});

test('Quechua and Aymara selectors replace prefixed English controls',()=>{
 for(const [code,dropdown,checkbox] of [['qu','Urayman kichakuq sinri',"Chikunan tawa k'uchu"],['ay',"Aynachar jist'arañ lista","Chimpuntañ jisk'a kajuna"]]){
  const data=require(`../imports/i18n/data/${code}.i18n.json`);
  assert.equal(data['custom-field-dropdown'],dropdown);
  assert.equal(data['custom-field-checkbox'],checkbox);
 }
});

test('Acehnese selectors replace Malay seeds and Veps uses its own angle and color words',()=>{
 const ace=require('../imports/i18n/data/ace.i18n.json');
 const vep=require('../imports/i18n/data/ve-PP.i18n.json');
 assert.equal(ace['custom-field-dropdown'],'Dapeuta nyang teubuka u yup');
 assert.equal(ace['custom-field-checkbox'],'Kotak tanda');
 assert.equal(vep['blockly-ARIA_TYPE_FIELD_ANGLE'],'čoga');
 assert.equal(vep['blockly-ARIA_TYPE_FIELD_COLOUR'],'muju');
});

test('Akan selectors replace English and generic activity filler',()=>{
 const data=require('../imports/i18n/data/ak.i18n.json');
 assert.equal(data['custom-field-dropdown'],'Nhyehyɛe a ɛba fam');
 assert.equal(data['custom-field-checkbox'],'Adaka a wɔhyɛ no agyirae');
});

test('Volapük and Klingon controls replace foreign-language seeds',()=>{
 const vo=require('../imports/i18n/data/vo.i18n.json');
 const tlh=require('../imports/i18n/data/tlh.i18n.json');
 assert.equal(vo['custom-field-text'],'Vödem');
 assert.equal(vo['custom-field-date'],'Dät');
 assert.equal(tlh['custom-field-text'],'ghItlh');
 assert.equal(vo['blockly-ARIA_TYPE_FIELD_ANGLE'],'gul');
 assert.equal(tlh['blockly-ARIA_TYPE_FIELD_BITMAP'],"HaStay' mIllogh");
});

test('Tigre date controls use the file\'s one date word',()=>{
 // 96fd0432bd changed only these two to ዕለት, reasoning that ተመር is also the
 // date fruit. ተመር is the reviewed Tigre "date" everywhere else (`date`, every
 // date popup title, the audited repair table - 42 values), so one control
 // diverged and two guards failed. Whether ተመር should become ዕለት is ONE
 // decision for a Tigre speaker, for every value at once, not for one key.
 const tig=require('../imports/i18n/data/tig.i18n.json');
 assert.equal(tig['custom-field-date'],tig.date);
 assert.equal(tig['blockly-ARIA_TYPE_FIELD_DATE'],tig['custom-field-date']);
});

test('Wolaytta field labels replace English filler and preserve source tokens',async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const wal=require('../imports/i18n/data/wal.i18n.json');
 for(const name of 'BITMAP CHECKBOX COLOUR DATE DROPDOWN GRID IMAGE INPUT TEXT_INPUT_ARGUMENT TEXT_INPUT_PROCEDURE'.split(' ')){
  const key='blockly-ARIA_TYPE_FIELD_'+name;
  assert(wal[key].trim());
  assert.notEqual(wal[key],english[key]);
  assert.deepEqual(translationTokens(wal[key]),translationTokens(english[key]));
 }
 for(const [left,right] of [['BITMAP','IMAGE'],['GRID','DROPDOWN'],['INPUT','TEXT_INPUT_ARGUMENT'],['TEXT_INPUT_ARGUMENT','TEXT_INPUT_PROCEDURE']]) assert.notEqual(wal['blockly-ARIA_TYPE_FIELD_'+left],wal['blockly-ARIA_TYPE_FIELD_'+right]);
 assert.equal(wal['custom-field-checkbox'],'Malaata wottiyo saaxiniyaa');
 assert.equal(wal['custom-field-dropdown'],'Duge dooyettiya mazgabaa');
 assert.equal(wal['custom-field-text'],'Xaafetta');
});

test('filled field types distinguish images, selectors and input names', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const names='ANGLE BITMAP CHECKBOX COLOUR DATE DROPDOWN GRID IMAGE INPUT TEXT_INPUT_ARGUMENT TEXT_INPUT_PROCEDURE'.split(' ');
 for(const code of ['ku','ckb','tt','so','yi','ary','bho','mai','tk_TM','or_IN','kok','pap','wuu-Hans','wa','wa-RR','ve-CC','gv','rup','st','tn','nso','zu','zu-ZA','xh','ss','ts','ve','nd','rw','rn','lg','om','ny','bi','tpi','fj','sm','mi','to','haw','bua','cv','sah','qu','ay','gn','bo','dz','ti','ks','se','ve-PP','ace','ak','bm','wo','vo','tlh','ee','ff','nah','kl','iu','zgh','tig','chr']){
  const data=require(`../imports/i18n/data/${code}.i18n.json`);
  for(const name of names){
   const key='blockly-ARIA_TYPE_FIELD_'+name;
   assert.ok(data[key]?.trim(),`${code}:${key}`);
   assert.notEqual(data[key],english[key],`${code}:${key}`);
   assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),`${code}:${key}`);
  }
  for(const [a,b] of [['BITMAP','IMAGE'],['GRID','DROPDOWN'],['INPUT','TEXT_INPUT_ARGUMENT'],['TEXT_INPUT_ARGUMENT','TEXT_INPUT_PROCEDURE']]){
   assert.notEqual(data['blockly-ARIA_TYPE_FIELD_'+a],data['blockly-ARIA_TYPE_FIELD_'+b],`${code}:${a}/${b}`);
  }
 }
});

test('filled block and bubble labels preserve arguments and semantic distinctions',async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=Object.keys(english).filter(k=>/^blockly-(BLOCK_LABEL_|BUBBLE_LABEL_)/.test(k));
 for(const code of ['ku','ckb','tt','yi','tk_TM','bho','mai','so','ary','or_IN','kok','mi','sm','haw','to','bi','tpi','fj','pap','zu','zu-ZA','xh','ss','nd','st','tn','nso','rw','rn','lg','ny','ts','ve','wuu-Hans','ve-CC','wa','wa-RR','ak']){
  const data=require(`../imports/i18n/data/${code}.i18n.json`);
  for(const key of keys){
   assert.ok(data[key]?.trim(),`${code}:${key}`);
   assert.notEqual(data[key],english[key],`${code}:${key}`);
   assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),`${code}:${key}`);
  }
  for(const [left,right] of [['BLOCK_LABEL_HAS_INPUT','BLOCK_LABEL_HAS_INPUTS'],['BLOCK_LABEL_COLLAPSED','BLOCK_LABEL_DISABLED'],['BLOCK_LABEL_STATEMENT','BLOCK_LABEL_VALUE'],['BUBBLE_LABEL_COMMENT','BUBBLE_LABEL_WARNING']]){
   assert.notEqual(data['blockly-'+left],data['blockly-'+right],`${code}:${left}/${right}`);
  }
 }
});

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

test('Akan editing, colors and flow controls preserve arguments and operation distinctions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const color of ['BLUE','GREEN','RED']) assert.equal(data['blockly-COLOUR_RGB_'+color],data['color-'+color.toLowerCase()]);
 assert.equal(new Set(['blue','green','red'].map(c=>data['color-'+c])).size,3);
 assert.match(data['blockly-COLOUR_BLEND_TOOLTIP'],/0\.0 - 1\.0/);
 assert.match(data['blockly-COLOUR_RGB_TOOLTIP'],/0 ne 100/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'],/mu nkutoo/);
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/nyɛ nokware/);
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/no yɛ nokware/);
 assert.notEqual(data['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],data['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
});

test('Akan editing and field controls preserve scope and opposite actions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const kind of ['COMMENT','WARNING']){
  assert.match(data['blockly-ICON_LABEL_'+kind+'_CLOSED'],/^Bue/);
  assert.match(data['blockly-ICON_LABEL_'+kind+'_OPEN'],/^To.*mu$/);
 }
 assert.match(data['blockly-COPY_ALL_TO_BACKPACK'],/nyinaa/);
 assert.match(data['blockly-DELETE_ALL_BLOCKS'],/nyinaa/);
 assert.match(data['blockly-DISABLE_BLOCK'],/^Dum/);
 assert.match(data['blockly-ENABLE_BLOCK'],/nyɛ adwuma/);
 assert.notEqual(data['blockly-EXTERNAL_INPUTS'],data['blockly-INLINE_INPUTS']);
 assert.notEqual(data['blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR'],data['blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE']);
});

test('Akan input and keyboard labels preserve arguments and input roles', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const [a,b] of [['CONDITION_A','CONDITION_B'],['LOOP_FROM','LOOP_TO'],['MATH_DIVIDEND','MATH_DIVISOR'],['NUMBER_MAX','NUMBER_MIN'],['TEXT_START_POSITION','TEXT_END_POSITION'],['LISTS_LIST_FROM_TEXT','LISTS_TEXT_FROM_LIST']]){
  assert.notEqual(data['blockly-INPUT_LABEL_'+a],data['blockly-INPUT_LABEL_'+b]);
 }
 for(const axis of ['X','Y']) assert.ok(data['blockly-INPUT_LABEL_NUMBER_ATAN2_'+axis].startsWith(axis.toLowerCase()+' '));
 assert.match(data['blockly-INPUT_LABEL_TEXT_APPEND'],/awiei/);
 assert.notEqual(data['blockly-KEYBOARD_NAV_COPIED_HINT'],data['blockly-KEYBOARD_NAV_CUT_HINT']);
 assert.match(data['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'],/%1.*%2.*gye gyinabea no tom/);
});

test('Akan list retrieval distinguishes returning and removing values', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const position of ['FIRST','FROM','LAST','RANDOM']){
  const prefix='blockly-LISTS_GET_INDEX_TOOLTIP_';
  assert.match(data[prefix+'GET_'+position],/^Ɛsan de/);
  assert.doesNotMatch(data[prefix+'GET_'+position],/Ɛyi/);
  assert.match(data[prefix+'GET_REMOVE_'+position],/^Ɛyi.*ɛsan de ba/);
  assert.match(data[prefix+'REMOVE_'+position],/^Ɛyi/);
  assert.doesNotMatch(data[prefix+'REMOVE_'+position],/ɛsan de/);
 }
 assert.match(data['blockly-LISTS_INDEX_OF_TOOLTIP'],/Sɛ wɔanhu ade no a, ɛsan de %1 ba/);
 assert.match(data['blockly-LISTS_REVERSE_TOOLTIP'],/no bi/);
 assert.ok(data['blockly-LISTS_GET_INDEX_FROM_END'].includes('#'));
});

test('Akan list mutation and logic preserve operation and comparison boundaries', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const pos of ['FIRST','FROM','LAST','RANDOM']){
  assert.match(data['blockly-LISTS_SET_INDEX_TOOLTIP_SET_'+pos],/^Ɛhyɛ.*botae/);
  assert.notEqual(data['blockly-LISTS_SET_INDEX_TOOLTIP_SET_'+pos],data['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_'+pos]);
 }
 for(const op of ['GT','LT']){
  assert.doesNotMatch(data['blockly-LOGIC_COMPARE_'+op+'_ARIA'],/yɛ pɛ/);
  assert.match(data['blockly-LOGIC_COMPARE_'+op+'E_ARIA'],/anaa.*yɛ pɛ/);
 }
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_AND'],/abien.*nyinaa/);
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_OR'],/biako mpo/);
 assert.match(data['blockly-LISTS_SORT_TOOLTIP'],/no bi/);
 for(const key of ['CONDITION','IF_FALSE','IF_TRUE']) assert.ok(data['blockly-LOGIC_TERNARY_TOOLTIP'].includes(data['blockly-LOGIC_TERNARY_'+key]));
});

test('Akan arithmetic and number properties preserve notation and boundaries', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['blockly-MATH_ATAN2_TOOLTIP'],/-180 kosi 180/);
 assert.match(data['blockly-MATH_CONSTRAIN_TOOLTIP'],/ahye no ankasa ka ho/);
 assert.match(data['blockly-MATH_IS_NEGATIVE'],/esua sen/);
 assert.match(data['blockly-MATH_IS_POSITIVE'],/ɛso sen/);
 assert.match(data['blockly-MATH_IS_PRIME'],/ɛso sen 1/);
 assert.ok(data['blockly-MATH_MODULO_TITLE'].includes('%1 ÷ %2'));
 for(const notation of ['π (3.141…)','e (2.718…)','φ (1.618…)','sqrt(2) (1.414…)','sqrt(½) (0.707…)','∞']) assert.ok(data['blockly-MATH_CONSTANT_TOOLTIP'].includes(notation));
});

test('Akan statistics and random values preserve operation and endpoint distinctions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 const operations=['AVERAGE','MEDIAN','MODE','STD_DEV','SUM'].map(k=>data['blockly-MATH_ONLIST_OPERATOR_'+k]);
 assert.equal(new Set(operations).size,operations.length);
 assert.match(data['blockly-MATH_RANDOM_FLOAT_TOOLTIP'],/0\.0 \(ɛka ho\).*1\.0 \(ɛnka ho\)/);
 assert.match(data['blockly-MATH_RANDOM_INT_TOOLTIP'],/ahye abien no ankasa ka ho/);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'],/fam/);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDUP'],/soro/);
 assert.match(data['blockly-MATH_ONLIST_TOOLTIP_MODE'],/mpɛn pii sen biara/);
});

test('Akan unary math and workspace labels preserve bases and units', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['blockly-MATH_SINGLE_OP_LN_ARIA'],/nnyinaso yɛ e/);
 assert.match(data['blockly-MATH_SINGLE_OP_LOG10_ARIA'],/nnyinaso yɛ 10/);
 for(const op of ['COS','SIN','TAN']){
  assert.match(data['blockly-MATH_TRIG_TOOLTIP_'+op],/digrii.*ɛnyɛ radian/);
  assert.match(data['blockly-MATH_TRIG_A'+op+'_ARIA'],/akyi kwan/);
 }
 assert.match(data['blockly-MATH_SINGLE_TOOLTIP_NEG'],/adan.*agyirae/);
 assert.match(data['blockly-OPEN_BACKPACK'],/^Bue/);
 assert.match(data['blockly-CLOSE_BACKPACK'],/^To.*mu$/);
 assert.notEqual(data['blockly-NEW_VARIABLE_TITLE'],data['blockly-NEW_VARIABLE_TYPE_TITLE']);
});

test('Akan procedure and screenreader messages preserve return values and state changes', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'],/ɛnsan mfa botae biara mma/);
 assert.match(data['blockly-PROCEDURES_DEFRETURN_TOOLTIP'],/ɛsan de botae ba/);
 assert.match(data['blockly-PROCEDURES_IFRETURN_WARNING'],/mu nkutoo/);
 assert.match(data['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'],/wɔadum/);
 assert.match(data['blockly-RENAME_VARIABLE_TITLE'],/nyinaa/);
 assert.match(data['blockly-SCREENREADER_MODE_DISABLED'],/^Wɔadum.*sɔ no$/);
 assert.match(data['blockly-SCREENREADER_MODE_ENABLED'],/^Wɔasɔ.*dum no$/);
});

test('Akan shortcuts preserve navigation direction and action distinctions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const [direction,word] of [['DOWN','fam'],['UP','soro'],['LEFT','benkum'],['RIGHT','nifa']]){
  assert.ok(data['blockly-SHORTCUTS_MOVE_'+direction].endsWith(word));
  assert.ok(data['blockly-SHORTCUTS_SCROLL_'+direction].endsWith(word));
  assert.match(data['blockly-SHORTCUTS_SCROLL_'+direction],/^Twe nea ɛda adi/);
 }
 for(const [a,b] of [['ABORT_MOVE','FINISH_MOVE'],['JUMP_BLOCK_START','JUMP_BLOCK_END'],['JUMP_TOP_STACK','JUMP_BOTTOM_STACK'],['NEXT_HEADING','PREVIOUS_HEADING'],['NEXT_STACK','PREVIOUS_STACK']]) assert.notEqual(data['blockly-SHORTCUTS_'+a],data['blockly-SHORTCUTS_'+b]);
 for(const key of ['JUMP_PREVIOUS_PAGE','PREVIOUS_HEADING','PREVIOUS_STACK']) assert.match(data['blockly-SHORTCUTS_'+key],/atwam/);
});

test('Akan text operations preserve arguments, endpoints and empty results', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-TEXT_APPEND_VARIABLE", "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const family of ['CHARAT','INDEXOF_OPERATOR']){
  assert.match(data['blockly-TEXT_'+family+'_FIRST'],/edi kan/);
  assert.match(data['blockly-TEXT_'+family+'_LAST'],/etwa to/);
 }
 assert.match(data['blockly-TEXT_INDEXOF_TOOLTIP'],/wɔanhu.*%1/);
 assert.match(data['blockly-TEXT_LENGTH_TOOLTIP'],/ntam kwan ka ho/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_BOTH'],/abien nyinaa/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_LEFT'],/benkum/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_RIGHT'],/nifa/);
 assert.match(data['blockly-TEXT_REVERSE_TOOLTIP'],/etwa to.*edi kan/);
 assert.notEqual(data['blockly-TEXT_PROMPT_TYPE_NUMBER'],data['blockly-TEXT_PROMPT_TYPE_TEXT']);
 for(const suffix of ['LOWERCASE','TITLECASE','UPPERCASE']) assert.ok(data['blockly-TEXT_CHANGECASE_OPERATOR_'+suffix]);
 assert.equal(new Set(['LOWERCASE','TITLECASE','UPPERCASE'].map(s=>data['blockly-TEXT_CHANGECASE_OPERATOR_'+s])).size,3);
});

test('Akan variables and workspace messages preserve counts and search controls', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const data=require('../imports/i18n/data/ak.i18n.json');
 const keys=["blockly-TODAY", "blockly-UNDO", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-LISTS_CREATE_WITH_ITEM_TITLE", "blockly-MATH_CHANGE_TITLE_ITEM"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.notEqual(data['blockly-UNDO'],data['blockly-REDO']);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'],/biara nni/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE'],/biako/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_MANY'],/%1/);
 for(const suffix of ['ONE','MANY']) assert.ok(data['blockly-WORKSPACE_CONTENTS_COMMENTS_'+suffix].startsWith(' '));
 for(const shortcut of ['Enter','Shift+Enter','Escape']) assert.ok(data['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(shortcut));
 assert.match(data['blockly-WORKSPACE_SEARCH_FIND_NEXT'],/edi hɔ/);
 assert.match(data['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS'],/atwam/);
 for(const suffix of ['COMMENT','PROCEDURE']) assert.equal(data['blockly-PROCEDURES_DEFRETURN_'+suffix],data['blockly-PROCEDURES_DEFNORETURN_'+suffix]);
 for(const name of ['LISTS_GET_INDEX','LISTS_GET_SUBLIST','LISTS_INDEX_OF','LISTS_SET_INDEX']) assert.equal(data['blockly-'+name+'_INPUT_IN_LIST'],data['blockly-LISTS_INLIST']);
});
