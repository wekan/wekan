#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = locale => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${locale}.i18n.json`), "utf8"));
const tigre = read("tig");
const tigrinya = read("ti");
const expected = {
  "list-label-title": "ስሜት ዝርዝር",
  "signupPopup-title": "ሕሳብ ፍትሕ",
  "admin-people-filter-inactive": "ከስላን",
  logout: "ፈጊር",
};

for (const [key, value] of Object.entries(expected)) {
  assert.equal(tigre[key], value, `${key} must reuse reviewed Tigre wording`);
  assert.notEqual(tigre[key], tigrinya[key],
    `${key} must not regress to its Tigrinya seed`);
}

console.log(`Tigre ledger reuse: ${Object.keys(expected).length}`);
