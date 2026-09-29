#!/usr/bin/env node
/**
 * Fill the UNTRANSLATED strings (English placeholders) of a language file — WITHOUT any
 * external translation service, API or password. The translations are written by a human
 * or by the assistant (an LLM) using the language's existing translations and general
 * kanban terminology as the reference; this script only lists what is missing and safely
 * applies the provided translations. It can NEVER overwrite a human translation.
 *
 * Runs conceptually AFTER `merge-translations.mjs`, so by that point every language file
 * holds real human translations (value differs from the English source) plus English
 * placeholders for strings untranslated everywhere (value === the English source, or the
 * key is missing). A string "counts" as translatable here ONLY when it is such a
 * placeholder, so a human translation (value !== English) is never selected and never
 * overwritten. Filled strings stay LOCAL — the pull/merge workflow never pushes
 * translations to Transifex.
 *
 * Usage (run from the repo root):
 *   node releases/translations/fill-translations.mjs --list <lang> [--limit N]
 *       Print, as JSON { key: englishSource, … }, the placeholder strings of <lang> that
 *       still need a translation. Feed this to the translator (LLM/human), then apply the
 *       result with --apply. --limit caps the count for a resumable, chunked workflow.
 *
 *   node releases/translations/fill-translations.mjs --apply <lang> <translations.json>
 *       Read { key: translation, … } from the file and write each into <lang> ONLY where
 *       the key is still a placeholder (value === English source, or missing). A key whose
 *       current value already differs from English (a human translation) is SKIPPED and
 *       reported, so a fill can never clobber a human translation. A translation equal to
 *       the English source, empty, or not a non-empty string is ignored. Preserves the
 *       en.i18n.json key ORDER and the repo's 2-space indent + trailing newline.
 *
 *   node releases/translations/fill-translations.mjs --missing
 *       Print a per-language count of placeholder strings still needing translation
 *       (English + en-* variants are skipped — they are English by design). No writes.
 *
 *   node releases/translations/fill-translations.mjs --status
 *       Where the backlog actually is. Splits the count two ways — strings that HAVE a
 *       translation to give against product names, numbers, symbols and bare
 *       `__placeholders__` that never will, and languages written in a non-Latin script
 *       (where an English string is a foreign alphabet mid-sentence) against Latin-script
 *       ones — then ranks the remaining keys by how many files share each. That ranking
 *       is the work order: one key missing in fifty files is one table, not fifty visits.
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'imports/i18n/data';
const EN_FILE = path.join(DATA_DIR, 'en.i18n.json');
const readJson = p => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

const en = readJson(EN_FILE);
if (!en) { console.error(`[fill] cannot read ${EN_FILE}`); process.exit(1); }

/*
 * Write the whole string to stdout before returning, whatever stdout is.
 *
 * fs.writeSync can return a short count on a pipe, so it is looped; EAGAIN is
 * possible when the reader is slow, and is retried rather than dropped. This is
 * the only way to be sure a large payload survives `--list | something`.
 */
function writeAllSync(text) {
  const buf = Buffer.from(text, 'utf8');
  let off = 0;
  while (off < buf.length) {
    try {
      off += fs.writeSync(1, buf, off, buf.length - off);
    } catch (error) {
      if (error.code === 'EAGAIN') continue;   // pipe full; the reader will catch up
      throw error;
    }
  }
}
const enKeys = Object.keys(en);

// A placeholder = key missing, or value equal to the English source.
const isPlaceholder = (j, k) =>
  typeof en[k] === 'string' && (typeof j[k] !== 'string' || j[k] === en[k]);

// English and its regional variants are English by design — never "missing".
const isEnglishVariant = code => /^en([_-].*)?$/.test(code) || code === 'en';

