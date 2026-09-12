#!/usr/bin/env node
// Reconstruct the repair queue from the committed audit itself, so progress
// does not depend on temporary scanner output or the original pull files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function decodeCell(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return value.replaceAll('<br>', '\n').replace(/&(#(?:x[0-9a-f]+|\d+)|amp|lt|gt|quot|apos);/gi, (_, code) => code[0] === '#'
    ? String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))) : named[code]);
}
export function parseAudit(text) {
  const rows = [], seen = new Set();
  let category = '';
  for (const line of text.split('\n')) {
    if (/^#{2,3} /.test(line)) category = line.replace(/^#+ /, '').replace(/ — current local values$/, '');
    if (!/^\| [^|]+\.i18n\.json \|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(cell => decodeCell(cell.slice(1, -1)));
    if (cells.length !== 6) throw new Error('Audit row does not have six columns');
    const [file, language, key, local, transifex, problem] = cells;
    const identity = `${file}:${key}`;
    if (seen.has(identity)) throw new Error(`Duplicate audit key ${identity}`);
    seen.add(identity);
    const originalPull = transifex !== 'Not available — not queried';
    rows.push({ file, locale: file.slice(0, -'.i18n.json'.length), language, key, category, local, transifex,
      problem, originalPull, auditedBadValue: originalPull ? transifex : local });
  }
  return rows;
}
export function classifyAuditRow(row, current, correction, review) {
  if (correction && correction.after === current) return 'corrected';
  if (review && review.value === current) return 'reviewedUnchanged';
  if (row.originalPull && current === row.local) return 'restoredPrePull';
  return 'pending';
}
export function repairProgress(repository = root) {
  const audit = parseAudit(fs.readFileSync(path.join(repository, 'docs/Features/Translations/Audit-Evidence.md'), 'utf8'));
  const corrections = JSON.parse(fs.readFileSync(path.join(repository, 'releases/translations/audited-corrections.json'), 'utf8'));
  const reviews = JSON.parse(fs.readFileSync(path.join(repository, 'releases/translations/audited-reviews.json'), 'utf8'));
  const corrected = new Map(corrections.map(row => [`${row.locale}:${row.key}`, row]));
  const reviewed = new Map(reviews.map(row => [`${row.locale}:${row.key}`, row]));
  const documents = new Map();
  const summary = { auditedKeys: audit.length, corrected: 0, restoredPrePull: 0, reviewedUnchanged: 0, pending: 0 };
  const pendingByLocale = {};
  const rows = audit.map(row => {
    if (!documents.has(row.locale)) documents.set(row.locale, JSON.parse(fs.readFileSync(path.join(repository, 'imports/i18n/data', row.file), 'utf8')));
    const current = documents.get(row.locale)[row.key];
    const identity = `${row.locale}:${row.key}`;
    const status = classifyAuditRow(row, current, corrected.get(identity), reviewed.get(identity));
    summary[status]++;
    if (status === 'pending') pendingByLocale[row.locale] = (pendingByLocale[row.locale] || 0) + 1;
    return { ...row, current, status };
  });
  return { summary, pendingByLocale, rows };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = repairProgress();
  const localeIndex = process.argv.indexOf('--locale');
  if (localeIndex !== -1) {
    const locale = process.argv[localeIndex + 1];
    const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
    console.log(JSON.stringify(result.rows.filter(row => row.status === 'pending' && row.locale === locale)
      .map(row => ({ key: row.key, source: english[row.key], current: row.current, category: row.category })), null, 2));
  } else console.log(JSON.stringify({ ...result.summary, pendingByLocale: result.pendingByLocale }, null, 2));
}
