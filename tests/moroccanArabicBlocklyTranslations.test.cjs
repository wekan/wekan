'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ary.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["card-field-visibility", "card-field-visibility-desc", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-LOGIC_OPERATION_OR", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP"];
test('Moroccan Arabic Blockly translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0600-\u06ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Moroccan Arabic colours and controls retain bounds and deletion restrictions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.ok(locale['blockly-COLOUR_RGB_TOOLTIP'].includes('\u0628\u064a\u0646 0 \u0648100'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes('\u0645\u0627 \u064a\u0645\u0643\u0646\u0634'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u0627\u0644\u0645\u062a\u063a\u064a\u0651\u0631 '%1'"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u0627\u0644\u062f\u0627\u0644\u0629 '%2'"));
 assert.ok(locale['blockly-COLLAPSED_WARNINGS_WARNING'].includes('\u0641\u064a\u0647\u0627 \u062a\u062d\u0630\u064a\u0631\u0627\u062a'));
 assert.equal(new Set(['RED','GREEN','BLUE'].map(k=>locale['blockly-COLOUR_RGB_'+k])).size,3);
});

test('Moroccan Arabic loops distinguish stopping, continuing and truth conditions',()=>{
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'],/خرج/);
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'],/الدورة الجاية/);
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'],/غير داخل حلقة/);
 assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/خاطئة/);
 assert.doesNotMatch(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/صحيحة/);
 assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/صحيحة/);
 assert.doesNotMatch(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/خاطئة/);
 assert.match(locale['blockly-CONTROLS_IF_TOOLTIP_4'],/ما كانت حتى قيمة صحيحة/);
 assert.match(locale['blockly-CONTROLS_FOR_TITLE'],/%1.*%2.*%3.*%4/);
});

