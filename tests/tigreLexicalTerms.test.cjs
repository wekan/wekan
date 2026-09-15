'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readLocale = code =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, `imports/i18n/data/${code}.i18n.json`),
      'utf8',
    ),
  );

const tigre = readLocale('tig');
const tigrinya = readLocale('ti');
const terms = {
  "location-address": "ዕንዋን",
  "office-address": "ዕንዋን",
  "event-bleed": "ስሜት",
  "allboards.workspace-color": "ሕብር",
  "admin-announcement": "አዋጅ",
  "board-view-timeline-now": "አዜ",
  "card-comments-more": "ዚያደት",
  "card-start": "አንብት",
  "vote-against": "ድድ",
  "userPopup-title": "አባል",
  "cardMemberPopup-title": "አባል",
  "cards-count-one": "ወረቀት ካርድ",
  "cardType-card": "ወረቀት ካርድ",
  "theme-category": "መንሹር",
  "theme-category-dark": "ጽልመት",
  "font-size-large": "ገዚፍ",
  "close": "ድባእ",
  "color-blue": "አዝረቁ",
  "color-crimson": "ቀይሕ",
  "color-gold": "ደሀብ",
  "color-gray": "ጨዓይ",
  "color-lime": "ኖረት",
  "searchElementPopup-title": "ፈትሽ",
  "custom-field-currency": "ግሩሽ",
  "custom-field-dropdown-none": "(ወላ ገለ)",
  "custom-field-dropdown-unknown": "(ለይትኣመራ)",
  "custom-field-number": "ዕልብ",
  "delete": "ምሳሕ",
  "description": "ዋስፎ",
  "download": "ጸዐን",
  "email-address": "ዕንዋን ኢመይል",
  "export-card-excel-free": "ሐራ",
  "log-in": "እተው",
  "loginPopup-title": "እተው",
  "name": "ስሜት",
  "or": "ዎክ ሀዬኒ",
  "search": "ፈትሽ",
  "subscribe": "አሽተርክ",
  "pomodoro-work": "ሽቄ",
  "what-to-do": "ሚ እግል ትውዴ ቱ?",
  "send-from": "ምን",
  "no-name": "(ለይትኣመራ)",
  "package": "ጥብለል",
  "yes": "አይወ",
  "active": "ህርኩት",
  "card-end": "መከለሲ",
  "r-when": "ሚዶል",
  "r-board": "ምዱድ",
  "r-run": "ሰዔ",
  "r-sort-name": "ስሜት",
  "r-name": "ስሜት",
  "r-card": "ወረቀት ካርድ",
  "r-member": "አባል",
  "r-check": "ግናሕ",
  "r-df-start-at": "መበገሲት",
  "r-df-end-at": "መከለሲ",
  "passwordless-email": "ዕንዋን ኢመይል",
  "new": "ሐዲስ",
  "help": "ሰዳየት",
  "owner": "በዐል-ማል",
  "card": "ወረቀት ካርድ",
  "board": "ምዱድ",
  "operator-board": "ምዱድ",
  "operator-member": "አባል",
  "operator-creator": "ማሀዛይ",
  "operator-comment": "ረአይ",
  "operator-description": "ዋስፎ",
  "predicate-description": "ዋስፎ",
  "predicate-start": "መበገሲት",
  "predicate-end": "መከለሲ",
  "predicate-member": "አባል",
  "next-page": "ገጽ ላትተለ",
  "dependency-color": "ሕብር",
  "creator": "ማሀዛይ",
  "reason": "ሰበብ",
  "copied": "ነቅል።",
  "move-scope": "ኣግዕዝ",
  "move-progress-file": "ፈይል",
  "checklist-reset-interval-daily": "ክል ዮማይ",
  "card-recurrence-interval-daily": "ክል ዮማይ",
  "admin-people-filter-show": "ኣርኤ",
  "admin-people-filter-active": "ህርኩት",
  "idle": "ከስላን",
  "storage-read": "ቅረእ",
  "backup-frequency-off": "ጎፍ ከደን",
  "backup-frequency-daily": "ክል ዮማይ",
  "start": "አንብት",
  "stop": "ከሬ",
  "create-account": "ሕሳብ ፍትሕ",
  "login": "መእተዪ",
  "file": "ፈይል",
  "log": "ደብተር",
  "event-category": "መንሹር",
  "list-sync-last-synced-never": "ወለ ሐቴ ዶል"
};

for (const [key, value] of Object.entries(terms)) {
  assert.equal(tigre[key], value, `${key} should use the reviewed Tigre term`);
  assert.notEqual(
    tigre[key],
    tigrinya[key],
    `${key} should not retain its Tigrinya-seeded value`,
  );
}

console.log(`Checked ${Object.keys(terms).length} reviewed Tigre lexical terms.`);