// A loanword can be the correct translation in one locale while another locale
// needs a different word. Keep those exceptions per locale; putting them in the
// source-wide list would hide real work in every language.
const LOCALE_INVARIANTS = {
  // Russian retains printed keyboard legends, product names and math notation.
  ru: new Set([
    'blockly-ALT_KEY', 'blockly-BACKSPACE_KEY', 'blockly-CAPS_LOCK_KEY',
    'blockly-CHROME_OS', 'blockly-COMMAND_KEY', 'blockly-CONTROL_KEY',
    'blockly-END_KEY', 'blockly-ENTER_KEY', 'blockly-ESCAPE', 'blockly-HOME_KEY',
    'blockly-INSERT_KEY', 'blockly-LINUX', 'blockly-MAC_OS',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN',
    'blockly-OPTION_KEY', 'blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY',
    'blockly-PAUSE_KEY', 'blockly-SHIFT_KEY', 'blockly-TAB_KEY', 'blockly-WINDOWS',
  ]),
  // Ukrainian keeps printed keyboard legends, product names and math notation.
  uk: new Set([
    'blockly-ALT_KEY', 'blockly-BACKSPACE_KEY', 'blockly-CAPS_LOCK_KEY',
    'blockly-CHROME_OS', 'blockly-COMMAND_KEY', 'blockly-END_KEY',
    'blockly-ENTER_KEY', 'blockly-ESCAPE', 'blockly-HOME_KEY',
    'blockly-INSERT_KEY', 'blockly-LINUX', 'blockly-MAC_OS',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN',
    'blockly-OPTION_KEY', 'blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY',
    'blockly-PAUSE_KEY', 'blockly-SHIFT_KEY', 'blockly-TAB_KEY', 'blockly-WINDOWS',
  ]),
  // Hungarian shared mathematical/Scrum terms and keyboard/product names.
  hu: new Set([
    'blockly-ALT_KEY', 'blockly-BACKSPACE_KEY', 'blockly-CAPS_LOCK_KEY',
    'blockly-CHROME_OS', 'blockly-COMMAND_KEY', 'blockly-END_KEY',
    'blockly-ENTER_KEY', 'blockly-ESCAPE', 'blockly-HOME_KEY',
    'blockly-INPUT_LABEL_NUMBER_MAX', 'blockly-INPUT_LABEL_NUMBER_MIN',
    'blockly-INSERT_KEY', 'blockly-LINUX', 'blockly-LOGIC_NULL', 'blockly-MAC_OS',
    'blockly-MATH_ONLIST_OPERATOR_MAX_ARIA', 'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN',
    'blockly-OPTION_KEY', 'blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY',
    'blockly-PAUSE_KEY', 'blockly-SHIFT_KEY', 'blockly-TAB_KEY', 'blockly-WINDOWS',
    'scrum-master', 'scrum-sprint',
  ]),
  // Slovak shared words, mathematical terms and printed keyboard/product names.
  sk: new Set([
    'text', 'blockly-ALT_KEY', 'blockly-BACKSPACE_KEY', 'blockly-CAPS_LOCK_KEY',
    'blockly-CHROME_OS', 'blockly-END_KEY', 'blockly-ENTER_KEY', 'blockly-HOME_KEY',
    'blockly-INPUT_LABEL_NUMBER_MAX', 'blockly-INPUT_LABEL_NUMBER_MIN',
    'blockly-INSERT_KEY', 'blockly-LINUX', 'blockly-MAC_OS',
    'blockly-MATH_ADDITION_SYMBOL_ARIA', 'blockly-MATH_ONLIST_OPERATOR_MAX_ARIA',
    'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA', 'blockly-PAGE_DOWN_KEY',
    'blockly-PAGE_UP_KEY', 'blockly-PAUSE_KEY', 'blockly-SHIFT_KEY',
    'blockly-TAB_KEY', 'blockly-WINDOWS', 'scrum-master',
  ]),
  // Czech shared mathematical terms, Scrum role and printed keyboard legends.
  cs: new Set([
    'blockly-ALT_KEY', 'blockly-BACKSPACE_KEY', 'blockly-CAPS_LOCK_KEY',
    'blockly-CHROME_OS', 'blockly-CONTEXT_MENU_KEY', 'blockly-END_KEY',
    'blockly-ENTER_KEY', 'blockly-ESCAPE', 'blockly-HOME_KEY',
    'blockly-INPUT_LABEL_NUMBER_MAX', 'blockly-INPUT_LABEL_NUMBER_MIN',
    'blockly-INSERT_KEY', 'blockly-LINUX', 'blockly-MAC_OS',
    'blockly-MATH_ADDITION_SYMBOL_ARIA', 'blockly-MATH_ONLIST_OPERATOR_MAX_ARIA',
    'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA', 'blockly-MATH_SUBTRACTION_SYMBOL_ARIA',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN',
    'blockly-MATH_TRIG_TAN', 'blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY',
    'blockly-PAUSE_KEY', 'blockly-SHIFT_KEY', 'blockly-TAB_KEY', 'blockly-WINDOWS',
    'scrum-master', 'scrum-sprint',
  ]),
  // Polish mathematical terms, Scrum role and keyboard/product names.
  pl: new Set([
    'blockly-ALT_KEY', 'blockly-BACKSPACE_KEY', 'blockly-CAPS_LOCK_KEY',
    'blockly-CHROME_OS', 'blockly-CONTEXT_MENU_KEY', 'blockly-END_KEY',
    'blockly-ENTER_KEY', 'blockly-ESCAPE', 'blockly-HOME_KEY',
    'blockly-INPUT_LABEL_NUMBER_MIN', 'blockly-INSERT_KEY', 'blockly-LINUX',
    'blockly-MAC_OS', 'blockly-MATH_ADDITION_SYMBOL_ARIA',
    'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA', 'blockly-MATH_SUBTRACTION_SYMBOL_ARIA',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-PAGE_DOWN_KEY',
    'blockly-PAGE_UP_KEY', 'blockly-PAUSE_KEY', 'blockly-SHIFT_KEY',
    'blockly-TAB_KEY', 'blockly-WINDOWS', 'scrum-master', 'scrum-sprint',
  ]),
  // Indonesian shared mathematical vocabulary and unchanged keyboard/product names.
  id: new Set([
    'blockly-ALT_KEY', 'blockly-BACKSPACE_KEY', 'blockly-CAPS_LOCK_KEY',
    'blockly-CHROME_OS', 'blockly-CONTEXT_MENU_KEY', 'blockly-ENTER_KEY',
    'blockly-INPUT_LABEL_NUMBER_MIN', 'blockly-LINUX', 'blockly-LOGIC_NULL',
    'blockly-MAC_OS', 'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN',
    'blockly-SHIFT_KEY', 'blockly-TAB_KEY', 'blockly-WINDOWS', 'scrum-sprint',
  ]),
  // Dutch shares these mathematical labels (including "is even") and Scrum
  // terms; product names and printed keyboard legends stay recognizable.
  ...Object.fromEntries(['nl', 'nl-NL'].map(code => [code, new Set([
    'blockly-ALT_KEY', 'blockly-BACKSPACE_KEY', 'blockly-BLOCK_LABEL_BEGIN_PREFIX',
    'blockly-CAPS_LOCK_KEY', 'blockly-CHROME_OS', 'blockly-COMMAND_KEY',
    'blockly-CONTEXT_MENU_KEY', 'blockly-ENTER_KEY', 'blockly-HOME_KEY',
    'blockly-INPUT_LABEL_NUMBER_MAX', 'blockly-INPUT_LABEL_NUMBER_MIN',
    'blockly-LINUX', 'blockly-LOGIC_TERNARY_CONDITION', 'blockly-MAC_OS',
    'blockly-MATH_ADDITION_SYMBOL_ARIA', 'blockly-MATH_IS_EVEN',
    'blockly-MATH_ONLIST_OPERATOR_MAX_ARIA', 'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_COS',
    'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN', 'blockly-OPTION_KEY',
    'blockly-SHIFT_KEY', 'blockly-TAB_KEY', 'blockly-WINDOWS',
    'board-view-sprints', 'scrum-sprints', 'scrum-sprint',
  ])])),
  // Bokmål shared mathematics and Scrum labels, plus product/keyboard names.
  nb: new Set([
    'blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-COMMAND_KEY',
    'blockly-ENTER_KEY', 'blockly-INPUT_LABEL_MATH_DIVIDEND',
    'blockly-INPUT_LABEL_MATH_DIVISOR', 'blockly-INPUT_LABEL_NUMBER_MIN',
    'blockly-LINUX', 'blockly-LOGIC_NULL', 'blockly-LOGIC_TERNARY_CONDITION',
    'blockly-MAC_OS', 'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA',
    'blockly-MATH_SUBTRACTION_SYMBOL_ARIA', 'blockly-MATH_TRIG_ACOS',
    'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN', 'blockly-MATH_TRIG_COS',
    'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN', 'blockly-OPTION_KEY',
    'blockly-PAUSE_KEY', 'blockly-WINDOWS', 'scrum-sprint', 'scrum-start-sprint',
  ]),
  // Danish mathematical vocabulary and Scrum labels shared with English,
  // alongside unchanged product names and keyboard legends.
  da: new Set([
    'color-orange', 'computer', 'export-card-attachment-type', 'team',
    'type', 'Database', 'layout', 'teams', 'links-heading', 'stats-scope',
    'support', 'supportPopup-title', 'start', 'stop', 'log',
    'blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-CONTEXT_MENU_KEY',
    'blockly-ENTER_KEY', 'blockly-INPUT_LABEL_MATH_DIVIDEND',
    'blockly-INPUT_LABEL_MATH_DIVISOR', 'blockly-INPUT_LABEL_NUMBER_MIN',
    'blockly-LINUX', 'blockly-LOGIC_NULL', 'blockly-LOGIC_TERNARY_CONDITION',
    'blockly-MAC_OS', 'blockly-MATH_ADDITION_SYMBOL_ARIA',
    'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA', 'blockly-MATH_SUBTRACTION_SYMBOL_ARIA',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN',
    'blockly-PAUSE_KEY', 'blockly-WINDOWS', 'scrum-sprint', 'scrum-start-sprint',
  ]),
  // Swedish shared mathematical vocabulary, keyboard labels and product names.
  sv: new Set([
    'blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-ENTER_KEY',
    'blockly-INPUT_LABEL_NUMBER_MAX', 'blockly-INPUT_LABEL_NUMBER_MIN',
    'blockly-LINUX', 'blockly-LOGIC_NULL', 'blockly-LOGIC_TERNARY_CONDITION',
    'blockly-MAC_OS', 'blockly-MATH_ADDITION_SYMBOL_ARIA',
    'blockly-MATH_ONLIST_OPERATOR_MAX_ARIA', 'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA',
    'blockly-MATH_SUBTRACTION_SYMBOL_ARIA', 'blockly-MATH_TRIG_COS',
    'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN', 'blockly-WINDOWS',
    'scrum-sprint',
  ]),
  // Locale-specific shared vocabulary, not exemptions for English prose.
  // German shared labels, Scrum terms, product names and mathematical notation.
  ...Object.fromEntries(['de', 'de-AT', 'de-CH', 'de_DE'].map(code =>
    [code, new Set([
      'blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-FIELD_LABEL_OPTION_INDEX',
      'blockly-FIELD_LABEL_VARIABLE', 'blockly-LINUX', 'blockly-LOGIC_NULL',
      'blockly-MAC_OS', 'blockly-MATH_ADDITION_SYMBOL_ARIA',
      'blockly-MATH_SUBTRACTION_SYMBOL_ARIA', 'blockly-MATH_TRIG_ACOS',
      'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN', 'blockly-MATH_TRIG_COS',
      'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN', 'blockly-OPTION_KEY',
      'blockly-PAUSE_KEY', 'blockly-WINDOWS', 'board-view-sprints',
      'scrum-sprints', 'scrum-sprint',
    ])])),
  // French shares these short labels with English; symbols and product names
  // retain their conventional spelling. No descriptive prose is exempted.
  ...Object.fromEntries(['fr', 'fr-FR', 'fr-BE', 'fr-CH', 'fr-CA'].map(code =>
    [code, new Set([
      'blockly-ALT_KEY', 'blockly-ARIA_TYPE_FIELD_ANGLE', 'blockly-ARIA_TYPE_FIELD_DATE',
      'blockly-ARIA_TYPE_FIELD_IMAGE', 'blockly-CHROME_OS', 'blockly-CONTEXT_MENU_KEY',
      'blockly-FIELD_LABEL_OPTION_INDEX', 'blockly-FIELD_LABEL_VARIABLE',
      'blockly-INPUT_LABEL_CONDITION', 'blockly-INPUT_LABEL_NUMBER_MAX',
      'blockly-INPUT_LABEL_NUMBER_MIN', 'blockly-LINUX', 'blockly-LOGIC_TERNARY_CONDITION',
      'blockly-MAC_OS', 'blockly-MATH_ADDITION_SYMBOL_ARIA',
      'blockly-MATH_ONLIST_OPERATOR_MAX_ARIA', 'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA',
      'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
      'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN',
      'blockly-PAUSE_KEY', 'blockly-WINDOWS', 'board-view-sprints',
      'scrum-sprints', 'scrum-sprint',
    ])])),
  // Simplified Chinese keyboard legends and product names.
  ...Object.fromEntries(['zh', 'zh-CN', 'zh-Hans', 'zh-GB', 'zh_SG', 'cmn']
    .map(code => [code, new Set([
      'blockly-ALT_KEY', 'blockly-CAPS_LOCK_KEY', 'blockly-CHROME_OS',
      'blockly-END_KEY', 'blockly-ENTER_KEY', 'blockly-HOME_KEY',
      'blockly-INSERT_KEY', 'blockly-LINUX', 'blockly-MAC_OS',
      'blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY', 'blockly-SHIFT_KEY',
      'blockly-TAB_KEY', 'blockly-WINDOWS',
    ])])),
  // Traditional Chinese retains the printed keyboard legends and OS names.
  ...Object.fromEntries(['zh-Hant', 'zh-TW', 'zh-HK'].map(code => [code, new Set([
    'blockly-ALT_KEY', 'blockly-BACKSPACE_KEY', 'blockly-CAPS_LOCK_KEY',
    'blockly-CHROME_OS', 'blockly-END_KEY', 'blockly-ENTER_KEY',
    'blockly-INSERT_KEY', 'blockly-LINUX', 'blockly-MAC_OS',
    'blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY', 'blockly-SHIFT_KEY',
    'blockly-TAB_KEY', 'blockly-WINDOWS',
    ...(code === 'zh-Hant' ? [] : ['blockly-HOME_KEY']),
  ])])),
  // Japanese keyboard legends, product names, null and mathematical symbols.
  ...Object.fromEntries(['ja', 'ja-JP', 'ja-HI'].map(code => [code, new Set([
    'blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-COMMAND_KEY',
    'blockly-END_KEY', 'blockly-ENTER_KEY', 'blockly-LINUX', 'blockly-LOGIC_NULL',
    'blockly-MAC_OS', 'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN',
    'blockly-MATH_TRIG_ATAN', 'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN',
    'blockly-MATH_TRIG_TAN', 'blockly-OPTION_KEY', 'blockly-WINDOWS',
  ])])),
  // Korean keyboard legends, product name and mathematical function symbols.
  ...Object.fromEntries(['ko', 'ko-KR'].map(code => [code, new Set([
    'blockly-ALT_KEY', 'blockly-CAPS_LOCK_KEY', 'blockly-END_KEY',
    'blockly-HOME_KEY', 'blockly-INSERT_KEY', 'blockly-MAC_OS',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN',
    'blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY',
  ])])),
  // Portuguese menu/math vocabulary, keyboard legends and Scrum terminology.
  ...Object.fromEntries(['pt', 'pt-PT', 'pt_PT', 'pt-BR'].map(code => [code, new Set([
    'blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-CONTEXT_MENU_KEY',
    'blockly-ENTER_KEY', 'blockly-INPUT_LABEL_MATH_DIVISOR', 'blockly-LINUX',
    'blockly-MAC_OS', 'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN',
    'blockly-MATH_TRIG_ATAN', 'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN',
    'blockly-MATH_TRIG_TAN', 'blockly-WINDOWS', 'board-view-sprints',
    'scrum-sprints', 'scrum-sprint',
    ...(code === 'pt-PT' ? ['blockly-VARIABLES_DEFAULT_NAME',
      'blockly-LISTS_CREATE_WITH_ITEM_TITLE', 'blockly-MATH_CHANGE_TITLE_ITEM',
      'blockly-TEXT_APPEND_VARIABLE', 'blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM'] : []),
  ])])),
  // Italian keyboard legends, menu label, products and mathematical symbols.
  it: new Set(['blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-COMMAND_KEY',
    'blockly-CONTEXT_MENU_KEY', 'blockly-CONTROL_KEY', 'blockly-LINUX',
    'blockly-MAC_OS', 'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_TAN',
    'blockly-WINDOWS', 'scrum-sprint']),
  // Spanish shares color/divisor/general with English. Product names,
  // keyboard legends and mathematical function symbols also stay unchanged.
  ...Object.fromEntries(['es', 'es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX',
    'es-PE', 'es-PY', 'es_CO'].map(code => [code, new Set([
    'blockly-ALT_KEY', 'blockly-ARIA_TYPE_FIELD_COLOUR', 'blockly-CHROME_OS',
    'blockly-INPUT_LABEL_MATH_DIVISOR', 'blockly-LINUX', 'blockly-MAC_OS',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN',
    'blockly-SHORTCUTS_GENERAL', 'blockly-WINDOWS',
  ])])),
  // Turkish keyboard legends/product names and the established Scrum term.
  tr: new Set(['blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-ENTER_KEY',
    'blockly-ESCAPE', 'blockly-LINUX', 'blockly-MAC_OS', 'blockly-SHIFT_KEY',
    'blockly-TAB_KEY', 'blockly-WINDOWS', 'scrum-sprint']),
  // Finnish retains these product names, keyboard labels and math symbols.
  fi: new Set(['blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-LINUX',
    'blockly-MAC_OS', 'blockly-WINDOWS', 'blockly-MATH_TRIG_ACOS',
    'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN']),
  // Inverse-trigonometry notation in the Arabic Blockly menus.
  ar: new Set(['blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN']),
  'ar-DZ': new Set(['blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN']),
  'ar-EG': new Set(['blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN']),
  // Romanian shared words, mathematical notation and printed keyboard names.
  ...Object.fromEntries(['ro', 'ro-RO'].map(code => [code, new Set([
    'card', 'blockly-ALT_KEY', 'blockly-BLOCK_LABEL_CONTAINER',
    'blockly-CHROME_OS', 'blockly-ENTER_KEY', 'blockly-LINUX',
    'blockly-LISTS_SORT_TYPE_NUMERIC', 'blockly-LOGIC_TERNARY_CONDITION',
    'blockly-MAC_OS', 'blockly-MATH_ADDITION_SYMBOL_ARIA',
    'blockly-MATH_SUBTRACTION_SYMBOL_ARIA', 'blockly-MATH_TRIG_COS',
    'blockly-MATH_TRIG_SIN', 'blockly-SHIFT_KEY', 'blockly-SHORTCUTS_GENERAL',
    'blockly-TAB_KEY', 'blockly-WINDOWS', 'scrum-sprint',
  ])])),
  rup: new Set(['color-indigo', 'color-magenta']),
  lld: new Set(['move-progress-file']),
  nap: new Set(['move-progress-file']),
  // Galician shared vocabulary, product names and mathematical notation.
  ...Object.fromEntries(['gl', 'gl-ES'].map(code => [code, new Set([
    ...(code === 'gl' ? ['predicate-selector'] : []),
    'blockly-ALT_KEY', 'blockly-CHROME_OS', 'blockly-CONTROL_KEY',
    'blockly-INPUT_LABEL_MATH_DIVISOR', 'blockly-LINUX', 'blockly-MAC_OS',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_TAN', 'blockly-WINDOWS',
  ])])),
  bs: new Set(['server']),
  // Native MediaWiki vep.json: view-pool-error and api-clientside-error-http
  // use the nominative server. This is Veps, not the legacy Venda ve locale.
  've-PP': new Set(['server']),
  // Generalitat Valenciana's Valencian technical help uses errors.
  // Same spelling as English does not make a native plural untranslated.
  'ca@valencia': new Set(['errors']),
  sq: new Set(['color-indigo', 'color-magenta', 'email', 'normal', 'private']),
  // These are reviewed search-parser keywords, not untranslated display prose.
  // Keep the exception per zgh key so English sentences remain fillable.
  zgh: new Set(['operator-assignee', 'operator-due', 'operator-modified',
    'operator-has', 'operator-debug', 'predicate-quarter', 'predicate-due',
    'predicate-modified', 'predicate-assignee', 'predicate-selector']),
  // Shared technical and Romance words reviewed against the Occitan catalogs.
  oc: new Set(['allboards.workspace-color', 'pomodoro', 'oauth-provider-secret',
    'predicate-selector', 'dependency-color', 'errors', 'error']),
  br: new Set(['pomodoro']),
  wo: new Set(['pomodoro']),
  wa: new Set(['pomodoro']),
};

