#!/usr/bin/env node
// charts-values-reference.mjs - rewrite the commented settings reference in the
// Helm chart's values.yaml from WeKan's docker-compose.yml.
//
//   Usage: node releases/charts-values-reference.mjs [<charts>/wekan/values.yaml]
//
// values.yaml carries every setting docker-compose.yml documents, commented, so
// a Helm user never has to read a compose file to find out what WeKan takes
// (tests/chartsFerretdb.test.cjs). It was copied by hand once, and the compose
// file kept growing: 74 settings were missing. This regenerates the block
// between the "## ----" line under "EVERY OTHER SETTING WeKan takes" and the
// "## ----" line that closes it, from the wekan service's environment, and is
// run by release-charts.sh on every chart release.
//
//   # text            -> # text
//   - KEY=value       -> #  - name: "KEY"
//   #- KEY=value         #    value: "value"
//
// A comment after a value (ROOT_URL=http://localhost  # <=== ...) goes on the
// line above it: inside the value it would become part of it when uncommented.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const valuesFile = process.argv[2] || path.join(root, '.tools/charts/wekan/values.yaml');
const compose = fs.readFileSync(path.join(root, 'docker-compose.yml'), 'utf8').split('\n');

// The wekan service's environment list: from its "environment:" to the next
// key of the same depth.
const service = compose.findIndex(line => /^ {2}wekan:\s*$/.test(line));
const start = compose.findIndex((line, i) => i > service && /^ {4}environment:\s*$/.test(line));
if (service < 0 || start < 0) throw new Error('docker-compose.yml: no wekan service environment');
const end = compose.findIndex((line, i) => i > start && /^ {4}[a-z_]+:/.test(line));

const quote = text => `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const out = [];
for (const raw of compose.slice(start + 1, end < 0 ? undefined : end)) {
  const line = raw.trim();
  if (!line) continue;
  const setting = line.match(/^#?\s*-\s+([A-Z][A-Z_0-9]{2,})=(.*)$/);
  if (setting) {
    let [, name, value] = setting;
    const trailing = value.match(/^(.*?\S)\s+#\s*(.*)$/);
    if (trailing && !/^['"]/.test(value)) {
      out.push(`# ${trailing[2]}`);
      value = trailing[1];
    }
    out.push(`#  - name: ${quote(name)}`, `#    value: ${quote(value)}`);
  } else if (line.startsWith('#')) {
    out.push(line.replace(/^#\s?/, '# ').replace(/\s+$/, ''));
  } else {
    throw new Error(`docker-compose.yml: unexpected line in the wekan environment: ${line}`);
  }
}

const values = fs.readFileSync(valuesFile, 'utf8').split('\n');
const header = values.findIndex(line => line.startsWith('## EVERY OTHER SETTING WeKan takes'));
const open = values.findIndex((line, i) => i > header && /^## -{20,}$/.test(line));
const close = values.findIndex((line, i) => i > open && /^## -{20,}$/.test(line));
if (header < 0 || open < 0 || close < 0) throw new Error(`${valuesFile}: no settings reference block`);
const next = [...values.slice(0, open + 1), ...out, ...values.slice(close)].join('\n');
if (next !== values.join('\n')) {
  fs.writeFileSync(valuesFile, next);
  console.log(`Updated the settings reference in ${valuesFile} from docker-compose.yml.`);
} else {
  console.log(`The settings reference in ${valuesFile} is already up to date.`);
}
