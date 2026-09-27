'use strict';

// Import the pinned Blockly catalog into WeKan's existing translation files.
// Keep all local translations; upstream only fills new or English entries.
// No network, translation service, or Transifex push is involved.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const directory = path.join(root, 'imports/i18n/data');
const upstream = path.join(root, 'node_modules/blockly/msg');
const english = require(path.join(upstream, 'en.js'));
const available = new Set(fs.readdirSync(upstream).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)));
const aliases = { 'zh-cn':'zh-hans', 'zh-sg':'zh-hans', 'zh-gb':'zh-hans', zh:'zh-hans', cmn:'zh-hans', 'zh-tw':'zh-hant', 'zh-hk':'zh-hant', 'ca@valencia':'ca', 'sr-latn':'sr-latn', ku:'ku-latn', ug:'ug-arab', no:'nb' };
const reuse = {
  CLOSE:'close', DIALOG_CANCEL:'cancel', HELP:'help', DELETE_KEY:'delete',
  SHORTCUTS_DELETE:'delete', ZOOM_IN:'zoom-in', ZOOM_OUT:'zoom-out',
  ARIA_LABEL_COMMENT:'comment', ARIA_LABEL_HEADING:'title',
  ARIA_TYPE_FIELD_NUMBER:'number', ARIA_TYPE_FIELD_TEXT_INPUT:'text',
  FIELD_LABEL_CHECKBOX_CHECKED:'r-checked', FIELD_LABEL_CHECKBOX_UNCHECKED:'r-unchecked',
  WORKSPACE_ROLEDESCRIPTION:'r-workspace',
};
function locale(tag) {
  const normalized = tag.toLowerCase().replaceAll('_', '-');
  if (aliases[normalized]) return aliases[normalized];
  if (available.has(normalized)) return normalized;
  const base = normalized.split('-')[0];
  return available.has(base) ? base : aliases[base];
}
function tokens(value) { return (String(value).match(/%\d+(?:\$[a-z])?|%[a-z]|%\{[^}]+\}|__[A-Za-z0-9_]+__/g) || []).sort().join('|'); }
const mapping = Object.fromEntries(Object.keys(english).map(key => [key, reuse[key] || `blockly-${key}`]));
function mergeMessages(data, translated) {
  const merged = { ...data };
  for (const [key, source] of Object.entries(english)) {
    if (reuse[key]) continue;
    const target = mapping[key];
    if (merged[target] === undefined || merged[target] === source) {
      const candidate = translated[key];
      merged[target] = candidate && tokens(candidate) === tokens(source) ? candidate : source;
    }
  }
  return merged;
}
function run() {
  const report = [];
  const reportOnly = process.argv.includes('--report');
  for (const file of fs.readdirSync(directory).filter(f => f.endsWith('.i18n.json'))) {
    const tag = file.slice(0, -10);
    const filename = path.join(directory, file);
    const old = JSON.parse(fs.readFileSync(filename));
    const upstreamTag = locale(tag);
    const translated = upstreamTag ? require(path.join(upstream, `${upstreamTag}.js`)) : {};
    const data = reportOnly ? old : mergeMessages(old, translated);
    const missing = Object.entries(english).filter(([key, source]) => !reuse[key] && data[mapping[key]] === source && /[a-z]{3}/i.test(source) && !/^https?:|^#[0-9a-f]+$/.test(source) && !tag.startsWith('en')).length;
    if (!reportOnly) fs.writeFileSync(filename, `${JSON.stringify(data, null, 2)}\n`);
    report.push({ language:tag, upstream:upstreamTag || null, englishMatches:missing });
  }
  if (!reportOnly) fs.writeFileSync(path.join(root, 'models/lib/blocklyMessageKeys.json'), `${JSON.stringify(mapping, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}
module.exports = { mergeMessages, tokens, locale, mapping };
if (require.main === module) run();