// Exact reviewed shared terms must not be offered for machine filling again.
// Matching a key alone is insufficient: require the reviewed value to equal
// the current English source. Ordinary translated prose is never exempted.
const reviewedSourceTerms = new Set((readJson(
  'releases/translations/audited-reviews.json',
) || []).filter(row => row.value === en[row.key])
  .map(row => `${row.locale}:${row.key}`));

// Values that intentionally stay identical in every language are complete, not
// placeholders that a translator can or should change. Keep this exact: a
// sentence containing an application placeholder is still translatable.
const isInvariantSource = value => {
  if (!/\p{Letter}/u.test(value)) return true;
  if (value.replace(/[^\p{Letter}]/gu, '').length < 3) return true;
  const withoutPlaceholders = value.replace(/__[a-zA-Z0-9_-]+__/g, '');
  if (!/\p{Letter}/u.test(withoutPlaceholders)) return true;
  if (/^(?:YYYY-MM-DD|DD-MM-YYYY|MM-DD-YYYY)$/.test(value)) return true;
  if (/^https?:\/\/\S+$/.test(value)) return true; // example/placeholder URLs stay identical in every locale
  return /^(Meteor|Node|MongoDB.*|OAuth2|LDAP|CAS|GridFS|Arial|Gantt|Frappe Gantt|DHTMLX Gantt|S3.*|CollectionFS|Google Cloud Storage\.?|Azure Blob.*|Meteor-Files|Microsoft Azure Blob Storage\.?|MongoDB Compact|Bytes|URL|Logo|Cron|OS|Platform|USA|Asia|OK|Planning Poker|API|Bigboard|Google|GitHub|Facebook|X \(Twitter\)|Meteor Developer|Weibo|Meetup)$/.test(value);
};
// Keys added in English on purpose while they wait for Transifex
// (pending-transifex.json, written by add-pending-keys.mjs). A locale value
// still equal to the English source is not counted as missing for them; the
// count is reported separately so they are not forgotten. A translated value
// always replaces the English one, so this never protects English over a
// translation.
const pendingTransifex = new Set(((readJson('releases/translations/pending-transifex.json') || {}).keys || [])
  .filter(row => row && typeof row.key === 'string' && row.key in en)
  .map(row => row.key));

