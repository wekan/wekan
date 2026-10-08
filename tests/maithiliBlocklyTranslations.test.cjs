'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/mai.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DIALOG_OK", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP"];
test('Maithili Blockly translations preserve order, script and placeholders',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Maithili colours and loops retain bounds and control distinctions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'],/0.*100/);
 assert.equal(new Set(['RED','GREEN','BLUE'].map(c=>locale['blockly-COLOUR_RGB_'+c])).size,3);
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'].includes('\u0915\u0947\u0935\u0932 \u0932\u0942\u092a\u0915 \u092d\u0940\u0924\u0930'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u091a\u0930 '%1'"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u092b\u0932\u0928 '%2'"));
 assert.ok(locale['blockly-CONTROLS_FOREACH_TITLE'].includes('\u0938\u0942\u091a\u0940 %2'));
});

test('Maithili conditions and editing preserve branches and deletion roles',()=>{
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'].includes('\u092e\u093e\u0928 \u0905\u0938\u0924\u094d\u092f'));
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'].includes('\u092e\u093e\u0928 \u0938\u0924\u094d\u092f'));
 assert.ok(locale['blockly-CONTROLS_IF_TOOLTIP_4'].includes('\u0915\u094b\u0928\u094b \u092e\u093e\u0928 \u0938\u0924\u094d\u092f \u0928\u0939\u093f'));
 assert.ok(locale['blockly-CONTROLS_IF_TOOLTIP_4'].includes('\u0905\u0902\u0924\u093f\u092e \u092c\u094d\u0932\u0949\u0915'));
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes("\u091a\u0930 '%2'"));
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes('%1 \u0909\u092a\u092f\u094b\u0917'));
 assert.notEqual(locale['blockly-ENABLE_BLOCK'],locale['blockly-DISABLE_BLOCK']);
 assert.notEqual(locale['blockly-COLLAPSE_BLOCK'],locale['blockly-EXPAND_BLOCK']);
});

test('Maithili input labels retain coordinate roles and opposite actions',()=>{
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('\u092a\u093e\u0901\u0924\u093f %2'));
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('\u0938\u094d\u0924\u0902\u092d %3'));
 assert.notEqual(locale['blockly-FIELD_BITMAP_PIXEL_OFF'],locale['blockly-FIELD_BITMAP_PIXEL_ON']);
 for(const type of ['COMMENT','WARNING']) assert.notEqual(locale['blockly-ICON_LABEL_'+type+'_CLOSED'],locale['blockly-ICON_LABEL_'+type+'_OPEN']);
 assert.notEqual(locale['blockly-INPUT_LABEL_LISTS_REPEAT_ITEM'],locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM']);
 assert.notEqual(locale['blockly-INPUT_LABEL_LISTS_START_POSITION'],locale['blockly-INPUT_LABEL_LISTS_END_POSITION']);
 assert.equal(locale['blockly-FIELD_LABEL_EMPTY'],locale['blockly-INPUT_LABEL_EMPTY']);
});

test('Maithili mathematical inputs retain axes and distinct operand roles',()=>{
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'],/^x /);
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'],/^y /);
 for(const pair of [['MATH_DIVIDEND','MATH_DIVISOR'],['NUMBER_MIN','NUMBER_MAX'],['NUMBER_A','NUMBER_B'],['LOOP_FROM','LOOP_TO'],['TEXT_START_POSITION','TEXT_END_POSITION']]) assert.notEqual(locale['blockly-INPUT_LABEL_'+pair[0]],locale['blockly-INPUT_LABEL_'+pair[1]]);
 assert.equal(locale['blockly-INPUT_LABEL_TEXT_JOIN_ITEM'],locale['blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM']);
 assert.equal(locale['blockly-INPUT_LABEL_LOOP_TIMES'],locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM']);
});

test('Maithili list navigation retains empty length and separate actions',()=>{
 assert.ok(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'].includes('0'));
 assert.ok(locale['blockly-LISTS_GET_INDEX_FROM_END'].includes('#'));
 assert.equal(new Set(['GET','GET_REMOVE','REMOVE'].map(k=>locale['blockly-LISTS_GET_INDEX_'+k])).size,3);
 assert.notEqual(locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST'],locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST']);
 assert.ok(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'].includes('%1 \u0926\u092c\u094c\u0928\u0947 \u0930\u093e\u0916\u0942'));
 assert.ok(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'].includes('%2 \u0926\u092c\u093e\u0909'));
 assert.notEqual(locale['blockly-KEYBOARD_NAV_COPIED_HINT'],locale['blockly-KEYBOARD_NAV_CUT_HINT']);
});

test('Maithili list operations distinguish removal from returning a removed item',()=>{
 for(const position of ['FIRST','FROM','LAST','RANDOM']){
  const removed=locale['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+position];
  const returned=locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_'+position];
  assert.ok(removed.includes('\u0939\u091f\u092c\u0948\u0924'));
  assert.ok(returned.includes('\u0939\u091f\u092c\u0948\u0924'));
  assert.ok(returned.includes('\u0926\u0947\u0924 \u0905\u091b\u093f'));
  assert.ok(!removed.includes('\u0926\u0947\u0924 \u0905\u091b\u093f'));
 }
 assert.ok(locale['blockly-LISTS_INDEX_OF_TOOLTIP'].includes('\u0928\u0939\u093f \u092d\u0947\u091f\u0932\u093e \u092a\u0930 %1'));
 for(const key of ['END_FROM_END','END_FROM_START','START_FROM_END','START_FROM_START']) assert.ok(locale['blockly-LISTS_GET_SUBLIST_'+key].includes('#'));
 assert.notEqual(locale['blockly-LISTS_INDEX_FROM_END_TOOLTIP'],locale['blockly-LISTS_INDEX_FROM_START_TOOLTIP']);
});
