const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const locale = code => JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/' + code + '.i18n.json'),
  'utf8',
));
const tigre = locale('tig');
const tigrinya = locale('ti');

const reviewed = {
  "map-to-existing-user-search": "ክሎም መትነፍዕያም እብ ስሜት፣ ስሜት መትነፍዓይ ዎክ ሀዬኒ ኢመይል ፈትሽ",
  "r-remove-all-labels": "ክሎም እሻራት ምን ወረቀት ካርድ ወኬ",
  "leave-board": "ምን ምዱድ ፈጊር",
  "linkCardToNewBoard": "ምዱድ ኽለቅ (ምን እሊ ወረቀት ካርድ)",
  "backup-day-of-week": "ምዕል እስቡዕ (ኩሉ እስቡዕ)",
  "start-day-of-week": "መበገሲት ምዕል እስቡዕ ኣቐምጥ",
  "backup-day-of-month": "ምዕል ወርሕ (ኩሉ ወርሕ፣ 1-28)",
  "accounts-lockout-known-users": "ቅንብራት ንዝፍለጡ መትነፍዕያም (ቅኑዕ ስሜት መትነፍዓይ፣ ጌጋ መሕለፊ ቃል)",
  "editLabelPopup-title": "እሻረት ተቅዪር",
  "convertChecklistItemToCardPopup-title": "ዲብ ወረቀት ካርድ ተቅዪር",
  "editCardSpentTimePopup-title": "ዝወጸ ጊዜ ተቅዪር",
  "roles-status-invite": "ዲብ ምዱድ ዐዝም",
  "change-card-parent": "ወላዲ ወረቀት ካርድ ተቅዪር",
  "r-schedule-on-weekday": "ዲብ ምዕል እስቡዕ",
  "r-schedule-on-day": "ዲብ ምዕል ወርሕ",
  "display-card-creator": "ማሀዛይ ወረቀት ካርድ ኣርኤ",
  "custom-public-desc": "ብጁ ናይ ገቢል ዋስፎ",
  "attachment-limit-mode-max-size": "ዝለዓለ ቅያስ ፈይል",
  "email-templates-invite-body": "ዐዝም ኢመይል ክቱብ",
  "filesystem-size": "ቅያስ ስርዓም ፈይል",
  "spent-time-hours": "ዝወጸ ጊዜ (ሰዐታት)",
  "import-usernames": "አስማይ መትነፍዕያም አምጸአ",
  "filesystem-storage": "መክዘን ስርዓም ፈይል",
  "text-background-color": "ሕብር ለሀላ መበገሲ ክቱብ",
  "description-on-minicard": "ዋስፎ ዲብ ንኡስ ወረቀት ካርድ",
  "list-sync-username-placeholder": "ስሜት መትነፍዓይ (ኣይግዱድን)",
  "error-orgname-taken": "እዚ ስሜት መነዘመት ድሮ ተወሲዱ",
  "error-teamname-taken": "እዚ ስሜት ፈሪቅ ድሮ ተወሲዱ",
  "error-username-taken": "እዚ ስሜት መትነፍዓይ ድሮ ተወሲዱ",
  "import-json-file": "ዎክ ሀዬኒ ፈይል Trello JSON ሕረ",
  "show-week-of-year": "እስቡዕ ሰነት ኣርኤ (ISO 8601)"
};

for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
}

console.log('Tigre multi-component terms: ' + Object.keys(reviewed).length);
