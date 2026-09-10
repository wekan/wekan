'use strict';

// #1408: a generic notification email subject ("WeKan notification", the
// site name, or the raw activity type) makes Gmail and other threading
// clients group every notification together regardless of which card it is
// about. The fix (already landed, see server/lib/activityNotificationTitle.js
// and its use in server/models/activities.js + server/notifications/email.js)
// is that any card-related activity (due date, comment, assignment, etc.)
// builds its notification title as "[Board] Card" via
// ACTIVITY_NOTIFICATION_TITLE.CARD, and server/notifications/email.js uses
// that formatted title as the DEFAULT email subject - unconditionally, with
// no admin configuration required. #2022 later added an optional admin
// override (Admin Panel -> Email Templates,
// `activityEmailSubjectTemplate`), but that override only replaces the
// subject when an admin explicitly sets it; the out-of-the-box subject
// already carries the board and card name on every install.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

const titleSourcePath = path.join(
  root,
  'server',
  'lib',
  'activityNotificationTitle.js',
);
const titleSource = fs
  .readFileSync(titleSourcePath, 'utf8')
  .replace(
    'export const ACTIVITY_NOTIFICATION_TITLE',
    'const ACTIVITY_NOTIFICATION_TITLE',
  )
  .replace(
    'export function formatActivityNotificationTitle',
    'function formatActivityNotificationTitle',
  )
  .concat(
    '\nresult = { ACTIVITY_NOTIFICATION_TITLE, formatActivityNotificationTitle };',
  );
const titleContext = { result: null };
vm.runInNewContext(titleSource, titleContext, { filename: titleSourcePath });
const {
  ACTIVITY_NOTIFICATION_TITLE,
  formatActivityNotificationTitle,
} = titleContext.result;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('#1408 the default subject for a card activity (e.g. a due date change) includes board and card', () => {
  const subject = formatActivityNotificationTitle(
    ACTIVITY_NOTIFICATION_TITLE.CARD,
    { board: 'Roadmap', card: 'Ship the release' },
    () => assert.fail('the hardcoded card-title layout must not need translation'),
    'en',
  );
  assert.equal(subject, '[Roadmap] Ship the release');
  assert.match(subject, /Roadmap/);
  assert.match(subject, /Ship the release/);
});

test('#1408 negative: the default subject is not a generic constant string', () => {
  const subject = formatActivityNotificationTitle(
    ACTIVITY_NOTIFICATION_TITLE.CARD,
    { board: 'Roadmap', card: 'Ship the release' },
    () => 'ignored',
    'en',
  );
  assert.notEqual(subject, 'WeKan notification');
  assert.notEqual(subject, 'WeKan');
});

const activitiesSource = fs.readFileSync(
  path.join(root, 'server', 'models', 'activities.js'),
  'utf8',
);

test('#1408 every card-related activity is tagged with the card-title notification layout', () => {
  const cardBlockStart = activitiesSource.indexOf('if (activity.cardId) {');
  assert.ok(cardBlockStart >= 0);
  const cardBlockEnd = activitiesSource.indexOf(
    'ACTIVITY_NOTIFICATION_TITLE.CARD',
    cardBlockStart,
  );
  assert.ok(
    cardBlockEnd > cardBlockStart,
    'activity.cardId handling must set title = ACTIVITY_NOTIFICATION_TITLE.CARD',
  );
});

const emailSource = fs.readFileSync(
  path.join(root, 'server', 'notifications', 'email.js'),
  'utf8',
);

test('#1408 the email subject is built from the board/card notification title by default', () => {
  assert.match(
    emailSource,
    /let subject = safeEmailSubject\(formatActivityNotificationTitle\(/,
  );
});

test('#1408 an admin-configured subject template only overrides the default, it is not required for it', () => {
  // The template override is a separate, later step (#2022): it re-assigns
  // `subject` only inside an `if (templateSetting && ...)` guard, so an
  // unconfigured install (the default on every existing install) keeps the
  // board/card subject built above, unconditionally.
  const templateGuard = emailSource.indexOf(
    'if (templateSetting && templateSetting.activityEmailSubjectTemplate) {',
  );
  const defaultSubject = emailSource.indexOf(
    'let subject = safeEmailSubject(formatActivityNotificationTitle(',
  );
  assert.ok(defaultSubject >= 0 && templateGuard > defaultSubject);
});

console.log(`\nnotificationEmailSubjectFormat: all ${passed} tests passed`);
