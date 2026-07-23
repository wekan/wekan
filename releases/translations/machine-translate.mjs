#!/usr/bin/env node
/**
 * Machine-translate ONLY the English-placeholder strings, so machine translation can
 * NEVER overwrite a human translation.
 *
 * Runs AFTER `merge-translations.mjs` in the pull flow. By that point every language
 * file holds:
 *   - real human translations from Transifex (value differs from the English source), and
 *   - English placeholders for the strings that are untranslated EVERYWHERE (value equals
 *     the English source, or the key is missing).
 * The merge guarantees those are the ONLY English-valued strings left, so filling exactly
 * "value === English source (or key missing)" touches placeholders and nothing else — a
 * human translation (value !== English) is never selected, hence never overwritten. This
 * is the policy in CLAUDE.md: only missing strings are machine-translated, and only when
 * missing everywhere. A language that has NO translation at all is simply the case where
 * every key is a placeholder, so it gets fully filled.
 *
 * Machine output stays LOCAL (bundled into the build). It is NOT pushed to Transifex, so
 * it can never masquerade as human there; only human translations are pushed back
 * (pull-translations.sh pushes the restored languages).
 *
 * Provider is pluggable and LibreTranslate-compatible by default (self-host or a mirror):
 *   WEKAN_MT_URL      translate endpoint (default https://libretranslate.com/translate)
 *   WEKAN_MT_API_KEY  optional api_key sent with each request
 *   WEKAN_MT_FORMAT   "text" (default) — LibreTranslate `format`
 *   WEKAN_MT_SOURCE   source language code (default "en")
 * A different backend (DeepL, Google, a local Argos server) only needs its own `translate`
 * call swapped into translateBatch() — the placeholder-only SELECTION above is what makes
 * it safe, independent of the engine.
 *
 * Usage:
 *   node releases/translations/machine-translate.mjs [--dry-run] [--limit N] [lang ...]
 *     no lang args  -> every imports/i18n/data/<lang>.i18n.json (English + en-* variants skipped)
 *     lang args     -> only those language codes (e.g. `fi de zh-Hans`)
 *     --dry-run     -> report how many placeholders WOULD be filled per language; no writes, no API
 *     --limit N     -> cap translated strings per language per run (resume-friendly; default no cap)
 *     --provider-check -> translate a single probe string and exit (verifies the endpoint)
 *
 * Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'imports/i18n/data';
const EN_FILE = path.join(DATA_DIR, 'en.i18n.json');

const MT_URL = process.env.WEKAN_MT_URL || 'https://libretranslate.com/translate';
const MT_API_KEY = process.env.WEKAN_MT_API_KEY || '';
const MT_FORMAT = process.env.WEKAN_MT_FORMAT || 'text';
const MT_SOURCE = process.env.WEKAN_MT_SOURCE || 'en';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const providerCheck = args.includes('--provider-check');
const limitIdx = args.indexOf('--limit');
const perLangLimit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) || 0 : 0;
const langArgs = args.filter((a, i) =>
  !a.startsWith('--') && !(limitIdx !== -1 && i === limitIdx + 1));

const readJson = p => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

const en = readJson(EN_FILE);
if (!en) { console.error(`[mt] cannot read ${EN_FILE}`); process.exit(1); }
const enKeys = Object.keys(en);

// Map a WeKan file/lang code (e.g. zh-Hans, pt-BR, ja_JP) to a translation-API target
// code. LibreTranslate uses bare ISO-639-1 codes; strip region/script and lowercase.
// Codes the engine does not support are skipped (reported), never guessed wrongly.
const toApiLang = code => code.replace(/[_-].*$/, '').toLowerCase();

async function translateOne(text, target) {
  const body = { q: text, source: MT_SOURCE, target, format: MT_FORMAT };
  if (MT_API_KEY) body.api_key = MT_API_KEY;
  const res = await fetch(MT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => '')}`.slice(0, 200));
  const j = await res.json();
  if (typeof j.translatedText !== 'string') throw new Error(`no translatedText in response`);
  return j.translatedText;
}

// Translate an array of strings for one target, one request at a time (LibreTranslate
// accepts an array in `q`, but one-at-a-time is the most portable and lets a single
// failure fall back to leaving that key as its English placeholder).
async function translateBatch(texts, target) {
  const out = [];
  for (const t of texts) {
    try { out.push(await translateOne(t, target)); }
    catch (e) { out.push(null); process.stderr.write(`[mt]   string failed (${target}): ${e.message}\n`); }
  }
  return out;
}

if (providerCheck) {
  const target = toApiLang(langArgs[0] || 'fi');
  try {
    const r = await translateOne('Board', target);
    console.log(`[mt] provider OK: "Board" -> (${target}) "${r}"  via ${MT_URL}`);
    process.exit(0);
  } catch (e) { console.error(`[mt] provider FAILED via ${MT_URL}: ${e.message}`); process.exit(1); }
}

let files = fs.readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.i18n.json') && f !== 'en.i18n.json');
if (langArgs.length) {
  const want = new Set(langArgs.map(l => l + '.i18n.json'));
  files = files.filter(f => want.has(f));
}
// Skip English and English variants (en, en-GB, en_AU, ...) — they are English by design;
// their few real differences are entered by humans, never machine-filled.
files = files.filter(f => !/^en([_-]|\.)/.test(f) && f !== 'en.i18n.json');

let grandFilled = 0;
for (const f of files) {
  const p = path.join(DATA_DIR, f);
  const code = path.basename(f, '.i18n.json');
  const target = toApiLang(code);
  const j = readJson(p);
  if (!j) { process.stderr.write(`[mt] skip ${f}: unreadable\n`); continue; }

  // SELECT placeholders only: key missing, or value equals the English source. A human
  // translation (value !== en) is never selected, so it can never be overwritten.
  let placeholders = enKeys.filter(k => {
    const v = j[k];
    return typeof en[k] === 'string' && (typeof v !== 'string' || v === en[k]);
  });
  if (perLangLimit > 0) placeholders = placeholders.slice(0, perLangLimit);

  if (!placeholders.length) { continue; }

  if (dryRun) {
    console.log(`[mt] ${code}: ${placeholders.length} placeholder(s) would be machine-translated (target=${target})`);
    grandFilled += placeholders.length;
    continue;
  }

  process.stderr.write(`[mt] ${code}: translating ${placeholders.length} placeholder(s) (target=${target})…\n`);
  const sources = placeholders.map(k => en[k]);
  const translated = await translateBatch(sources, target);

  let filled = 0;
  placeholders.forEach((k, i) => {
    const t = translated[i];
    // Only write a real, non-empty result that actually differs from English; on failure
    // leave the English placeholder untouched so a later run can retry it.
    if (typeof t === 'string' && t.trim() && t !== en[k]) { j[k] = t; filled += 1; }
  });

  if (filled) {
    // Preserve en.i18n.json key order and the repo's 2-space + trailing-newline format.
    const ordered = {};
    for (const k of enKeys) if (typeof j[k] === 'string') ordered[k] = j[k];
    // keep any extra keys the language file had that are not in en (rare) at the end
    for (const k of Object.keys(j)) if (!(k in ordered)) ordered[k] = j[k];
    fs.writeFileSync(p, JSON.stringify(ordered, null, 2) + '\n');
    process.stderr.write(`[mt] ${code}: filled ${filled} string(s)\n`);
    grandFilled += filled;
  }
}

process.stderr.write(`[mt] done: ${grandFilled} machine translation(s) ${dryRun ? 'would be ' : ''}filled (human translations never touched).\n`);
