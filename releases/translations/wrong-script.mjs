// Find, and replace, values written in a script that is not the language's own.
//
// This is a different fault from an untranslated string, and a worse one. An
// untranslated string shows English: the reader sees it is unfinished and a
// speaker can fix it, and `--missing` counts it. A value in the WRONG language
// shows confident text the reader may not be able to read at all, nothing
// counts it, and the merge rules protect it forever because it is not equal to
// the English source. `ta` held 1,174 Telugu values, `hi` 1,201 Gujarati ones,
// `ka` 789 Russian ones and `ko` 354 Japanese ones - each file MIXED, some keys
// right and some not, so no whole-file revert could tell them apart.
//
// Usage:
//   node releases/translations/wrong-script.mjs --list <lang>            keys + English source
//   node releases/translations/wrong-script.mjs --count [<lang> ...]     how many, per language
//   node releases/translations/wrong-script.mjs --apply <lang> <file>    write translations
//
// --apply OVERWRITES the named keys, which --apply in fill-translations.mjs
// deliberately will not do (it only ever fills English placeholders). That is
// exactly why this is a separate tool: replacing a wrong-language value is the
// one case where overwriting a non-English value is right, and it is limited to
// keys this scan flagged.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';

const DIR = 'imports/i18n/data/';

// The script each language is written in. Only languages with a non-Latin
// script can be checked this way: a Latin-script language borrowing a word from
// another Latin-script language is ordinary, not a fault.
const SCRIPT_OF = {
  am: 'ethiopic', as: 'bengali', bn: 'bengali', bo: 'tibetan', dz: 'tibetan',
  bho: 'devanagari', mai: 'devanagari', kok: 'devanagari', hi: 'devanagari',
  mr: 'devanagari', ne: 'devanagari', 'gu-IN': 'gujarati', pa: 'gurmukhi',
  or_IN: 'odia', kn: 'kannada', ml: 'malayalam', si: 'sinhala', ta: 'tamil',
  'te-IN': 'telugu', th: 'thai', my: 'myanmar', km: 'khmer', ka: 'georgian',
  hy: 'armenian', el: 'greek', he: 'hebrew', yi: 'hebrew', ja: 'kana',
  ko: 'hangul', chr: 'cherokee', iu: 'syllabics', ti: 'ethiopic', tig: 'ethiopic',
  ru: 'cyrillic', uk: 'cyrillic', bg: 'cyrillic', sr: 'cyrillic', mk: 'cyrillic',
  be: 'cyrillic', ar: 'arabic', fa: 'arabic', ur: 'arabic', ps: 'arabic',
  sd: 'arabic', ug: 'arabic', ckb: 'arabic', ks: 'arabic', ary: 'arabic',
  // Turkic and Mongolic languages written in Cyrillic, and Tajik.
  ba: 'cyrillic', bua: 'cyrillic', cv: 'cyrillic', kk: 'cyrillic',
  ky: 'cyrillic', mn: 'cyrillic', sah: 'cyrillic', tg: 'cyrillic',
  tt: 'cyrillic',
  // Chinese, in every tag it ships under.
  zh: 'cjk', cmn: 'cjk', 'wuu-Hans': 'cjk', yue_CN: 'cjk',
};

// A REGIONAL VARIANT is written in the same script as its base language, and
// listing only the bases hid two files for a whole release: `hi-IN` held
// Gujarati and `ko-KR` held Japanese while `hi` and `ko` were already clean, so
// the count said zero and meant "zero of the tags I happened to name". Every
// file whose tag reduces to a known base is checked under that base's script.
for (const file of readdirSync(DIR)) {
  if (!file.endsWith('.i18n.json')) continue;
  const lang = file.replace('.i18n.json', '');
  if (SCRIPT_OF[lang]) continue;
  const base = lang.split(/[-_@]/)[0];
  if (SCRIPT_OF[base]) SCRIPT_OF[lang] = SCRIPT_OF[base];
}

const RANGES = {
  devanagari: /[ऀ-ॣ०-ॿ]/, gujarati: /[઀-૿]/,
  gurmukhi: /[਀-੿]/, odia: /[଀-୿]/, bengali: /[ঀ-৿]/,
  tamil: /[஀-௿]/, telugu: /[ఀ-౿]/, kannada: /[ಀ-೿]/,
  malayalam: /[ഀ-ൿ]/, sinhala: /[඀-෿]/, thai: /[฀-๿]/,
  tibetan: /[ༀ-࿿]/, myanmar: /[က-႟]/, khmer: /[ក-៿]/,
  georgian: /[Ⴀ-ჿ]/, armenian: /[԰-֏]/, greek: /[Ͱ-Ͽ]/,
  hebrew: /[֐-׿]/, arabic: /[؀-ۿݐ-ݿ]/,
  cyrillic: /[Ѐ-ӿ]/, ethiopic: /[ሀ-፿]/,
  kana: /[぀-ヿ]/, cjk: /[一-鿿]/, hangul: /[가-힯]/,
  cherokee: /[Ꭰ-᏿]/, syllabics: /[᐀-ᙿ]/,
};

// Every script this file knows about is a non-Latin one, so the set is empty
// today; it is named rather than assumed so that adding a Latin-script language
// to SCRIPT_OF (to catch something else) cannot silently turn the Latin-only
// test below into "flag every string in the file".
const LATIN_SCRIPTS = new Set();
const LETTER = /\p{Letter}/u;
// Japanese and Korean write with CJK characters, which are not Latin: a value
// full of them is not what the Latin-only test is looking for.
const CJK_OK = (script, value) =>
  (script === 'kana' || script === 'hangul') && RANGES.cjk.test(value);

