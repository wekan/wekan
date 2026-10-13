'use strict';
const assert = require('node:assert/strict');
const english = require('../imports/i18n/data/en.i18n.json');
const reviewed = {
  "be": [
    "no"
  ],
  "ja-HI": [
    "or"
  ],
  "ja-JP": [
    "or"
  ],
  "sr": [
    "s3-bucket"
  ],
  "tr": [
    "s3-bucket"
  ],
  "bs": [
    "s3-bucket",
    "s3-region"
  ],
  "hr": [
    "s3-bucket",
    "s3-region"
  ],
  "sk": [
    "s3-bucket",
    "s3-endpoint"
  ],
  "cs": [
    "s3-bucket",
    "s3-endpoint",
    "s3-region"
  ],
  "cs-CZ": [
    "s3-bucket",
    "s3-endpoint",
    "s3-region"
  ],
  "hu": [
    "s3-bucket",
    "s3-endpoint"
  ],
  "el": [
    "s3-access-key",
    "s3-bucket",
    "s3-endpoint",
    "s3-port",
    "s3-region",
    "s3-secret-key"
  ],
  "el-GR": [
    "s3-access-key",
    "s3-bucket",
    "s3-endpoint",
    "s3-port",
    "s3-region",
    "s3-secret-key"
  ],
  "bi": [
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-LISTS_GET_SUBLIST_END_FROM_START"
  ],
  "eo": [
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-FIELD_BITMAP_PIXEL_ON"
  ],
  "hy": [
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-FIELD_BITMAP_PIXEL_ON"
  ],
  "pt_PT": [
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-FIELD_BITMAP_PIXEL_ON"
  ],
  "ca@valencia": [
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-FIELD_BITMAP_PIXEL_ON"
  ],
  "ca_ES": [
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-FIELD_BITMAP_PIXEL_ON"
  ],
  "es_CO": [
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-FIELD_BITMAP_PIXEL_ON"
  ],
  "tpi": [
    "dueCardsViewChange-choice-me",
    "of",
    "blockly-ANNOUNCE_MOVE_OF"
  ],
  "lb": [
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-LISTS_GET_SUBLIST_END_FROM_START",
    "blockly-PROCEDURES_DEFNORETURN_TITLE",
    "blockly-PROCEDURES_DEFRETURN_TITLE"
  ]
};

Object.assign(reviewed, {
  "bn": [
    "r-is",
    "r-of",
    "r-d-send-email-to",
    "of"
  ],
  "ne": [
    "r-is",
    "r-of",
    "r-d-send-email-to",
    "of"
  ],
  "hu": [
    "s3-bucket",
    "s3-endpoint",
    "r-of",
    "of"
  ],
  "is": [
    "r-sort-by",
    "r-is",
    "r-to",
    "r-of",
    "r-d-send-email-to",
    "r-by",
    "dueCardsViewChange-choice-me",
    "of"
  ],
  "sq": [
    "r-sort-by",
    "r-is",
    "r-to",
    "r-of",
    "r-d-send-email-to",
    "r-by",
    "dueCardsViewChange-choice-me",
    "of",
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-FIELD_BITMAP_PIXEL_ON"
  ],
  "tl": [
    "r-sort-by",
    "r-is",
    "r-to",
    "r-of",
    "r-d-send-email-to",
    "r-by",
    "dueCardsViewChange-choice-me",
    "of",
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-FIELD_BITMAP_PIXEL_ON",
    "blockly-PROCEDURES_DEFNORETURN_TITLE",
    "blockly-PROCEDURES_DEFRETURN_TITLE",
    "blockly-LISTS_GET_SUBLIST_END_FROM_START"
  ]
});

const blocklyShortLocales = ["ka", "km", "la", "tt", "jv", "kk", "tg", "sn", "km-KH", "km_KH"];
const blocklyShortKeys = ["blockly-ANNOUNCE_MOVE_OF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_IF_IF_TITLE_IF", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-CONTROLS_FOREACH_INPUT_DO", "blockly-CONTROLS_FOR_INPUT_DO", "blockly-CONTROLS_IF_MSG_THEN", "blockly-CONTROLS_WHILEUNTIL_INPUT_DO", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_SET_INDEX_INPUT_TO", "blockly-LOGIC_OPERATION_OR", "blockly-PROCEDURES_DEFNORETURN_TITLE", "blockly-PROCEDURES_DEFRETURN_TITLE"];
for (const locale of blocklyShortLocales) reviewed[locale] = blocklyShortKeys;

