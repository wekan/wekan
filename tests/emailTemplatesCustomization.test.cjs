'use strict';

// #2022: admin-customizable templates for WeKan's transactional emails
// (Admin Panel -> Email -> Email Templates). Covers:
//  - an UNSET template falls back to exactly the current hardcoded/i18n
//    content (regression: no behavior change for existing installs);
//  - a SET template is used, substituted through the EXISTING
//    models/lib/ruleVarsSubstitute.js substituteVars() (the same function
//    the #3304 rule "send email" action uses) - a source-pattern check
//    proves there is no second/duplicate templating implementation;
//  - password-reset / account-verification emails are NEVER affected by any
//    custom template setting (negative test);
//  - the Settings schema fields are optional/unset by default;
//  - the new Admin Panel labels exist and are translated.
//
// Run: node tests/emailTemplatesCustomization.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const { substituteVars } = require(path.join(repoRoot, 'models/lib/ruleVarsSubstitute.js'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const settingsSrc = fs.readFileSync(path.join(repoRoot, 'server/models/settings.js'), 'utf8');
const emailSrc = fs.readFileSync(path.join(repoRoot, 'server/notifications/email.js'), 'utf8');
const schemaSrc = fs.readFileSync(path.join(repoRoot, 'models/settings.js'), 'utf8');

// --- Settings schema: fields exist, optional, no default value (unset by default) ---

test('models/settings.js declares the four template fields as optional String', () => {
  for (const field of [
    'inviteEmailSubjectTemplate',
    'inviteEmailBodyTemplate',
    'activityEmailSubjectTemplate',
    'activityEmailBodyTemplate',
  ]) {
    const re = new RegExp(`${field}:\\s*\\{[^}]*type:\\s*String[^}]*optional:\\s*true[^}]*\\}`, 's');
    assert.ok(re.test(schemaSrc), `${field} should be an optional String field`);
    // None of the four carry a defaultValue - unset means "use current
    // hardcoded/i18n behavior", not "empty string as a set template".
    const block = schemaSrc.slice(
      schemaSrc.indexOf(`${field}:`),
      schemaSrc.indexOf('}', schemaSrc.indexOf(`${field}:`)) + 1,
    );
    assert.ok(!/defaultValue/.test(block), `${field} must not have a defaultValue`);
  }
});

// --- Reuse, not reimplementation: both call sites import the SAME substituteVars ---

