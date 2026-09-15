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
  import: "አምጸአ",
  "r-import": "አምጸአ",
  "r-import-target": "ዲብ እሊ አምጸአ",
  "importListPopup-title": "ዝርዝር አምጸአ",
  "importCardPopup-title": "ወረቀት ካርድ አምጸአ",
  "importBoardIntoPopup-title": "ዲብ ምዱድ አምጸአ",
  "chooseBoardSourcePopup-title": "ምዱድ አምጸአ",
  "import-board": "ምዱድ አምጸአ",
  "import-board-c": "ምዱድ አምጸአ",
  "listImportCardPopup-title": "ወረቀት ካርድ Trello አምጸአ",
  "listImportCardsTsvPopup-title": "Excel CSV/TSV አምጸአ",
};

for (const [key, value] of Object.entries(expected)) {
  assert.equal(tigre[key], value, `${key} must retain reviewed Tigre wording`);
  assert.notEqual(tigre[key], tigrinya[key],
    `${key} must not regress to its Tigrinya seed`);
}

console.log(`Tigre import controls: ${Object.keys(expected).length}`);
