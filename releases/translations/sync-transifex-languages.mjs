// Make Transifex know about every language WeKan has, so a push can carry them.
//
// `tx push -t` uploads translations for the languages the PROJECT has as
// targets. A language that only exists here - every language added to
// imports/i18n/data/ since the project was last reconciled - is not a target
// there, so its file is skipped in silence and the push reports a smaller
// number than the repository holds. That is the whole reason
// push-all-translations.sh pushed 146 of 245.
//
// This adds the missing ones to the project first, and prints what it did, so
// the count is visible either way rather than being something you notice months
// later when a language is still English on Transifex.
//
// Usage:
//   node releases/translations/sync-transifex-languages.mjs            # add what is missing
//   node releases/translations/sync-transifex-languages.mjs --dry-run  # say what it would add
//   node releases/translations/sync-transifex-languages.mjs --list     # local codes, one per line
//
// The token comes from TX_TOKEN, or from ~/.transifexrc, the same file the tx
// CLI reads. --list needs neither, so the enumeration can be checked offline.

import { readFileSync, readdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const API = 'https://rest.api.transifex.com';
const DATA_DIR = 'imports/i18n/data';
const CONFIG = '.tx/config';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const listOnly = args.includes('--list');

// ── the config ──────────────────────────────────────────────────────────────

// `lang_map = te_IN: te-IN, ...` maps the TRANSIFEX language code (the key) to
// the name of the local file (the value). Pushing needs the other direction: a
// file on disk, and the code Transifex knows it by.
function readConfig() {
  const text = readFileSync(CONFIG, 'utf8');

  const mapLine = text.split('\n').find(l => l.trim().startsWith('lang_map'));
  const localToTx = new Map();
  if (mapLine) {
    for (const pair of mapLine.replace(/^\s*lang_map\s*=\s*/, '').split(',')) {
      const [txCode, localName] = pair.split(':').map(s => s && s.trim());
      if (txCode && localName) localToTx.set(localName, txCode);
    }
  }

  // [o:<org>:p:<project>:r:<resource>]
  const section = text.match(/^\[o:([^:]+):p:([^:]+):r:([^\]]+)\]/m);
  if (!section) throw new Error(`${CONFIG}: no [o:...:p:...:r:...] section`);

  return { localToTx, org: section[1], project: section[2], resource: section[3] };
}

// Every language WeKan ships, as the code Transifex knows it by. English is the
// SOURCE language, so it is not a target and is left out.
function localLanguages({ localToTx }) {
  return readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.i18n.json'))
    .map(f => f.replace('.i18n.json', ''))
    .filter(name => name !== 'en')
    .map(name => ({ file: name, code: localToTx.get(name) || name }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

// ── the token ───────────────────────────────────────────────────────────────

function readToken() {
  if (process.env.TX_TOKEN) return process.env.TX_TOKEN.trim();

  const rc = path.join(homedir(), '.transifexrc');
  if (existsSync(rc)) {
    const m = readFileSync(rc, 'utf8').match(/^\s*token\s*=\s*(\S+)/m);
    if (m) return m[1];
  }

  return null;
}

// ── the API ─────────────────────────────────────────────────────────────────

async function api(token, method, url, body) {
  const res = await fetch(url.startsWith('http') ? url : API + url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/vnd.api+json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // a non-JSON body is reported as-is below
  }

  if (!res.ok) {
    const detail = json?.errors?.map(e => e.detail || e.title).join('; ') || text.slice(0, 300);
    const err = new Error(`${method} ${url} -> ${res.status}: ${detail}`);
    err.status = res.status;
    err.errors = json?.errors || [];
    throw err;
  }

  return json;
}

// The project's current target languages, following pagination - a project with
// a couple of hundred languages does not come back in one page.
async function projectLanguages(token, org, project) {
  const codes = new Set();
  let url = `/projects/o:${org}:p:${project}/languages`;

  while (url) {
    const page = await api(token, 'GET', url);
    for (const item of page.data || []) {
      const code = item.attributes?.code || String(item.id || '').replace(/^l:/, '');
      if (code) codes.add(code);
    }
    url = page.links?.next || null;
  }

  return codes;
}

// ── main ────────────────────────────────────────────────────────────────────

const config = readConfig();
const languages = localLanguages(config);

if (listOnly) {
  for (const { code } of languages) console.log(code);
  process.exit(0);
}

console.log(`[tx] ${languages.length} language(s) in ${DATA_DIR} (English is the source)`);

const token = readToken();
if (!token) {
  console.error(
    '[tx] no token: set TX_TOKEN, or log in with the tx CLI so ~/.transifexrc exists.\n' +
    '[tx] Without it the languages cannot be added to the project, and `tx push -t`\n' +
    '[tx] will silently skip every language the project does not already have.',
  );
  process.exit(1);
}

const existing = await projectLanguages(token, config.org, config.project);
console.log(`[tx] the project has ${existing.size} target language(s)`);

const missing = languages.filter(l => !existing.has(l.code));
if (missing.length === 0) {
  console.log('[tx] nothing to add - every local language is a target of the project');
  process.exit(0);
}

console.log(`[tx] ${missing.length} local language(s) are NOT on the project:`);
console.log(`[tx]   ${missing.map(l => l.code).join(' ')}`);

if (dryRun) {
  console.log('[tx] --dry-run: nothing was changed');
  process.exit(0);
}

// Added one at a time on purpose: Transifex refuses a language code it does not
// know, and in one batch that one refusal takes the whole batch with it. A code
// WeKan invented (or got wrong) should cost only itself, and should be NAMED, so
// it can be mapped in .tx/config's lang_map or corrected here.
const added = [];
const rejected = [];

for (const lang of missing) {
  try {
    await api(token, 'POST', `/projects/o:${config.org}:p:${config.project}/languages`, {
      data: [{ type: 'languages', id: `l:${lang.code}` }],
    });
    added.push(lang.code);
    console.log(`[tx]   + ${lang.code}`);
  } catch (err) {
    rejected.push({ code: lang.code, file: lang.file, why: err.message });
    console.log(`[tx]   ! ${lang.code} (${lang.file}.i18n.json): ${err.message}`);
  }
}

console.log(`\n[tx] added ${added.length}, refused ${rejected.length}`);

if (rejected.length) {
  console.log(
    '[tx] A refused code is one Transifex does not have. Either it is a tag WeKan\n' +
    '[tx] invented - map it to a real Transifex code in .tx/config lang_map, the way\n' +
    '[tx] `vec: ve-CC` and `vls: vl-SS` already are - or the language has to be\n' +
    '[tx] created on Transifex first. Its file still ships in WeKan either way;\n' +
    '[tx] only the round trip through Transifex is missing.',
  );
}