test('Moroccan Arabic workspace actions and bitmap announcements retain their meaning',()=>{
 for(const type of ['COMMENT','WARNING']){
  assert.match(locale['blockly-ICON_LABEL_'+type+'_CLOSED'],/حلّ/);
  assert.match(locale['blockly-ICON_LABEL_'+type+'_OPEN'],/سدّ/);
  assert.doesNotMatch(locale['blockly-ICON_LABEL_'+type+'_OPEN'],/حلّ/);
 }
 assert.match(locale['blockly-DISABLE_BLOCK'],/تعطيل/);
 assert.match(locale['blockly-ENABLE_BLOCK'],/تفعيل/);
 assert.equal(locale['blockly-FIELD_BITMAP_PIXEL_ON'],'شاعل');
 assert.equal(locale['blockly-FIELD_BITMAP_PIXEL_OFF'],'طافي');
 assert.match(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'],/%1.*السطر %2.*العمود %3/);
 assert.match(locale['blockly-FIELD_BITMAP_ARIA_VALUE'],/%1.*%2.*%3 بيكسلات شاعلين/);
 assert.match(locale['blockly-DELETE_VARIABLE_CONFIRMATION'],/%1 استعمالات.*المتغيّر '%2'/);
 assert.match(locale['blockly-INPUT_LABEL_LISTS_START_POSITION'],/البداية/);
 assert.match(locale['blockly-INPUT_LABEL_LISTS_END_POSITION'],/النهاية/);
 assert.notEqual(locale['blockly-EXTERNAL_INPUTS'],locale['blockly-INLINE_INPUTS']);
});

test('Moroccan Arabic numeric inputs and keyboard hints preserve operand roles',()=>{
 assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'],'المقسوم');
 assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVISOR'],'المقسوم عليه');
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_MAX'],/الأقصى/);
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_MIN'],/الأدنى/);
 assert.doesNotMatch(locale['blockly-INPUT_LABEL_NUMBER_MIN'],/الأقصى/);
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'],/ x$/);
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'],/ y$/);
 assert.match(locale['blockly-INPUT_LABEL_LOOP_FROM'],/البداية/);
 assert.match(locale['blockly-INPUT_LABEL_LOOP_TO'],/النهاية/);
 assert.match(locale['blockly-INPUT_LABEL_TEXT_APPEND'],/فالآخر/);
 assert.match(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'],/ضاغط على %1.*%2 باش تقبل الموضع/);
 assert.match(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'],/طولها 0.*ما فيها حتى سجل/);
 assert.match(locale['blockly-LISTS_GET_INDEX_FROM_END'],/^# من الآخر$/);
});

test('Moroccan Arabic list operations preserve retrieval and removal semantics',()=>{
 for(const position of ['FIRST','FROM','LAST','RANDOM']){
  const prefix='blockly-LISTS_GET_INDEX_TOOLTIP_';
  assert.match(locale[prefix+'GET_'+position],/كيرجّع/);
  assert.doesNotMatch(locale[prefix+'GET_'+position],/كيحيّد/);
  assert.match(locale[prefix+'REMOVE_'+position],/كيحيّد/);
  assert.doesNotMatch(locale[prefix+'REMOVE_'+position],/كيرجّع/);
  assert.match(locale[prefix+'GET_REMOVE_'+position],/كيحيّد وكيرجّع/);
 }
 assert.match(locale['blockly-LISTS_GET_SUBLIST_TOOLTIP'],/نسخة/);
 assert.match(locale['blockly-LISTS_REVERSE_TOOLTIP'],/نسخة/);
 assert.match(locale['blockly-LISTS_INDEX_OF_TOOLTIP'],/%1 إلا ما تلقاش العنصر/);
 assert.match(locale['blockly-LISTS_INDEX_FROM_END_TOOLTIP'],/الأخير/);
 assert.match(locale['blockly-LISTS_INDEX_FROM_START_TOOLTIP'],/الأول/);
 assert.match(locale['blockly-LISTS_REPEAT_TITLE'],/العنصر %1.*%2 مرات/);
 assert.match(locale['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST'],/فبداية/);
 assert.match(locale['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST'],/فنهاية/);
});

test('Moroccan Arabic logic preserves comparison, negation and branch meanings',()=>{
 for(const type of ['ARIA','TOOLTIP']){
  const key=op=>'blockly-LOGIC_COMPARE_'+(type==='ARIA'?op+'_ARIA':'TOOLTIP_'+op);
  assert.match(locale[key('GT')],/كبر من/);
  assert.match(locale[key('LT')],/صغر من/);
  assert.doesNotMatch(locale[key('GT')],/كيساوي/);
  assert.doesNotMatch(locale[key('LT')],/كيساوي/);
  assert.match(locale[key('GTE')],/كبر من ولا كيساوي/);
  assert.match(locale[key('LTE')],/صغر من ولا كيساوي/);
 }
 assert.match(locale['blockly-LOGIC_COMPARE_TOOLTIP_NEQ'],/ما كانوش/);
 assert.match(locale['blockly-LOGIC_NEGATE_TOOLTIP'],/صحيح إلا كان المدخل خاطئ.*خاطئ إلا كان المدخل صحيح/);
 assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'],/جوج المداخل صحيحين/);
 assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'],/على الأقل مدخل واحد صحيح/);
 assert.notEqual(locale['blockly-LOGIC_OPERATION_AND'],locale['blockly-LOGIC_OPERATION_OR']);
 for(const branch of ['TRUE','FALSE']) assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale['blockly-LOGIC_TERNARY_IF_'+branch]));
 assert.match(locale['blockly-LISTS_SORT_TOOLTIP'],/نسخة/);
 assert.match(locale['blockly-LISTS_SORT_TYPE_IGNORECASE'],/بلا فرق بين الحروف الكبيرة والصغيرة/);
 assert.match(locale['blockly-LISTS_SPLIT_TOOLTIP_JOIN'],/جمع/);
 assert.match(locale['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'],/قسّم/);
});

test('Moroccan Arabic math preserves bounds, powers and statistics',()=>{
 assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'],/0\.0 \(داخل فالمجال\).*1\.0 \(ما داخلش فالمجال\)/);
 assert.match(locale['blockly-MATH_RANDOM_INT_TOOLTIP'],/الحدّين داخلين فالمجال/);
 assert.match(locale['blockly-MATH_CONSTRAIN_TITLE'],/%1.*الأدنى %2.*الأقصى %3/);
 assert.match(locale['blockly-MATH_ATAN2_TOOLTIP'],/بالدرجات من -180 حتى 180/);
 assert.match(locale['blockly-MATH_ARITHMETIC_TOOLTIP_POWER'],/الأول.*للقوة.*الثاني/);
 assert.match(locale['blockly-MATH_MODULO_TOOLTIP'],/الباقي/);
 assert.doesNotMatch(locale['blockly-MATH_MODULO_TOOLTIP'],/حاصل قسمة/);
 assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_AVERAGE'],/المتوسط الحسابي/);
 assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_MEDIAN'],/الوسيط/);
 assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_MODE'],/الأكثر تكرار/);
 assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_STD_DEV'],/الانحراف المعياري/);
 for(const formula of ['π (3.141…)','e (2.718…)','φ (1.618…)','sqrt(2) (1.414…)','sqrt(½) (0.707…)','∞']) assert.ok(locale['blockly-MATH_CONSTANT_TOOLTIP'].includes(formula));
 assert.equal(new Set(['EVEN','ODD','PRIME','WHOLE','POSITIVE','NEGATIVE'].map(k=>locale['blockly-MATH_IS_'+k])).size,6);
});
