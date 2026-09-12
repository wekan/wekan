#!/usr/bin/env node
// Apply reviewed corrections only to the exact audited bad value. A newer
// correct-language translation is never overwritten by this historical list.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const corrections = JSON.parse(fs.readFileSync(path.join(here, 'audited-corrections.json'), 'utf8'));
export function repairLocale(locale, data, records = corrections) {
  const next = { ...data };
  let changed = 0;
  for (const record of records) {
    if (record.locale !== locale || next[record.key] !== record.before) continue;
    next[record.key] = record.after;
    changed++;
  }
  return { data: next, changed };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const apply = process.argv.includes('--apply');
  const root = path.resolve(here, '../..');
  const directory = path.join(root, 'imports/i18n/data');
  let total = 0;
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.i18n.json'))) {
    const filename = path.join(directory, file);
    const result = repairLocale(file.slice(0, -'.i18n.json'.length), JSON.parse(fs.readFileSync(filename, 'utf8')));
    total += result.changed;
    if (apply && result.changed) fs.writeFileSync(filename, `${JSON.stringify(result.data, null, 2)}\n`);
  }
  console.log(`${apply ? 'Corrected' : 'Found'} ${total} audited translation values.`);
}
