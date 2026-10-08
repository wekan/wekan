'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tk_TM.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS"];
test('Turkmen Blockly translations preserve order and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[A-Za-z\u00c4\u00e4\u00c7\u00e7\u0147\u0148\u00d6\u00f6\u015e\u015f\u00dc\u00fc\u00dd\u00fd\u017d\u017e]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Turkmen colours and loop controls preserve bounds and action distinctions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.ok(locale['blockly-COLOUR_RGB_TOOLTIP'].includes('0 bilen 100'));
 assert.equal(new Set(['BLUE','GREEN','RED'].map(k=>locale['blockly-COLOUR_RGB_'+k])).size,3);
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes('\u00f6\u00e7\u00fcrip bolma\u00fdar'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("'%1' \u00fc\u00fdtge\u00fdjisini"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("'%2' funksi\u00fdasyny\u0148"));
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'].includes('galan b\u00f6legini ge\u00e7ir'));
 assert.ok(locale['blockly-COLLAPSED_WARNINGS_WARNING'].includes('du\u00fddury\u015flar bar'));
});
test('Turkmen loop and editing messages preserve conditions and operand roles',()=>{
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'].includes('di\u0148e'));
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'].includes('\u00fdalan'));
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'].includes('dogry'));
 assert.ok(locale['blockly-CONTROLS_IF_TOOLTIP_4'].includes('hi\u00e7 biri dogry bolmasa'));
 assert.ok(locale['blockly-CONTROLS_FOR_TITLE'].includes('%2-den %3-e \u00e7enli %4'));
 assert.ok(locale['blockly-CONTROLS_FOREACH_TITLE'].includes('%2 sanawdaky her %1'));
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes("'%2' \u00fc\u00fdtge\u00fdjisini\u0148 %1"));
 assert.notEqual(locale['blockly-DELETE_BLOCK'],locale['blockly-DISABLE_BLOCK']);
 assert.notEqual(locale['blockly-COPY_SHORTCUT'],locale['blockly-CUT_SHORTCUT']);
});
test('Turkmen input labels retain pixel coordinates and opposite actions',()=>{
 assert.ok(locale['blockly-FIELD_BITMAP_ARIA_VALUE'].includes('%1 \u00d7 %2'));
 assert.ok(locale['blockly-FIELD_BITMAP_ARIA_VALUE'].includes('%3 piksel'));
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('hatar %2, s\u00fct\u00fcn %3'));
 for(const kind of ['COMMENT','WARNING']){
  assert.ok(locale['blockly-ICON_LABEL_'+kind+'_CLOSED'].endsWith('a\u00e7'));
  assert.ok(locale['blockly-ICON_LABEL_'+kind+'_OPEN'].endsWith('\u00fdap'));
 }
 assert.notEqual(locale['blockly-INPUT_LABEL_CONDITION_A'],locale['blockly-INPUT_LABEL_CONDITION_B']);
 assert.notEqual(locale['blockly-INPUT_LABEL_LISTS_START_POSITION'],locale['blockly-INPUT_LABEL_LISTS_END_POSITION']);
 assert.ok(locale['blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT'].includes('tekst'));
 assert.ok(locale['blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST'].includes('sanaw'));
 assert.notEqual(locale['blockly-INPUT_LABEL_LISTS_REPEAT_ITEM'],locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM']);
 assert.ok(locale['blockly-HELP_PROMPT'].includes('%1 bas'));
});
test('Turkmen math inputs and navigation retain operand and shortcut roles',()=>{
 for(const pair of [['MATH_DIVIDEND','MATH_DIVISOR'],['NUMBER_A','NUMBER_B'],['NUMBER_MIN','NUMBER_MAX'],['TEXT_START_POSITION','TEXT_END_POSITION'],['TEXT_TO_FIND','TEXT_TO_REPLACE']]){
  assert.notEqual(locale['blockly-INPUT_LABEL_'+pair[0]],locale['blockly-INPUT_LABEL_'+pair[1]]);
 }
 for(const axis of ['X','Y']) assert.ok(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_'+axis].startsWith(axis.toLowerCase()));
 assert.ok(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'].includes('%1 basyp sakla'));
 assert.ok(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'].includes('tassyklamak \u00fc\u00e7in %2 bas'));
 assert.notEqual(locale['blockly-KEYBOARD_NAV_COPIED_HINT'],locale['blockly-KEYBOARD_NAV_CUT_HINT']);
 assert.equal(locale['blockly-INPUT_LABEL_VARIABLES_SET'],locale['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET']);
});
test('Turkmen list items distinguish retrieval, removal and copied sublists',()=>{
 for(const pos of ['FIRST','FROM','LAST','RANDOM']){
  const get=locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_'+pos];
  const remove=locale['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+pos];
  const both=locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_'+pos];
  assert.ok(get.includes('ga\u00fdtar\u00fdar') && !get.includes('a\u00fdyr\u00fdar'));
  assert.ok(remove.includes('a\u00fdyr\u00fdar') && !remove.includes('ga\u00fdtar\u00fdar'));
  assert.ok(both.includes('a\u00fdyr\u00fdar we ga\u00fdtar\u00fdar'));
 }
 assert.ok(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'].includes('0'));
 assert.ok(locale['blockly-LISTS_GET_SUBLIST_TOOLTIP'].includes('nusgasyny'));
 assert.ok(locale['blockly-LISTS_GET_SUBLIST_START_FROM_END'].includes('so\u0148undan'));
 assert.ok(!locale['blockly-LISTS_GET_SUBLIST_START_FROM_START'].includes('so\u0148undan'));
 assert.ok(locale['blockly-LISTS_INDEX_FROM_END_TOOLTIP'].includes('%1 so\u0148ky'));
});
test('Turkmen list search and updates retain missing results and insertion distinctions',()=>{
 assert.ok(locale['blockly-LISTS_INDEX_OF_TOOLTIP'].includes('tapylmasa, %1'));
 assert.ok(locale['blockly-LISTS_REPEAT_TITLE'].includes('%1 elementi %2 gezek'));
 for(const pos of ['FIRST','FROM','LAST','RANDOM']){
  assert.ok(locale['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_'+pos].includes('go\u015f'));
  assert.ok(locale['blockly-LISTS_SET_INDEX_TOOLTIP_SET_'+pos].includes('bahasyny belle\u00fd\u00e4r'));
 }
 for(const action of ['REVERSE','SORT']) assert.ok(locale['blockly-LISTS_'+action+'_TOOLTIP'].includes('nusga'));
 assert.notEqual(locale['blockly-LISTS_SORT_ORDER_ASCENDING'],locale['blockly-LISTS_SORT_ORDER_DESCENDING']);
 assert.ok(locale['blockly-LISTS_SORT_TYPE_IGNORECASE'].includes('tapawudyny hasaba alma'));
 assert.notEqual(locale['blockly-LISTS_INDEX_OF_FIRST'],locale['blockly-LISTS_INDEX_OF_LAST']);
});
test('Turkmen comparisons and Boolean logic retain boundaries and negation',()=>{
 assert.equal(new Set(['EQ','NEQ','GT','GTE','LT','LTE'].map(k=>locale['blockly-LOGIC_COMPARE_'+k+'_ARIA'])).size,6);
 for(const k of ['GTE','LTE']) assert.ok(locale['blockly-LOGIC_COMPARE_TOOLTIP_'+k].includes('\u00fda-da o\u0148a de\u0148'));
 assert.ok(locale['blockly-LOGIC_COMPARE_TOOLTIP_NEQ'].includes('de\u0148 bolmasa'));
 assert.ok(locale['blockly-LOGIC_NEGATE_TOOLTIP'].includes('\u00fdalan bolsa, dogry'));
 assert.ok(locale['blockly-LOGIC_NEGATE_TOOLTIP'].includes('dogry bolsa, \u00fdalan'));
 assert.ok(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'].includes('Iki giri\u015f hem'));
 assert.ok(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'].includes('azyndan biri'));
 for(const key of ['CONDITION','IF_FALSE','IF_TRUE']) assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale['blockly-LOGIC_TERNARY_'+key]));
 assert.ok(locale['blockly-LOGIC_NULL_TOOLTIP'].includes('null'));
 assert.notEqual(locale['blockly-LISTS_SPLIT_TEXT_FROM_LIST'],locale['blockly-LISTS_SPLIT_LIST_FROM_TEXT']);
 for(const key of ['JOIN','SPLIT']) assert.ok(locale['blockly-LISTS_SPLIT_TOOLTIP_'+key].includes('b\u00f6l\u00fcji'));
});
