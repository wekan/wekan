#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const tigre = JSON.parse(
  fs.readFileSync(path.join(root, "imports/i18n/data/tig.i18n.json"), "utf8"),
);
const tigrinya = JSON.parse(
  fs.readFileSync(path.join(root, "imports/i18n/data/ti.i18n.json"), "utf8"),
);

const expected = {
  "card-due": "ሐዞት",
  "due-date": "አምዐል መዋዕድ",
  "cardCustomField-datePopup-title": "ተመር ተቅዪር",
  "editVoteEndDatePopup-title": "ተመር መከለሲ ሕርያን ተቅዪር",
  "editPokerEndDatePopup-title":
    "ተመር መከለሲ ሕርያን Planning Poker ተቅዪር",
  "editCardStartDatePopup-title": "ተመር መበገሲት ተቅዪር",
  "editCardDueDatePopup-title": "አምዐል መዋዕድ ተቅዪር",
  "editCardReceivedDatePopup-title": "ተመር በጽሐ ተቅዪር",
  "editCardEndDatePopup-title": "ተመር መከለሲ ተቅዪር",
};

for (const [key, value] of Object.entries(expected)) {
  assert.equal(tigre[key], value, `${key} must retain the reviewed Tigre wording`);
  assert.notEqual(
    tigre[key],
    tigrinya[key],
    `${key} must not regress to the Tigrinya-seeded value`,
  );
}

console.log(`Tigre date controls: ${Object.keys(expected).length}`);