const additionalRuleKeys = {
  "jv": [
    "r-sort-by",
    "r-is",
    "r-to",
    "r-of",
    "r-d-send-email-to",
    "r-by",
    "dueCardsViewChange-choice-me",
    "of"
  ],
  "kk": [
    "r-sort-by",
    "r-is",
    "r-to",
    "r-of",
    "r-d-send-email-to",
    "r-by",
    "dueCardsViewChange-choice-me",
    "of"
  ],
  "tg": [
    "r-sort-by",
    "r-is",
    "r-to",
    "r-of",
    "r-d-send-email-to",
    "r-by",
    "dueCardsViewChange-choice-me",
    "of"
  ],
  "so": [
    "r-sort-by",
    "r-is",
    "r-to",
    "r-of",
    "r-d-send-email-to",
    "r-by",
    "dueCardsViewChange-choice-me",
    "of",
    "blockly-ANNOUNCE_MOVE_OF",
    "blockly-CONTROLS_IF_MSG_IF",
    "blockly-CONTROLS_REPEAT_INPUT_DO",
    "blockly-CONTROLS_FOREACH_INPUT_DO",
    "blockly-CONTROLS_FOR_INPUT_DO",
    "blockly-CONTROLS_IF_IF_TITLE_IF",
    "blockly-CONTROLS_IF_MSG_THEN",
    "blockly-CONTROLS_WHILEUNTIL_INPUT_DO"
  ]
};
for (const [locale, keys] of Object.entries(additionalRuleKeys)) reviewed[locale] = [...new Set([...(reviewed[locale] || []), ...keys])];

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  let count = 0;
  for (const [locale, keys] of Object.entries(reviewed)) {
    const strings = require(`../imports/i18n/data/${locale}.i18n.json`);
    for (const key of keys) {
      assert.ok(strings[key]?.trim(), `${locale}/${key}`);
      assert.notEqual(strings[key], english[key], `${locale}/${key} remains English`);
      assert.deepEqual(translationTokens(strings[key]), translationTokens(english[key]), `${locale}/${key} tokens`);
      if (key.startsWith('s3-')) assert.ok(strings[key].includes('S3'), `${locale}/${key} product name`);
      if (key === 'blockly-FIELD_BITMAP_PIXEL_ON') assert.notEqual(strings[key], strings['blockly-FIELD_BITMAP_PIXEL_OFF'], `${locale}: on differs from off`);
      count++;
    }
  }
  for (const locale of ['ja-HI', 'ja-JP']) assert.match(require(`../imports/i18n/data/${locale}.i18n.json`).or, /[ぁ-ゖ]/u);
  assert.match(require('../imports/i18n/data/be.i18n.json').no, /[А-Яа-я]/u);
  assert.equal(require('../imports/i18n/data/tl.i18n.json')['blockly-LISTS_GET_SUBLIST_END_FROM_START'], 'hanggang #');
  for (const locale of ['bn', 'ne', 'hu']) {
    const strings = require(`../imports/i18n/data/${locale}.i18n.json`);
    assert.equal(strings['r-of'], '/');
    assert.equal(strings.of, '/');
  }
  for (const locale of blocklyShortLocales) {
    const strings = require(`../imports/i18n/data/${locale}.i18n.json`);
    assert.equal(strings['blockly-CONTROLS_IF_MSG_IF'], strings['blockly-CONTROLS_IF_IF_TITLE_IF']);
    for (const alias of ['FOREACH_INPUT_DO', 'FOR_INPUT_DO', 'IF_MSG_THEN', 'WHILEUNTIL_INPUT_DO']) {
      assert.equal(strings[`blockly-CONTROLS_${alias}`], strings['blockly-CONTROLS_REPEAT_INPUT_DO']);
    }
    assert.equal(strings['blockly-PROCEDURES_DEFRETURN_TITLE'], strings['blockly-PROCEDURES_DEFNORETURN_TITLE']);
    assert.ok(strings['blockly-LISTS_GET_SUBLIST_END_FROM_START'].includes('#'));
  }
  const somali = require('../imports/i18n/data/so.i18n.json');
  assert.equal(somali['blockly-CONTROLS_IF_MSG_IF'], somali['blockly-CONTROLS_IF_IF_TITLE_IF']);
  assert.notEqual(somali['blockly-CONTROLS_IF_MSG_IF'], somali['blockly-CONTROLS_REPEAT_INPUT_DO']);
  for (const alias of ['FOREACH_INPUT_DO', 'FOR_INPUT_DO', 'IF_MSG_THEN', 'WHILEUNTIL_INPUT_DO']) assert.equal(somali[`blockly-CONTROLS_${alias}`], somali['blockly-CONTROLS_REPEAT_INPUT_DO']);
  assert.equal(require('../imports/i18n/data/kk.i18n.json')['r-of'], '/');
  // Shared words remain valid; this batch does not replace them to force zero.
  for (const locale of ['es', 'it', 'ca']) assert.equal(require(`../imports/i18n/data/${locale}.i18n.json`).no, 'No');
  for (const locale of ['nl', 'nl-NL']) assert.equal(require(`../imports/i18n/data/${locale}.i18n.json`)['r-is'], 'is');
  console.log(`shortLabelTranslationGaps: ${count} reviewed values in ${Object.keys(reviewed).length} locales; tokens, product names and shared words preserved`);
})().catch(error => { console.error(error); process.exitCode = 1; });