// The danda `।` and double danda `॥` sit in the Devanagari block but are shared
// punctuation across Indic scripts, so they are not evidence of anything. Kept
// out of the Devanagari range above rather than stripped here, so a genuinely
// Devanagari value is still recognised by its letters.
function wrongScriptKeys(lang) {
  const script = SCRIPT_OF[lang];
  if (!script) return null;

  const en = JSON.parse(readFileSync(DIR + 'en.i18n.json', 'utf8'));
  const doc = JSON.parse(readFileSync(`${DIR}${lang}.i18n.json`, 'utf8'));
  const out = [];

  // Letters only, case-folded: a value that differs from the English source
  // only in its punctuation IS the English source, and belongs to the fill
  // tool rather than to this one.
  const bare = s => s.replace(/[^\p{Letter}]/gu, '').toLowerCase();

  for (const [key, value] of Object.entries(doc)) {
    if (typeof value !== 'string' || !value.trim()) continue;
    if (value === en[key]) continue;                 // untranslated, not wrong

    // IPv4 and IPv6 are universal protocol identifiers, not English prose.
    // Strip only those exact tokens for script analysis; the translated words
    // around them remain and are still checked below.
    const analyzedValue = value.replace(/\bIPv[46]\b/g, "");

    // A value written ENTIRELY in the Latin alphabet, inside a language that is
    // not, is the other half of this check - and the half that stayed invisible
    // longest, because Latin is not one of the blocks compared below. Greek
    // held 934 values of Italian, Thai 688 of Vietnamese and ar-DZ 514 of
    // French while the count read zero. Product names are Latin too, so a value
    // is only suspect when it says something: five letters or more, and not the
    // English source wearing different punctuation.
    if (!LATIN_SCRIPTS.has(script) && !RANGES[script].test(analyzedValue)
        && LETTER.test(analyzedValue) && bare(analyzedValue).length >= 5
        && bare(analyzedValue) !== bare(en[key] || '')
        && !CJK_OK(script, analyzedValue)) {
      out.push({ key, value, en: en[key], found: 'latin' });
      continue;
    }

    for (const [name, re] of Object.entries(RANGES)) {
      if (name === script) continue;
      // Japanese writes kanji, so a kanji run in a Japanese string proves
      // nothing. Korean is different: hanja beside hangul is legitimate, but a
      // Korean interface string with NO hangul in it at all is not Korean - it
      // is the Chinese or Japanese it was seeded from. Blanket-excluding CJK
      // for hangul hid 80 such values in each Korean file (看板, 拡大, 担当者).
      if (name === 'cjk' && script === 'kana') continue;
      if (name === 'cjk' && script === 'hangul' && RANGES.hangul.test(value)) continue;
      if (!re.test(analyzedValue)) continue;
      out.push({ key, value, en: en[key], found: name });
      break;
    }
  }

  return out;
}

const [, , mode, ...rest] = process.argv;

if (mode === '--count') {
  const langs = rest.length ? rest : Object.keys(SCRIPT_OF);
  let total = 0;
  for (const lang of langs.sort()) {
    if (!existsSync(`${DIR}${lang}.i18n.json`)) continue;
    const found = wrongScriptKeys(lang) || [];
    if (!found.length) continue;
    const by = {};
    for (const f of found) by[f.found] = (by[f.found] || 0) + 1;
    total += found.length;
    console.log(
      `${lang.padEnd(7)}${SCRIPT_OF[lang].padEnd(12)}${String(found.length).padStart(5)}  ` +
      Object.entries(by).map(([s, n]) => `${s}:${n}`).join(' '),
    );
  }
  console.log(`\n${total} value(s) in a script that is not the language's own`);
  process.exit(0);
}

if (mode === '--list') {
  const lang = rest[0];
  const found = wrongScriptKeys(lang);
  if (!found) { console.error(`${lang}: not a language this can check`); process.exit(1); }
  const out = {};
  for (const f of found) out[f.key] = f.en;
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

if (mode === '--apply') {
  const [lang, file] = rest;
  const found = wrongScriptKeys(lang);
  if (!found) { console.error(`${lang}: not a language this can check`); process.exit(1); }

  const allowed = new Set(found.map(f => f.key));
  const en = JSON.parse(readFileSync(DIR + 'en.i18n.json', 'utf8'));
  const doc = JSON.parse(readFileSync(`${DIR}${lang}.i18n.json`, 'utf8'));
  const given = JSON.parse(readFileSync(file, 'utf8'));

  let written = 0;
  const refused = [];
  for (const [key, value] of Object.entries(given)) {
    if (!allowed.has(key)) { refused.push(key); continue; }
    if (typeof value !== 'string' || !value.trim()) continue;
    if (value === en[key]) continue;                 // English is not a fix here
    doc[key] = value;
    written += 1;
  }

  // Key order follows en.i18n.json, the way every other file does
  // (tests/boardItemLinks.test.cjs checks it).
  const ordered = {};
  for (const k of Object.keys(en)) if (k in doc) ordered[k] = doc[k];
  for (const k of Object.keys(doc)) if (!(k in ordered)) ordered[k] = doc[k];
  writeFileSync(`${DIR}${lang}.i18n.json`, JSON.stringify(ordered, null, 2) + '\n');

  const left = (wrongScriptKeys(lang) || []).length;
  console.log(`[wrong-script] ${lang}: wrote ${written}, ${left} still wrong-script` +
    (refused.length ? `, refused ${refused.length} key(s) this scan did not flag` : ''));
  process.exit(0);
}

console.error('usage: --count [lang ...] | --list <lang> | --apply <lang> <file>');
process.exit(1);
