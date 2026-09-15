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
  fullname: "ምሉእ ስሜት",
  "location-name": "ስሜት አካን",
  "webhook-title": "ስሜት Webhook",
  "version-name": "ስሜት-ስሪት",
};

for (const [key, value] of Object.entries(expected)) {
  assert.equal(tigre[key], value, `${key} must retain reviewed Tigre wording`);
  assert.notEqual(tigre[key], tigrinya[key],
    `${key} must not regress to its Tigrinya seed`);
}

console.log(`Tigre name controls: ${Object.keys(expected).length}`);