const isInvariantForLocale = (code, key) =>
  isInvariantSource(en[key]) || Boolean(LOCALE_INVARIANTS[code]?.has(key)) || reviewedSourceTerms.has(`${code}:${key}`);

function langFile(code) { return path.join(DATA_DIR, `${code}.i18n.json`); }

function writeOrdered(p, j) {
  const ordered = {};
  for (const k of enKeys) if (typeof j[k] === 'string') ordered[k] = j[k];
  for (const k of Object.keys(j)) if (!(k in ordered)) ordered[k] = j[k]; // keep any extras
  fs.writeFileSync(p, JSON.stringify(ordered, null, 2) + '\n');
}

const args = process.argv.slice(2);
const mode = args[0];

if (mode === '--missing') {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.i18n.json') && f !== 'en.i18n.json');
  const rows = [];
  for (const f of files) {
    const code = path.basename(f, '.i18n.json');
    if (isEnglishVariant(code)) continue;
    const j = readJson(path.join(DATA_DIR, f)) || {};
    const miss = enKeys.filter(k => isPlaceholder(j, k) && !isInvariantForLocale(code, k)
      && !pendingTransifex.has(k)).length;
    if (miss) rows.push([code, miss]);
  }
  rows.sort((a, b) => a[1] - b[1]);
  for (const [code, miss] of rows) console.log(`${miss}\t${code}`);
  console.error(`[fill] ${rows.length} language(s) still have untranslated strings.`);
  if (pendingTransifex.size) {
    console.error(`[fill] ${pendingTransifex.size} key(s) are English on purpose, pending Transifex (pending-transifex.json).`);
  }
  process.exit(0);
}