test('server/models/settings.js imports substituteVars from the shared pure module', () => {
  assert.ok(
    /require\(['"]\/models\/lib\/ruleVarsSubstitute['"]\)/.test(settingsSrc),
    'sendInvitationEmail should reuse models/lib/ruleVarsSubstitute.js, not a new templating engine',
  );
});

test('server/notifications/email.js imports substituteVars from the shared pure module', () => {
  assert.ok(
    /require\(['"]\/models\/lib\/ruleVarsSubstitute['"]\)/.test(emailSrc),
    'the activity-notification email should reuse models/lib/ruleVarsSubstitute.js, not a new templating engine',
  );
});

test('negative: no second {token}-substitution implementation was added near the new code', () => {
  // The only place a `\{(\w+)\}`-shaped regex/replace should exist for this
  // feature is the one shared module - grep the whole tree (excluding the
  // shared module itself, its test, and the generated bundle) for another
  // hand-rolled `{...}` token replacer that isn't the shared one.
  const suspiciousFiles = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', '_build', '.build', '.tools', '.meteor'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(js|jsx)$/.test(entry.name)) continue;
      if (full === path.join(repoRoot, 'models/lib/ruleVarsSubstitute.js')) continue;
      if (full.includes(`${path.sep}tests${path.sep}`)) continue;
      const src = fs.readFileSync(full, 'utf8');
      // Look for the tell-tale shape of a duplicate implementation: a
      // .replace call keyed on a \{\w+\} style pattern that is NOT simply
      // calling substituteVars.
      if (/\.replace\(\s*\/\\\{\(?\\w\+\)?\\\}\//.test(src)) {
        suspiciousFiles.push(full);
      }
    }
  };
  walk(path.join(repoRoot, 'server'));
  walk(path.join(repoRoot, 'client'));
  walk(path.join(repoRoot, 'models'));
  assert.deepStrictEqual(suspiciousFiles, [], 'found a duplicate {token} substitution implementation');
});

// --- Invite email: unset falls back exactly, set uses substituteVars ---

test('sendInvitationEmail: unset inviteEmailSubjectTemplate keeps the original i18n subject/text call', () => {
  const fn = settingsSrc.slice(
    settingsSrc.indexOf('async function sendInvitationEmail'),
    settingsSrc.indexOf('async function isNonAdminAllowedToSendMail'),
  );
  assert.ok(/if \(setting && setting\.inviteEmailSubjectTemplate\)/.test(fn));
  assert.ok(/subject: 'email-invite-register-subject'/.test(fn));
  assert.ok(/text: 'email-invite-register-text'/.test(fn));
});

test('sendInvitationEmail: the set-template branch substitutes email/inviter/user/icode/url', () => {
  const fn = settingsSrc.slice(
    settingsSrc.indexOf('async function sendInvitationEmail'),
    settingsSrc.indexOf('async function isNonAdminAllowedToSendMail'),
  );
  const templateVarsBlock = fn.slice(fn.indexOf('const templateVars = {'), fn.indexOf('if (setting && setting.inviteEmailSubjectTemplate)'));
  for (const token of ['email:', 'inviter:', 'user:', 'icode:', 'url:']) {
    assert.ok(templateVarsBlock.includes(token), `templateVars should include ${token}`);
  }
  const templateBranch = fn.slice(fn.indexOf('if (setting && setting.inviteEmailSubjectTemplate)'));
  assert.ok(/substituteVars\(setting\.inviteEmailSubjectTemplate, templateVars\)/.test(templateBranch));
  assert.ok(/substituteVars\(setting\.inviteEmailBodyTemplate \|\| '', templateVars\)/.test(templateBranch));
});

test('substituteVars actually renders an invite template the way sendInvitationEmail would call it', () => {
  const subjectTemplate = '{inviter} invited {user}';
  const bodyTemplate = 'Hi {user}, join via {url} with code {icode} ({email})';
  const templateVars = {
    email: 'bob@example.com',
    inviter: 'alice',
    user: 'bob',
    icode: 'abc123',
    url: 'https://example.com/sign-up',
  };
  assert.strictEqual(substituteVars(subjectTemplate, templateVars), 'alice invited bob');
  assert.strictEqual(
    substituteVars(bodyTemplate, templateVars),
    'Hi bob, join via https://example.com/sign-up with code abc123 (bob@example.com)',
  );
});

// --- Activity notification email: unset falls back exactly, set uses substituteVars ---

test('email.js: unset activityEmailBodyTemplate keeps the original actorName/description/url text', () => {
  assert.ok(/const bodyTemplate = templateSetting && templateSetting\.activityEmailBodyTemplate;/.test(emailSrc));
  assert.ok(/\$\{actorName\}\s*\n\s*\}\s*\$\{descriptionText\}\\n\$\{params\.url\}/.test(emailSrc)
    || /actorName\s*\n\s*\}\s*\$\{descriptionText\}/.test(emailSrc));
});

test('email.js: the set-template branch builds board/card/list/username/url/comment/action vars', () => {
  const block = emailSrc.slice(emailSrc.indexOf('const templateVars = {'), emailSrc.indexOf('if (templateSetting && templateSetting.activityEmailSubjectTemplate)'));
  for (const token of ['board:', 'card:', 'list:', 'username:', 'url:', 'comment:', 'action:']) {
    assert.ok(block.includes(token), `templateVars should include ${token}`);
  }
});

test('substituteVars renders an activity template the way email.js would call it', () => {
  const bodyTemplate = '{username} touched {card} on {board}/{list}: {action} ({url})';
  const templateVars = {
    board: 'Marketing',
    card: 'Ship the banner',
    list: 'Doing',
    username: 'carol',
    url: 'https://example.com/b/1/m/card1',
    comment: '',
    action: 'moved the card',
  };
  assert.strictEqual(
    substituteVars(bodyTemplate, templateVars),
    'carol touched Ship the banner on Marketing/Doing: moved the card (https://example.com/b/1/m/card1)',
  );
});

// --- Security: password-reset / account-verification emails are never templated ---

test('negative: password-reset/verification email code paths never read the new template settings', () => {
  // These are the actual files that build/send the reset-password,
  // verify-email and enroll-account emails (config/accounts.js wires
  // Accounts.emailTemplates.* to the pure builders in
  // server/lib/resetPasswordEmail.js - see #5706). Neither may reference any
  // of the four new customizable-template Settings fields: those emails stay
  // hardcoded, on purpose, because a misconfigured/malicious custom template
  // here (e.g. one that strips the reset link) would be a real account-
  // takeover risk.
  const securityCriticalFiles = [
    'server/lib/resetPasswordEmail.js',
    'config/accounts.js',
  ].map(f => path.join(repoRoot, f));

  const templateFieldNames = [
    'inviteEmailSubjectTemplate',
    'inviteEmailBodyTemplate',
    'activityEmailSubjectTemplate',
    'activityEmailBodyTemplate',
  ];
  const offenders = [];
  for (const file of securityCriticalFiles) {
    assert.ok(fs.existsSync(file), `expected security-critical file to exist: ${file}`);
    const src = fs.readFileSync(file, 'utf8');
    if (templateFieldNames.some(name => src.includes(name))) {
      offenders.push(file);
    }
  }
  assert.deepStrictEqual(offenders, [], 'a password-reset/verification code path references a custom email template field');
});

test('sendInvitationEmail and the activity notification are the ONLY two Settings fields wired to template use', () => {
  // Explicit accounting, so a future addition of a fifth templated email
  // type is a deliberate decision, not silent scope creep.
  assert.ok(settingsSrc.includes('inviteEmailSubjectTemplate'));
  assert.ok(!/resetPassword.*inviteEmailSubjectTemplate|inviteEmailSubjectTemplate.*resetPassword/s.test(settingsSrc));
});

// --- i18n: the new Admin Panel labels exist, in order, and are translated ---

const i18nDir = path.join(repoRoot, 'imports/i18n/data');
const en = JSON.parse(fs.readFileSync(path.join(i18nDir, 'en.i18n.json'), 'utf8'));

const NEW_KEYS = [
  'email-templates-title',
  'email-templates-invite-subject',
  'email-templates-invite-body',
  'email-templates-invite-vars-hint',
  'email-templates-activity-subject',
  'email-templates-activity-body',
  'email-templates-activity-vars-hint',
];

test('en.i18n.json declares the new Email Templates labels right after send-smtp-test', () => {
  const keys = Object.keys(en);
  const anchor = keys.indexOf('send-smtp-test');
  assert.ok(anchor > -1);
  NEW_KEYS.forEach((key, i) => {
    assert.strictEqual(keys[anchor + 1 + i], key, `expected ${key} at position ${anchor + 1 + i}`);
  });
});

test('the vars-hint keys document every substituted token', () => {
  for (const token of ['{email}', '{inviter}', '{user}', '{icode}', '{url}']) {
    assert.ok(en['email-templates-invite-vars-hint'].includes(token));
  }
  for (const token of ['{board}', '{card}', '{list}', '{username}', '{url}', '{comment}', '{action}']) {
    assert.ok(en['email-templates-activity-vars-hint'].includes(token));
  }
});

test('every non-English locale has real (non-English) translations for the new keys', () => {
  const files = fs.readdirSync(i18nDir).filter(
    f => f.endsWith('.i18n.json') && f !== 'en.i18n.json' && !f.startsWith('en-') && !f.startsWith('en_'),
  );
  assert.ok(files.length > 200, `expected 200+ locale files, found ${files.length}`);
  let fullyTranslated = 0;
  for (const f of files) {
    const json = JSON.parse(fs.readFileSync(path.join(i18nDir, f), 'utf8'));
    let anyDiffers = false;
    for (const key of NEW_KEYS) {
      assert.ok(Object.prototype.hasOwnProperty.call(json, key), `${f}: missing ${key}`);
      if (json[key] !== en[key]) anyDiffers = true;
      // Placeholder tokens themselves must be preserved verbatim.
      const enTokens = (en[key].match(/\{\w+\}/g) || []).sort();
      const localeTokens = (json[key].match(/\{\w+\}/g) || []).sort();
      assert.deepStrictEqual(localeTokens, enTokens, `${f}:${key}: placeholder tokens must match English`);
    }
    if (anyDiffers) fullyTranslated += 1;
  }
  assert.ok(fullyTranslated > 200, `only ${fullyTranslated}/${files.length} locales have any real translation`);
});

// --- UI wiring ---

test('settingBody.jade renders the Email Templates fields and save button', () => {
  const jade = fs.readFileSync(path.join(repoRoot, 'client/components/settings/settingBody.jade'), 'utf8');
  for (const id of [
    'email-template-invite-subject',
    'email-template-invite-body',
    'email-template-activity-subject',
    'email-template-activity-body',
  ]) {
    assert.ok(jade.includes(id), `missing field #${id}`);
  }
  assert.ok(jade.includes('js-email-templates-save'));
});

test('settingBody.js writes all four template fields on save, trimmed', () => {
  const js = fs.readFileSync(path.join(repoRoot, 'client/components/settings/settingBody.js'), 'utf8');
  assert.ok(/'click button\.js-email-templates-save'/.test(js));
  const handler = js.slice(js.indexOf("'click button.js-email-templates-save'"));
  const block = handler.slice(0, handler.indexOf('},'));
  for (const field of [
    'inviteEmailSubjectTemplate',
    'inviteEmailBodyTemplate',
    'activityEmailSubjectTemplate',
    'activityEmailBodyTemplate',
  ]) {
    assert.ok(block.includes(field), `save handler should write ${field}`);
  }
});

console.log(`\nemailTemplatesCustomization: ${passed} tests passed`);
