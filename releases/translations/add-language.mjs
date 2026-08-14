// Create the strings file, register the language and give it a flag - the three
// edits CLAUDE.md requires, in one step so none of them can be forgotten.
import { readFileSync, writeFileSync } from 'fs';
const [, , batchPath, metaPath] = process.argv;
const en = JSON.parse(readFileSync('imports/i18n/data/en.i18n.json', 'utf8'));
const batch = JSON.parse(readFileSync(batchPath, 'utf8'));
const meta = JSON.parse(readFileSync(metaPath, 'utf8')); // { tag: [name, rtl, flag] }

for (const [lang, strings] of Object.entries(batch)) {
  const unknown = Object.keys(strings).filter(k => en[k] === undefined);
  if (unknown.length) console.log(lang, 'UNKNOWN KEYS:', unknown.join(' '));
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(en)) out[k] = strings[k] !== undefined ? (n++, strings[k]) : v;
  writeFileSync(`imports/i18n/data/${lang}.i18n.json`, JSON.stringify(out, null, 2) + '\n');
}
let registry = readFileSync('imports/i18n/languages.js', 'utf8');
let added = 0;
for (const [tag, [name, rtl]] of Object.entries(meta)) {
  if (registry.includes(`"${tag}": {`)) continue;
  const entry = `  "${tag}": {\n    code: "${tag}",\n    tag: "${tag}",\n    name: "${name}",\n`
    + `    load: () => import('./data/${tag}.i18n.json'),\n    rtl: ${rtl},\n  },\n`;
  const re = /^  "([^"]+)": \{$/gm;
  let m, at = null;
  while ((m = re.exec(registry))) if (m[1] > tag) { at = m.index; break; }
  if (at === null) at = registry.lastIndexOf('};');
  registry = registry.slice(0, at) + entry + registry.slice(at);
  added += 1;
}
writeFileSync('imports/i18n/languages.js', registry);

let header = readFileSync('client/components/users/userHeader.js', 'utf8');
const mapStart = header.indexOf('const flagMap');
const map = header.slice(mapStart, header.indexOf('};', mapStart));
const need = Object.entries(meta).filter(([t]) => !map.includes(`'${t}':`));
if (need.length) {
  const line = need.map(([t, [, , flag]]) => `'${t}': '${flag}'`).join(', ');
  const anchor = header.slice(mapStart).match(/'[a-z-]+': '[^']+'\n(\s*)\};/);
  header = header.replace(/('[a-z-]+': '[^']+')(\n\s*\};)/, `$1,\n      ${line}$2`);
  writeFileSync('client/components/users/userHeader.js', header);
}
console.log(`${Object.keys(batch).length} files, ${added} registered, ${need.length} flags added`);