if (mode === '--list') {
  const code = args[1];
  if (!code) { console.error('[fill] --list needs a <lang>'); process.exit(1); }
  const limIdx = args.indexOf('--limit');
  const limit = limIdx !== -1 ? parseInt(args[limIdx + 1], 10) || 0 : 0;
  const j = readJson(langFile(code)) || {};
  let keys = enKeys.filter(k => isPlaceholder(j, k) && !isInvariantForLocale(code, k));
  if (limit > 0) keys = keys.slice(0, limit);
  const out = {};
  for (const k of keys) out[k] = en[k];
  // writeSync, not console.log, and NO process.exit after it.
  //
  // When stdout is a FILE, Node writes synchronously and everything lands. When
  // it is a PIPE - which is what `| jq`, `$(...)`, and every spawn from a script
  // or a test gives you - the write is asynchronous, and `process.exit()` cuts
  // it off wherever it has got to. This dump is 128 KB for a language with
  // nothing translated, and a pipe delivered 65,510 bytes of it: valid-looking
  // JSON that simply stops in the middle of a key, with exit status 0.
  //
  // Anyone redirecting to a file saw the whole thing and anyone piping it lost
  // more than half, which is the worst shape a bug like this can take.
  writeAllSync(JSON.stringify(out, null, 2) + '\n');
  console.error(`[fill] ${code}: ${keys.length} placeholder(s) to translate.`);
  // Safe again now: writeAllSync has already put every byte on the descriptor,
  // so there is nothing left for exit to cut off.
  process.exit(0);
}

