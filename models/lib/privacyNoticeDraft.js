'use strict';

// A first draft of the privacy notice, from what this WeKan really stores
// (docs/Compliance/README.md WP-6, row 7.1; [GDPR] Art. 13). Admin Panel /
// Settings / Legal pages offers it as the privacy page's starting text; the
// operator - the controller - completes it: who they are, their legal basis,
// and anything they run beside WeKan.
//
// Built from the personal-data inventory (models/lib/personalDataInventory.js),
// so it names every kind of data WeKan keeps, and changes when that does.
// Pure: tests/legalPages.test.cjs.

const { INVENTORY } = require('./personalDataInventory');

const CATEGORY_TEXT = Object.freeze({
  identity: 'Who you are: your name, username, initials and profile picture.',
  contact: 'How to reach you: your e-mail addresses, and addresses you or an administrator enter.',
  network: 'Where you sign in from: IP addresses and, when the server is told, an approximate location.',
  usage: 'What you do in WeKan: the boards and cards you work on, what changed and when.',
  content: 'What you write: cards, comments, checklists, attachments and other board content.',
  health: 'Absences you record in workload planning, which can include sick leave (special category data).',
  financial: 'Billing data: hourly rates, time entries that are invoiced, quotes and invoices.',
  auth: 'How you sign in: password hashes, two-factor and passkey keys, and login sessions (never shown to anybody).',
});

// The person's rights and where WeKan serves them.
const RIGHTS = [
  '- **Access and portability**: Member Settings / Privacy and my data / **Download my data** gives you everything WeKan holds about you, as JSON.',
  '- **Correction**: Member Settings / Edit Profile.',
  '- **Erasure**: Member Settings / Edit Profile / Delete or Anonymize, when allowed here; otherwise ask the contact below. Your data is removed from every place WeKan keeps it.',
  '- **Objection and restriction**: ask the contact below.',
];

function draftPrivacyNotice(inventory = INVENTORY) {
  const personal = inventory.filter(e => Array.isArray(e.categories) && !(e.categories.length === 1 && e.categories[0] === 'none'));
  const used = Object.keys(CATEGORY_TEXT).filter(c => personal.some(e => e.categories.includes(c)));
  return [
    '# Privacy notice',
    '',
    '**Who is responsible**: (the name and address of the operator of this WeKan - fill in).',
    '',
    '## What we store about you',
    '',
    ...used.map(c => `- ${CATEGORY_TEXT[c]}`),
    '',
    'Why: to run the boards you use and the accounts that use them - (your legal basis, for example contract or legitimate interest - fill in).',
    '',
    '## How long',
    '',
    'Your account and what you wrote are kept as long as the account and the boards they belong to. Sign-in addresses are kept for LOGIN_ADDRESS_RETENTION_DAYS (365 days by default), the administrators\' audit log for 365 days, and sessions, queued e-mails and import jobs from a day to 90 days. (Check these against the retention settings of this WeKan.)',
    '',
    '## Your rights',
    '',
    ...RIGHTS,
    '',
    '## Cookies',
    '',
    'WeKan uses one cookie, the login token that keeps you signed in. It is strictly necessary and needs no consent.',
    '',
    '## Contact',
    '',
    'The privacy contacts are listed below.',
    '',
  ].join('\n');
}

// The inventory as the Legal pages pane shows it: every collection holding
// personal data, what, why, and for how long.
function inventoryRows(inventory = INVENTORY) {
  return inventory
    .filter(e => Array.isArray(e.categories) && !(e.categories.length === 1 && e.categories[0] === 'none'))
    .map(e => ({
      collection: e.collection,
      categories: e.categories.join(', '),
      purpose: e.purpose,
      retention: (e.retention && e.retention.default) || '',
      erasure: e.erasure,
    }));
}

module.exports = { draftPrivacyNotice, inventoryRows, CATEGORY_TEXT };
