'use strict';

// A draft of the records of processing activities (docs/Compliance/README.md
// row 2.2; [GDPR] Art. 30(1)(a)-(g), [LGPD] Art. 37) for the operator - the
// controller - to complete: what this WeKan stores about people, why, for how
// long ON THIS SERVER, and which outside services it hands personal data to,
// as this server is set up. Admin Panel / Settings / Legal pages offers it as
// Markdown to copy.
//
// Built from the personal-data inventory (models/lib/personalDataInventory.js)
// and the facts the server reads (server/methods/legalPages.js
// getRopaDraft), so it changes when they do. Pure: tests/ropaDraft.test.cjs.

const { INVENTORY } = require('./personalDataInventory');

// The outside services, and when this server hands them personal data.
const SERVICES = Object.freeze([
  ['pwnedPasswords', 'Have I Been Pwned (api.pwnedpasswords.com)', 'the first 5 hex digits of a new password\'s SHA-1 - never the password or who chose it (PASSWORD_CHECK_PWNED)'],
  ['defaultAvatar', 'The default avatar service', 'what DEFAULT_AVATAR_URL puts in the address, for a user without an avatar of their own'],
  ['mail', 'The mail server', 'e-mail addresses, names and the text of notifications (MAIL_URL)'],
  ['objectStorage', 'Object storage (S3, Azure, Google Cloud Storage or WebDAV)', 'attachments and avatars, stored there (Admin Panel / Attachments / Storage)'],
  ['webhooks', 'Outgoing webhooks', 'card and board events - usernames and card text - sent to the addresses board admins set'],
  ['activityPub', 'ActivityPub (the fediverse)', 'public boards and their authors\' names, to other servers that follow them'],
]);

// One Markdown table cell: the backslash escaped first, then the pipe, and a
// line break made a space (as docs/Databases/FerretDB/1/SpeedTest/report.cjs
// mdCell does, after CodeQL js/incomplete-sanitization).
const cell = value => String(value === undefined || value === null ? '' : value)
  .replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

const personal = inventory => inventory.filter(e => Array.isArray(e.categories) && !(e.categories.length === 1 && e.categories[0] === 'none'));

// values: { [ENV_NAME]: value set on this server, or '' }, services: { [id]: true }.
function ropaDraft({ inventory = INVENTORY, values = {}, services = {}, today = new Date() } = {}) {
  const rows = personal(inventory);
  const retention = e => {
    const env = e.retention && e.retention.env;
    const set = env && values[env] !== undefined && values[env] !== '' ? ` - set here: ${env}=${values[env]}` : '';
    return `${(e.retention && e.retention.default) || '(fill in)'}${set}`;
  };
  const used = SERVICES.filter(([id]) => services[id] === true);
  return [
    '# Records of processing activities (draft)',
    '',
    `Drafted on ${today.toISOString().slice(0, 10)} from this WeKan's settings. Complete the parts marked "fill in" and keep it up to date ([GDPR] Art. 30).`,
    '',
    '## Controller',
    '',
    '- Name and contact: (fill in)',
    '- Data protection officer: (fill in, if any)',
    '- Representative in the EU: (fill in, if any)',
    '',
    '## Processing: running the boards',
    '',
    '- Purpose: planning and tracking work on shared boards, and the accounts that use them.',
    '- Data subjects: the people who have an account here, and people named on the boards.',
    '- Legal basis: (fill in - for example contract, or legitimate interest).',
    '- Security measures: see Admin Panel / Problems / Compliance and docs/Security/Compliance.',
    '',
    '## What is stored, why and for how long',
    '',
    '| Collection | Categories | Purpose | Kept | Erasure |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map(e => `| ${cell(e.collection)} | ${cell(e.categories.join(', '))} | ${cell(e.purpose)} | ${cell(retention(e))} | ${cell(e.erasure)} |`),
    '',
    '## Recipients outside this server',
    '',
    ...(used.length ? used.map(([, name, what]) => `- ${name}: ${what}.`) : ['- None, as this server is set up.']),
    '- Your hosting provider, backups and anything else around WeKan: (fill in).',
    '',
    '## Transfers to third countries',
    '',
    '(fill in - where the server, its backups and the services above are.)',
    '',
  ].join('\n');
}

module.exports = { SERVICES, ropaDraft };