if (mode === '--apply') {
  const code = args[1];
  const file = args[2];
  if (!code || !file) { console.error('[fill] --apply needs <lang> <translations.json>'); process.exit(1); }
  const j = readJson(langFile(code));
  if (!j) { console.error(`[fill] cannot read ${langFile(code)}`); process.exit(1); }
  const t = readJson(file);
  if (!t) { console.error(`[fill] cannot read ${file}`); process.exit(1); }
  let filled = 0, skippedHuman = 0, ignored = 0;
  for (const [k, v] of Object.entries(t)) {
    if (!(k in en)) { ignored++; continue; }              // not a real key
    if (typeof v !== 'string' || !v.trim() || v === en[k]) { ignored++; continue; }
    if (!isPlaceholder(j, k) || isInvariantForLocale(code, k)) { skippedHuman++; continue; } // never overwrite a human translation
    j[k] = v; filled++;
  }
  writeOrdered(langFile(code), j);
  console.error(`[fill] ${code}: filled ${filled}, skipped ${skippedHuman} existing human translation(s), ignored ${ignored}.`);
  process.exit(0);
}

if (mode === '--status') {
  // A flat count of "strings still equal to the English source" is several times
  // the size of the actual backlog, and it says nothing about where the work is.
  // Two distinctions make it useful, and both are cheap to compute:
  //
  //   1. WHAT the string is. A product name, a bare number, a symbol or a bare
  //      `__placeholder__` has no translation to give; it equals the English
  //      source because that IS the translation, and it will never stop
  //      counting.
  //   2. WHICH SCRIPT the language is written in. In a Latin-script language an
  //      untranslated "Status" reads as a word; in a Greek, Arabic, Thai or
  //      Devanagari interface it is a different alphabet mid-sentence.
  const NONLATIN = /[Ͱ-᳿Ⲁ-퟿]/;
  const bucket = {
    'non-Latin, near-complete': [0, 0, 0],
    'Latin, near-complete': [0, 0, 0],
    'second tier (over 400 missing)': [0, 0, 0],
  };
  const perKey = {};
  for (const f of fs.readdirSync(DATA_DIR)) {
    if (!f.endsWith('.i18n.json')) continue;
    const code = path.basename(f, '.i18n.json');
    if (isEnglishVariant(code)) continue;
    const j = readJson(path.join(DATA_DIR, f)) || {};
    const miss = enKeys.filter(k => isPlaceholder(j, k));
    const sample = [j.board, j.card, j.list, j.save, j.settings].filter(Boolean).join('');
    const name = miss.length >= 400 ? 'second tier (over 400 missing)'
      : NONLATIN.test(sample) ? 'non-Latin, near-complete' : 'Latin, near-complete';
    const b = bucket[name];
    b[0]++;
    for (const k of miss) {
      if (isInvariantForLocale(code, k)) { b[2]++; continue; }
      b[1]++;
      if (name !== 'second tier (over 400 missing)') perKey[k] = (perKey[k] || 0) + 1;
    }
  }
  for (const [name, [files, real, junk]] of Object.entries(bucket)) {
    console.log(`${String(files).padStart(4)} files  ${String(real).padStart(7)} to translate  ` +
      `${String(junk).padStart(7)} nothing to translate  ${name}`);
  }
  const rows = Object.entries(perKey).sort((a, b) => b[1] - a[1]).slice(0, 20);
  if (rows.length) {
    console.log('\nnear-complete files, by key — one key is one table, not one visit per file:');
    for (const [k, n] of rows) {
      console.log(`${String(n).padStart(4)}  ${k}  ${JSON.stringify(en[k]).slice(0, 56)}`);
    }
  }
  process.exit(0);
}

console.error('Usage: fill-translations.mjs --status | --missing | --list <lang> [--limit N] | --apply <lang> <file.json>');
process.exit(1);
