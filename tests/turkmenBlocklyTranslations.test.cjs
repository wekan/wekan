'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tk_TM.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT"];
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
