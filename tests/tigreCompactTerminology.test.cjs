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
  "accounts-allowUserNameChange": "ለውጢ ስሜት መትነፍዓይ",
  "active-person": "ህርኩት ነፈር",
  "help-request": "ሱአል ሰዳየት",
  shortName: "ሓጺር ስሜት",
  "event-ip": "ዕንዋን IP",
  "event-ipv4": "ዕንዋን IPv4",
  "event-ipv6": "ዕንዋን IPv6",
  "parent-card": "ወላዲ ወረቀት ካርድ",
  "roadmap-no-cards": "ወረቀት ካርድ የለን።",
  "calendar-previous-month-label": "ቀዳሚት ወርሕ",
  "calendar-next-month-label": "ዝቕጽል ወርሕ",
  "date-format": "ቅርጺ ተመር",
  "font-size": "ቅያስ ፊደል",
  "selection-color": "ሕብር ምርጫ",
  "r-datefield": "ዓውዲ ተመር",
  "custom-color": "ብሕታዊ ሕብር",
  "translation-text": "ክቱብ ትርጉም",
  "cron-error-message": "ልእከት ጌጋ",
  "step-progress": "ዐቦት ደረጃ",
  "smtp-tls": "ሰዳየት TLS",
  "job-queue": "ሪጋ ሹቁል",
  "admin-people-active-status": "ሓላት ንጥፈት",
  securityReportTitle: "ጸብጻብ አምን",
  "board-title": "ኣርእስቲ ምዱድ",
  "support-title": "ኣርእስቲ ሰዳየት",
  Database_type: "ዐይነት ዳታቤዝ",
  OS_Type: "ዐይነት OS",
  OS_Freemem: "ሐራ መዘክር OS",
  OS_Cpus: "ዐደድ CPU ናይ OS",
  "system-resources": "ጸጋታት ስርዓም",
  "size-bytes": "ቅያስ (ባይት)",
};

for (const [key, value] of Object.entries(expected)) {
  assert.equal(tigre[key], value, `${key} must retain reviewed Tigre wording`);
  assert.notEqual(tigre[key], tigrinya[key],
    `${key} must not regress to its Tigrinya seed`);
}

console.log(`Tigre compact terminology: ${Object.keys(expected).length}`);
